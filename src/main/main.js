'use strict';
const fs = require('fs');
const path = require('path');
const {
  app, BrowserWindow, ipcMain, nativeTheme, shell, Menu, screen, dialog,
} = require('electron');
const { resolveDataDir } = require('./paths');

// Thư mục dữ liệu phải được đặt TRƯỚC khi app sẵn sàng / trước khi tạo session.
const DATA_DIR = resolveDataDir();
app.setPath('userData', DATA_DIR);
app.setPath('sessionData', DATA_DIR);
if (process.platform === 'win32') app.setAppUserModelId('vn.tabmanagersp.app');

const { CHROME_UA } = require('./useragent');
const { Store } = require('./store');
const { TabManager } = require('./tabs');
const { detectBrowsers, launchBrowser, readBookmarks } = require('./browsers');
const { PasswordStore, originOf } = require('./passwords');
const { popupTemplate, pageContextMenu } = require('./menus');

app.userAgentFallback = CHROME_UA;

const ROOT = path.join(__dirname, '..');
const ICON = path.join(ROOT, 'renderer', 'assets', 'icon.png');
const THEME = {
  light: { bar: '#dee3ea', symbol: '#1f2328' },
  dark: { bar: '#1b1c1f', symbol: '#e8e8ea' },
};

let win = null;
let store = null;
let tabs = null;
let passwords = null;
let pwPrompt = null;               // lời nhắc "Lưu mật khẩu?" đang chờ
const usernameHints = new Map();   // webContents.id -> { username, at } (đăng nhập nhiều bước)
const downloadedFiles = new Set();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(start);
}

app.on('window-all-closed', () => app.quit());

function partitionsDir() {
  return path.join(app.getPath('sessionData'), 'Partitions');
}

// Xóa thư mục dữ liệu của các hồ sơ đã xóa ở lần chạy trước (lúc đó file còn bị khóa).
function purgePendingDeletes() {
  const keep = [];
  for (const id of store.data.pendingDelete) {
    if (!/^[a-z0-9_-]+$/i.test(id)) continue;
    try {
      fs.rmSync(path.join(partitionsDir(), id), { recursive: true, force: true });
    } catch {
      keep.push(id);
    }
  }
  store.data.pendingDelete = keep;
  store.save();
}

function overlayColors() {
  const t = nativeTheme.shouldUseDarkColors ? THEME.dark : THEME.light;
  return { color: t.bar, symbolColor: t.symbol, height: 40 };
}

function savedBounds() {
  const ws = store.data.windowState;
  if (!ws || !ws.width || !ws.height) return { width: 1280, height: 820 };
  const visible = screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return ws.x < a.x + a.width - 50 && ws.x + ws.width > a.x + 50 && ws.y >= a.y - 10 && ws.y < a.y + a.height - 50;
  });
  return visible ? { x: ws.x, y: ws.y, width: ws.width, height: ws.height } : { width: ws.width, height: ws.height };
}

function sendState() {
  if (!win || win.isDestroyed()) return;
  clearTimeout(sendState.timer);
  sendState.timer = setTimeout(() => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('state', fullState());
  }, 16);
}

function fullState() {
  const active = tabs.active;
  const origin = active && !active.temp ? originOf(active.url) : null;
  return {
    ...tabs.serialize(),
    profiles: store.profiles,
    settings: store.settings,
    bookmarks: store.bookmarks,
    closedCount: tabs.closedStack.length,
    activePwCount: origin ? passwords.count(active.profileId, origin) : 0,
    pwPrompt: pwPrompt && tabs.get(pwPrompt.tabId)
      ? { id: pwPrompt.id, tabId: pwPrompt.tabId, host: hostOf(pwPrompt.origin), username: pwPrompt.username, type: pwPrompt.type }
      : null,
  };
}

function hostOf(url) {
  try { return new URL(url).host; } catch { return url; }
}

function uiCommand(cmd, arg) {
  if (!win || win.isDestroyed()) return;
  if (cmd === 'focus-address' || cmd === 'find') win.webContents.focus();
  win.webContents.send('ui:command', cmd, arg);
}

// Phím tắt dùng chung cho giao diện và cho mọi trang web trong tab.
function handleShortcut(input) {
  if (input.type !== 'keyDown') return false;
  const ctrl = process.platform === 'darwin' ? input.meta : input.control;
  const { key, shift, alt } = input;
  const k = key.length === 1 ? key.toLowerCase() : key;
  const active = tabs.active;
  const id = active ? active.id : null;

  if (ctrl && !shift && !alt && k === 't') { uiCommand('new-tab-menu'); return true; }
  if (ctrl && shift && k === 't') { tabs.reopenClosed(); return true; }
  if (ctrl && shift && k === 'n') { tabs.createTab({ temp: true }); return true; }
  if ((ctrl && !shift && k === 'w') || (ctrl && key === 'F4')) { if (id) tabs.close(id); return true; }
  if (ctrl && key === 'Tab') { tabs.cycle(shift ? -1 : 1); return true; }
  if (ctrl && key === 'PageDown') { tabs.cycle(1); return true; }
  if (ctrl && key === 'PageUp') { tabs.cycle(-1); return true; }
  if (ctrl && !shift && !alt && /^[1-9]$/.test(key)) { tabs.activateIndex(key === '9' ? -1 : Number(key) - 1); return true; }
  if ((ctrl && k === 'l') || (alt && k === 'd') || key === 'F6') { uiCommand('focus-address'); return true; }
  if (key === 'F5' || (ctrl && k === 'r')) { if (id) tabs.reload(id, shift || (ctrl && key === 'F5')); return true; }
  if (alt && key === 'ArrowLeft') { if (id) tabs.goBack(id); return true; }
  if (alt && key === 'ArrowRight') { if (id) tabs.goForward(id); return true; }
  if (alt && key === 'Home') { if (id) tabs.home(id); return true; }
  if (ctrl && k === 'f') { if (id) uiCommand('find'); return true; }
  if (ctrl && (key === '=' || key === '+')) { if (id) tabs.zoom(id, 1); return true; }
  if (ctrl && (key === '-' || key === '_')) { if (id) tabs.zoom(id, -1); return true; }
  if (ctrl && key === '0') { if (id) tabs.zoom(id, 0); return true; }
  if (ctrl && !shift && k === 'd') { if (id) uiCommand('bookmark-page'); return true; }
  if (ctrl && shift && k === 'b') {
    store.updateSettings({ showBookmarks: !store.settings.showBookmarks });
    sendState();
    return true;
  }
  if (ctrl && !shift && k === 'p') { if (active && active.view) active.view.webContents.print(); return true; }
  if (ctrl && shift && alt && k === 'i') { win.webContents.openDevTools({ mode: 'detach' }); return true; }
  if (key === 'F12' || (ctrl && shift && k === 'i')) { if (id) tabs.toggleDevTools(id); return true; }
  if (key === 'F11') { win.setFullScreen(!win.isFullScreen()); return true; }
  return false;
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  win = new BrowserWindow({
    ...savedBounds(),
    minWidth: 720,
    minHeight: 460,
    show: false,
    title: 'TabManagerSP',
    icon: ICON,
    backgroundColor: nativeTheme.shouldUseDarkColors ? THEME.dark.bar : THEME.light.bar,
    titleBarStyle: 'hidden',
    titleBarOverlay: isMac ? undefined : overlayColors(),
    trafficLightPosition: { x: 14, y: 13 },
    webPreferences: {
      preload: path.join(ROOT, 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  if (store.data.windowState && store.data.windowState.maximized) win.maximize();

  tabs = new TabManager({
    win,
    store,
    onShortcut: (input) => handleShortcut(input),
    buildContextMenu: (tab, wc, params, ownerWindow) => pageContextMenu({
      manager: tabs, tab, wc, params, store, ownerWindow,
    }),
  });
  tabs.on('changed', sendState);
  tabs.on('title', () => {
    const a = tabs.active;
    win.setTitle(a && a.title ? `${a.title} — TabManagerSP` : 'TabManagerSP');
  });
  tabs.on('download', (info) => {
    if (info.state === 'completed' && info.path) downloadedFiles.add(info.path);
    win.webContents.send('download', info);
  });

  win.webContents.on('before-input-event', (e, input) => {
    if (handleShortcut(input)) e.preventDefault();
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.setVisualZoomLevelLimits(1, 1);

  // Nút Back/Forward trên chuột (Windows).
  win.on('app-command', (e, cmd) => {
    const a = tabs.active;
    if (!a) return;
    if (cmd === 'browser-backward') tabs.goBack(a.id);
    if (cmd === 'browser-forward') tabs.goForward(a.id);
  });

  win.on('close', () => {
    const b = win.getNormalBounds();
    store.data.windowState = { ...b, maximized: win.isMaximized() };
    tabs.saveSession();
    store.saveNow();
  });
  win.on('closed', () => { win = null; });

  nativeTheme.on('updated', () => {
    if (!win || win.isDestroyed()) return;
    if (!isMac) win.setTitleBarOverlay(overlayColors());
    win.setBackgroundColor(nativeTheme.shouldUseDarkColors ? THEME.dark.bar : THEME.light.bar);
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(ROOT, 'renderer', 'index.html'));
}

// ------------------------------------------------------------------ IPC
function fromUi(handler) {
  return (event, ...args) => {
    if (!win || event.sender !== win.webContents) return undefined;
    return handler(...args);
  };
}

function registerIpc() {
  ipcMain.handle('state:get', fromUi(() => fullState()));
  ipcMain.handle('app:info', fromUi(() => ({
    version: app.getVersion(),
    dataDir: DATA_DIR,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    platform: process.platform,
  })));

  let restored = false;
  ipcMain.on('ui:ready', fromUi(() => {
    if (!restored && store.settings.restoreSession) tabs.restoreSession();
    restored = true;
    sendState();
  }));
  ipcMain.on('ui:bounds', fromUi((b) => tabs.setContentBounds(b)));
  ipcMain.handle('ui:overlay', fromUi((open) => tabs.setOverlay(open)));
  ipcMain.handle('ui:popup-menu', fromUi(({ template, x, y }) => popupTemplate(win, template, x, y)));

  ipcMain.on('tab:new', fromUi((opts = {}) => {
    const tab = tabs.createTab({
      profileId: opts.profileId,
      temp: !!opts.temp,
      url: opts.url,
      background: !!opts.background,
      afterId: opts.afterId,
    });
    if (tab && tab.showStart) uiCommand('focus-address');
  }));

  ipcMain.on('tab:action', fromUi(({ action, id, value } = {}) => {
    const tab = tabs.get(id);
    switch (action) {
      case 'activate': tabs.activate(id); break;
      case 'close': tabs.close(id); break;
      case 'closeOthers': for (const t of [...tabs.tabs]) if (t.id !== id) tabs.close(t.id); break;
      case 'closeRight': {
        const i = tabs.tabs.findIndex((t) => t.id === id);
        for (const t of tabs.tabs.slice(i + 1)) tabs.close(t.id);
        break;
      }
      case 'duplicate':
        if (tab) {
          tabs.createTab({
            profileId: tab.profileId, temp: tab.temp, partition: tab.partition, tempLabel: tab.tempLabel, url: tab.url, afterId: tab.id,
          });
        }
        break;
      case 'newSameProfile':
        if (tab) {
          const t = tabs.createTab({
            profileId: tab.profileId, temp: tab.temp, partition: tab.partition, tempLabel: tab.tempLabel, afterId: tab.id,
          });
          if (t && t.showStart) uiCommand('focus-address');
        }
        break;
      case 'navigate': tabs.navigate(id, value); break;
      case 'back': tabs.goBack(id); break;
      case 'forward': tabs.goForward(id); break;
      case 'reload': tabs.reload(id, !!value); break;
      case 'stop': tabs.stop(id); break;
      case 'home': tabs.home(id); break;
      case 'zoom': tabs.zoom(id, Number(value) || 0); break;
      case 'mute': tabs.toggleMute(id); break;
      case 'find': tabs.find(id, value && value.text, !(value && value.forward === false)); break;
      case 'stopFind': tabs.stopFind(id); break;
      case 'devtools': tabs.toggleDevTools(id); break;
      case 'print': if (tab && tab.view) tab.view.webContents.print(); break;
      case 'move': tabs.move(id, Number(value)); break;
      case 'reopen': tabs.reopenClosed(); break;
      case 'toggleGroup': tabs.toggleGroup(String(value)); break;
      case 'closeGroup': tabs.closeGroup(String(value)); break;
      case 'moveGroup': tabs.moveGroup(String(value && value.partition), Number(value && value.index)); break;
      case 'openInProfile': if (value) tabs.openInProfile(value.profileId, value.url); break;
      case 'focus': if (tab && tab.view && !tab.showStart) tab.view.webContents.focus(); break;
      default: break;
    }
  }));

  ipcMain.handle('profile:create', fromUi((data) => {
    const p = store.createProfile(data || {});
    sendState();
    return p;
  }));
  ipcMain.handle('profile:update', fromUi((id, patch) => {
    const p = store.updateProfile(id, patch || {});
    sendState();
    return p;
  }));
  ipcMain.handle('profile:move', fromUi((id, delta) => {
    store.moveProfile(id, delta);
    sendState();
  }));
  ipcMain.handle('profile:clear', fromUi(async (id) => {
    if (!store.getProfile(id)) return false;
    await tabs.clearProfileData(id);
    return true;
  }));
  ipcMain.handle('profile:delete', fromUi(async (id) => {
    if (!store.getProfile(id)) return false;
    tabs.closeProfileTabs(id);
    try { await tabs.clearProfileData(id); } catch { /* bỏ qua */ }
    store.removeProfile(id);
    passwords.removeProfile(id);
    const dir = path.join(partitionsDir(), id);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* file còn khóa */ }
    if (fs.existsSync(dir) && !store.data.pendingDelete.includes(id)) store.data.pendingDelete.push(id);
    store.save();
    sendState();
    return true;
  }));

  ipcMain.handle('settings:update', fromUi((patch) => {
    const s = store.updateSettings(patch || {});
    if (patch && patch.groupTabs) tabs.normalizeGroups();
    sendState();
    return s;
  }));

  registerBookmarkIpc();
  registerPasswordIpc();

  ipcMain.handle('browsers:detect', fromUi(() => detectBrowsers()));
  ipcMain.handle('browsers:launch', fromUi((args) => {
    try {
      return launchBrowser(args || {});
    } catch (err) {
      return { error: err.message };
    }
  }));

  ipcMain.on('app:open-data-dir', fromUi(() => shell.openPath(DATA_DIR)));
  ipcMain.on('app:open-external', fromUi((url) => {
    if (/^https?:\/\//i.test(url || '')) shell.openExternal(url);
  }));
  ipcMain.on('app:show-item', fromUi((p) => {
    if (downloadedFiles.has(p)) shell.showItemInFolder(p);
  }));
}

// ------------------------------------------------------------------ dấu trang
function registerBookmarkIpc() {
  ipcMain.handle('bm:add', fromUi((data) => { const b = store.addBookmark(data || {}); sendState(); return b; }));
  ipcMain.handle('bm:update', fromUi((id, patch) => { const b = store.updateBookmark(id, patch || {}); sendState(); return b; }));
  ipcMain.handle('bm:remove', fromUi((id) => { const r = store.removeBookmark(id); sendState(); return r; }));
  ipcMain.handle('bm:move', fromUi((id, index) => { store.moveBookmark(id, Number(index)); sendState(); }));
  ipcMain.handle('bm:import', fromUi((args) => {
    try {
      const { items, label } = readBookmarks(args || {});
      const count = store.importBookmarks(items, `Đã nhập từ ${label}`);
      sendState();
      return { count };
    } catch (err) {
      return { error: err.message };
    }
  }));
}

// ------------------------------------------------------------------ mật khẩu
// Chỉ nhận yêu cầu từ khung chính của tab thuộc một hồ sơ (không áp dụng cho tab ẩn danh).
// Nguồn gốc (origin) luôn lấy từ khung gửi tin, không tin dữ liệu do trang tự khai.
function pageContext(event) {
  const wc = event.sender;
  const frame = event.senderFrame;
  if (!frame || frame !== wc.mainFrame) return null;
  const origin = originOf(frame.url);
  if (!origin) return null;
  const tab = tabs.ownerTab(wc);
  if (!tab || tab.temp || !store.getProfile(tab.profileId)) return null;
  return { wc, tab, profileId: tab.profileId, origin };
}

function usernameHint(wcId) {
  const h = usernameHints.get(wcId);
  return h && Date.now() - h.at < 10 * 60 * 1000 ? h.username : '';
}

function registerPasswordIpc() {
  ipcMain.handle('pm:query', (event) => {
    const ctx = pageContext(event);
    if (!ctx) return null;
    const hint = usernameHint(ctx.wc.id);
    const list = passwords.list(ctx.profileId, ctx.origin);
    const accounts = list.map((i) => ({ username: i.username }));
    accounts.sort((a, b) => (b.username === hint) - (a.username === hint));
    return { accounts, hint, autofill: !!store.settings.autofillPasswords };
  });

  ipcMain.handle('pm:get', (event, { username } = {}) => {
    const ctx = pageContext(event);
    if (!ctx) return null;
    const item = passwords.find(ctx.profileId, ctx.origin, String(username || ''));
    if (!item) return null;
    passwords.touch(item);
    return passwords.passwordOf(item);
  });

  ipcMain.on('pm:username', (event, { username } = {}) => {
    const ctx = pageContext(event);
    if (!ctx || !username) return;
    usernameHints.set(ctx.wc.id, { username: String(username).slice(0, 200), at: Date.now() });
  });

  ipcMain.on('pm:submit', (event, data = {}) => {
    const ctx = pageContext(event);
    if (!ctx || !store.settings.offerSavePasswords) return;
    const password = String(data.password || '');
    let username = String(data.username || '').trim().slice(0, 200);
    if (!password || password.length > 500) return;
    if (!username) username = usernameHint(ctx.wc.id);
    if (passwords.isNever(ctx.profileId, ctx.origin)) return;
    const existing = passwords.find(ctx.profileId, ctx.origin, username);
    if (existing && passwords.passwordOf(existing) === password) {
      passwords.touch(existing);
      return;
    }
    pwPrompt = {
      id: `pp${Date.now()}`, tabId: ctx.tab.id, profileId: ctx.profileId, origin: ctx.origin, username, password, type: existing ? 'update' : 'save',
    };
    sendState();
  });

  ipcMain.handle('pm:prompt', fromUi(({ id, action, username } = {}) => {
    if (!pwPrompt || pwPrompt.id !== id) return false;
    const p = pwPrompt;
    pwPrompt = null;
    if (action === 'save') passwords.upsert(p.profileId, p.origin, String(username !== undefined ? username : p.username).trim(), p.password);
    if (action === 'never') passwords.addNever(p.profileId, p.origin);
    sendState();
    return true;
  }));

  // Điền tài khoản đã lưu vào tab đang mở (từ biểu tượng chìa khóa trên thanh địa chỉ).
  ipcMain.handle('pm:fill-active', fromUi(({ username } = {}) => {
    const tab = tabs.active;
    if (!tab || !tab.view || tab.temp) return false;
    const wc = tab.view.webContents;
    const origin = originOf(wc.mainFrame.url);
    const item = origin && passwords.find(tab.profileId, origin, String(username || ''));
    if (!item) return false;
    const password = passwords.passwordOf(item);
    if (password === null) return false;
    passwords.touch(item);
    wc.mainFrame.send('pm:fill', { username: item.username, password });
    return true;
  }));

  ipcMain.handle('pm:accounts-active', fromUi(() => {
    const tab = tabs.active;
    if (!tab || tab.temp) return [];
    const origin = originOf(tab.url);
    return origin ? passwords.list(tab.profileId, origin).map((i) => i.username) : [];
  }));

  ipcMain.handle('pm:summary', fromUi(() => passwords.summary()));
  ipcMain.handle('pm:reveal', fromUi((id) => passwords.reveal(id)));
  ipcMain.handle('pm:remove', fromUi((id) => { const r = passwords.remove(id); sendState(); return r; }));
  ipcMain.handle('pm:remove-never', fromUi(({ profileId, origin } = {}) => { passwords.removeNever(profileId, origin); return true; }));
  ipcMain.handle('pm:add', fromUi(({ profileId, url, username, password } = {}) => {
    const origin = originOf(url || '');
    if (!origin || !store.getProfile(profileId) || !password) return { error: 'Thiếu địa chỉ trang, hồ sơ hoặc mật khẩu.' };
    passwords.upsert(profileId, origin, String(username || '').trim(), String(password));
    sendState();
    return { ok: true };
  }));
  ipcMain.handle('pm:import-csv', fromUi(async ({ profileId } = {}) => {
    if (!store.getProfile(profileId)) return { error: 'Chưa chọn hồ sơ.' };
    const r = await dialog.showOpenDialog(win, {
      title: 'Chọn file CSV mật khẩu xuất từ trình duyệt',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile'],
    });
    if (r.canceled || !r.filePaths[0]) return { canceled: true };
    try {
      const result = passwords.importCsv(profileId, fs.readFileSync(r.filePaths[0], 'utf8'));
      sendState();
      return result;
    } catch (err) {
      return { error: err.message };
    }
  }));
}

function setupAppMenu() {
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null);
    return;
  }
  // macOS cần menu Edit để Cmd+C/V hoạt động trong ô nhập liệu.
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    { role: 'windowMenu' },
  ]));
}

function start() {
  store = new Store(DATA_DIR);
  passwords = new PasswordStore(DATA_DIR);
  purgePendingDeletes();
  nativeTheme.themeSource = 'system';
  setupAppMenu();
  registerIpc();

  app.on('web-contents-created', (e, contents) => {
    contents.on('will-attach-webview', (ev) => ev.preventDefault());
  });

  createWindow();
}

app.on('before-quit', () => {
  if (tabs) tabs.saveSession();
  if (store) store.saveNow();
  if (passwords) passwords.saveNow();
});
