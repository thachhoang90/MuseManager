'use strict';
// Quản lý tab. Mỗi tab là một WebContentsView gắn với "partition" của hồ sơ:
//   persist:<id-hồ-sơ>  -> cookie, localStorage, IndexedDB, cache... riêng, lưu xuống đĩa
//   temp-<n>             -> tab ẩn danh, chỉ nằm trong RAM, đóng là mất
// Hai hồ sơ khác nhau không bao giờ dùng chung dữ liệu, nên đăng nhập độc lập.
const path = require('path');
const { EventEmitter } = require('events');
const { WebContentsView, session, shell, app } = require('electron');
const { CHROME_UA, FIREFOX_UA, isGoogleLoginUrl } = require('./useragent');

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
const ALLOWED_PERMISSIONS = new Set([
  'notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen',
  'pointerLock', 'display-capture', 'speaker-selection', 'window-management', 'keyboardLock',
]);

let tabSeq = 0;

function isWebUrl(url) {
  return /^(https?|file|about|blob|data):/i.test(url || '');
}

function normalizeInput(input) {
  const s = String(input || '').trim();
  if (!s) return null;
  if (/^(https?|file):\/\//i.test(s) || /^about:blank$/i.test(s)) return s;
  if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/.*)?$/i.test(s)) return `http://${s}`;
  if (!/\s/.test(s) && /^[^\s/?#]+\.[a-z0-9-]{2,}(:\d+)?([/?#].*)?$/i.test(s)) return `https://${s}`;
  return `https://www.google.com/search?q=${encodeURIComponent(s)}`;
}

class TabManager extends EventEmitter {
  constructor({ win, store, onShortcut, buildContextMenu }) {
    super();
    this.win = win;
    this.store = store;
    this.onShortcut = onShortcut;
    this.buildContextMenu = buildContextMenu;
    this.tabs = [];
    this.activeId = null;
    this.contentBounds = { x: 0, y: 0, width: 0, height: 0 };
    this.overlayOpen = false;
    this.closedStack = [];
    this.configuredSessions = new Set();
    this.googleMode = new Set();
    this.firefoxUa = new Set();
    this.tempSeq = 0;

    win.on('resize', () => this.layout());
    win.on('enter-full-screen', () => this.layout());
    win.on('leave-full-screen', () => this.layout());
  }

  // ---------------------------------------------------------------- tiện ích
  get active() { return this.tabs.find((t) => t.id === this.activeId) || null; }
  get(id) { return this.tabs.find((t) => t.id === id) || null; }
  byWebContents(wc) { return this.tabs.find((t) => t.view && t.view.webContents === wc) || null; }

  changed() {
    this.emit('changed');
    this.saveSession();
  }

  profileLabel(tab) {
    if (tab.temp) return tab.tempLabel;
    const p = this.store.getProfile(tab.profileId);
    return p ? p.name : 'Hồ sơ';
  }

  // ---------------------------------------------------------------- session
  setupSession(partition) {
    if (this.configuredSessions.has(partition)) return session.fromPartition(partition);
    this.configuredSessions.add(partition);
    const ses = session.fromPartition(partition);
    ses.setUserAgent(CHROME_UA);

    ses.setPermissionRequestHandler((wc, permission, callback, details) => {
      if (permission === 'openExternal') {
        callback(/^(mailto|tel):/i.test((details && details.externalURL) || ''));
        return;
      }
      callback(ALLOWED_PERMISSIONS.has(permission));
    });

    // Trang đăng nhập Google: gửi UA Firefox và bỏ Client Hints của Chromium.
    // Header được quyết định theo từng request vì khi trang chuyển hướng (redirect)
    // không thể đổi UA của webContents (xem attachGoogleLoginFix).
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = details.requestHeaders;
      const fix = this.store.settings.googleLoginFix;
      const isMain = details.resourceType === 'mainFrame';
      const onLoginPage = fix && (isMain ? isGoogleLoginUrl(details.url) : this.googleMode.has(details.webContentsId));

      if (onLoginPage) {
        if (headers['User-Agent'] === FIREFOX_UA && !Object.keys(headers).some((k) => /^sec-ch-ua/i.test(k))) {
          callback({});
          return;
        }
        const out = { ...headers, 'User-Agent': FIREFOX_UA };
        for (const key of Object.keys(out)) {
          if (/^sec-ch-ua/i.test(key)) delete out[key];
        }
        callback({ requestHeaders: out });
        return;
      }
      // Đã rời trang đăng nhập (hoặc tắt chế độ) mà request vẫn mang UA Firefox -> trả về UA Chrome.
      if (headers['User-Agent'] === FIREFOX_UA) {
        callback({ requestHeaders: { ...headers, 'User-Agent': CHROME_UA } });
        return;
      }
      callback({});
    });

    ses.on('will-download', (event, item) => {
      const name = item.getFilename();
      item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), name) });
      let last = 0;
      item.on('updated', () => {
        const now = Date.now();
        if (now - last < 500) return;
        last = now;
        const total = item.getTotalBytes();
        const pct = total ? Math.round((item.getReceivedBytes() / total) * 100) : null;
        this.emit('download', { state: 'progressing', name, percent: pct });
      });
      item.once('done', (e, state) => {
        this.emit('download', { state, name, path: item.getSavePath() });
      });
    });
    return ses;
  }

  // Đồng bộ navigator.userAgent với header trên trang đăng nhập Google.
  // Lưu ý: gọi setUserAgent khi trang đang redirect làm Electron crash, còn gọi giữa chừng
  // một lần điều hướng sẽ khiến Chromium tải lại trang -> chỉ gọi ở các thời điểm an toàn.
  attachGoogleLoginFix(wc) {
    const id = wc.id;
    const wantGoogle = (url) => this.store.settings.googleLoginFix && isGoogleLoginUrl(url);
    wc.on('did-start-navigation', (d) => {
      if (!d.isMainFrame || d.isSameDocument) return;
      const google = wantGoogle(d.url);
      if (google) this.googleMode.add(id); else this.googleMode.delete(id);
      this.applyUserAgent(wc, google);
    });
    wc.on('did-redirect-navigation', (d) => {
      if (!d.isMainFrame) return;
      if (wantGoogle(d.url)) this.googleMode.add(id); else this.googleMode.delete(id);
    });
    // Vào trang đăng nhập qua redirect (ví dụ nút "Đăng nhập bằng Google" của Muse AI):
    // header đã là Firefox, đổi UA sau khi trang hiển thị để JS của Google cũng thấy Firefox.
    wc.on('did-navigate', (e, url) => {
      if (!this.googleMode.has(id) || this.firefoxUa.has(id) || !wantGoogle(url)) return;
      setTimeout(() => {
        if (!wc.isDestroyed() && this.googleMode.has(id) && wantGoogle(wc.getURL())) this.applyUserAgent(wc, true);
      }, 0);
    });
    wc.once('destroyed', () => {
      this.googleMode.delete(id);
      this.firefoxUa.delete(id);
    });
  }

  applyUserAgent(wc, firefox) {
    const id = wc.id;
    if (firefox && !this.firefoxUa.has(id)) {
      this.firefoxUa.add(id);
      wc.setUserAgent(FIREFOX_UA);
    } else if (!firefox && this.firefoxUa.has(id)) {
      this.firefoxUa.delete(id);
      wc.setUserAgent(CHROME_UA);
    }
  }

  // ---------------------------------------------------------------- tạo tab
  createTab(opts = {}) {
    let { profileId = null, temp = false, partition = null, tempLabel = null } = opts;
    if (temp && !partition) {
      this.tempSeq += 1;
      partition = `temp-${this.tempSeq}`;
      tempLabel = `Ẩn danh ${this.tempSeq}`;
    }
    if (!temp) {
      const profile = this.store.getProfile(profileId);
      if (!profile) return null;
      partition = `persist:${profile.id}`;
    }

    const profile = temp ? null : this.store.getProfile(profileId);
    let url = opts.url !== undefined ? opts.url : ((profile && profile.startUrl) || '');
    url = url ? (normalizeInput(url) || '') : '';

    const tab = {
      id: `t${++tabSeq}`,
      profileId: temp ? null : profileId,
      temp,
      tempLabel,
      partition,
      url,
      title: opts.title || '',
      favicon: null,
      loading: false,
      canGoBack: false,
      canGoForward: false,
      error: null,
      zoom: 1,
      audible: false,
      muted: false,
      find: null,
      htmlFullscreen: false,
      showStart: !url && !opts.webContents,
      view: null,
      pendingUrl: url || null,
    };

    let index = this.tabs.length;
    if (typeof opts.index === 'number') index = Math.max(0, Math.min(opts.index, this.tabs.length));
    else if (opts.afterId) {
      const i = this.tabs.findIndex((t) => t.id === opts.afterId);
      if (i >= 0) {
        // Tab mở từ link xếp ngay sau tab gốc (và sau các tab con trước đó).
        let j = i + 1;
        while (j < this.tabs.length && this.tabs[j].openerId === opts.afterId) j += 1;
        index = j;
        tab.openerId = opts.afterId;
      }
    }
    this.tabs.splice(index, 0, tab);

    if (opts.webContents) this.ensureView(tab, opts.webContents);
    else if (url && !opts.lazy) this.ensureView(tab);

    if (!opts.noActivate && (!opts.background || !this.activeId)) this.activate(tab.id);
    else this.changed();
    return tab;
  }

  ensureView(tab, adoptWebContents = null) {
    if (tab.view) return tab.view;
    this.setupSession(tab.partition);
    const view = adoptWebContents
      ? new WebContentsView({ webContents: adoptWebContents })
      : new WebContentsView({
        webPreferences: {
          partition: tab.partition,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          spellcheck: false,
        },
      });
    view.setBackgroundColor('#ffffff');
    view.setVisible(false);
    tab.view = view;
    this.win.contentView.addChildView(view);
    this.wireWebContents(tab, view.webContents);

    if (!adoptWebContents && tab.pendingUrl) {
      const url = tab.pendingUrl;
      tab.pendingUrl = null;
      view.webContents.loadURL(url).catch(() => {});
    }
    tab.pendingUrl = null;
    this.layout();
    return view;
  }

  wireWebContents(tab, wc) {
    const update = () => {
      if (wc.isDestroyed()) return;
      tab.canGoBack = wc.navigationHistory.canGoBack();
      tab.canGoForward = wc.navigationHistory.canGoForward();
      const url = wc.getURL();
      if (url && !tab.error) tab.url = url;
      this.changed();
    };

    this.attachGoogleLoginFix(wc);

    wc.on('did-start-loading', () => { tab.loading = true; this.changed(); });
    wc.on('did-stop-loading', () => { tab.loading = false; update(); });
    wc.on('did-start-navigation', (d) => {
      if (d.isMainFrame && !d.isSameDocument) {
        tab.error = null;
        tab.showStart = false;
        this.layout();
      }
    });
    wc.on('did-navigate', () => {
      tab.error = null;
      tab.zoom = wc.getZoomFactor();
      update();
      this.layout();
    });
    wc.on('did-navigate-in-page', (e, url, isMainFrame) => { if (isMainFrame) update(); });
    wc.on('page-title-updated', (e, title) => {
      tab.title = title;
      this.changed();
      this.emit('title');
    });
    wc.on('page-favicon-updated', (e, favicons) => {
      tab.favicon = (favicons && favicons[0]) || null;
      this.changed();
    });
    wc.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
      if (!isMainFrame || code === -3) return; // -3 = ERR_ABORTED (người dùng bấm dừng / chuyển trang)
      tab.error = { code, desc, url };
      tab.url = url || tab.url;
      tab.loading = false;
      this.layout();
      this.changed();
    });
    wc.on('render-process-gone', (e, details) => {
      if (details.reason === 'clean-exit') return;
      tab.error = { code: details.reason, desc: 'Trang đã dừng đột ngột (render-process-gone)', url: tab.url };
      tab.loading = false;
      this.layout();
      this.changed();
    });
    wc.on('audio-state-changed', (e) => {
      tab.audible = !!(e && e.audible);
      this.changed();
    });
    wc.on('found-in-page', (e, result) => {
      if (!tab.find) return;
      tab.find = { ...tab.find, matches: result.matches, active: result.activeMatchOrdinal };
      this.changed();
    });
    wc.on('enter-html-full-screen', () => {
      tab.htmlFullscreen = true;
      this.win.setFullScreen(true);
      this.layout();
    });
    wc.on('leave-html-full-screen', () => {
      tab.htmlFullscreen = false;
      this.win.setFullScreen(false);
      this.layout();
    });
    wc.on('zoom-changed', (e, direction) => this.zoom(tab.id, direction === 'in' ? 1 : -1));
    wc.on('before-input-event', (e, input) => {
      if (this.onShortcut && this.onShortcut(input, tab)) e.preventDefault();
    });
    wc.on('context-menu', (e, params) => {
      if (this.buildContextMenu) this.buildContextMenu(tab, wc, params);
    });
    wc.on('will-navigate', (e) => {
      if (!isWebUrl(e.url)) {
        e.preventDefault();
        if (/^(mailto|tel):/i.test(e.url)) shell.openExternal(e.url);
      }
    });

    wc.setWindowOpenHandler((details) => {
      const { url, disposition } = details;
      if (!isWebUrl(url)) {
        if (/^(mailto|tel):/i.test(url)) shell.openExternal(url);
        return { action: 'deny' };
      }
      if (disposition === 'new-window') {
        // Cửa sổ popup (ví dụ đăng nhập OAuth "Sign in with Google") - giữ liên kết opener.
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 520,
            height: 700,
            autoHideMenuBar: true,
            backgroundColor: '#ffffff',
            title: `${this.profileLabel(tab)} — cửa sổ phụ`,
          },
        };
      }
      // Link target=_blank / window.open không kích thước -> mở thành tab mới cùng hồ sơ,
      // dùng chính webContents mà Chromium tạo để giữ window.opener.
      return {
        action: 'allow',
        createWindow: (options) => {
          const child = this.createTab({
            profileId: tab.profileId,
            temp: tab.temp,
            partition: tab.partition,
            tempLabel: tab.tempLabel,
            url,
            afterId: tab.id,
            background: disposition === 'background-tab',
            webContents: options.webContents,
          });
          if (child) child.url = url;
          return options.webContents;
        },
      };
    });

    wc.on('did-create-window', (child) => {
      child.setMenuBarVisibility(false);
      const cwc = child.webContents;
      this.attachGoogleLoginFix(cwc);
      cwc.on('context-menu', (e, params) => {
        if (this.buildContextMenu) this.buildContextMenu(tab, cwc, params, child);
      });
      cwc.on('before-input-event', (e, input) => {
        if (input.type !== 'keyDown') return;
        const mod = input.control || input.meta;
        if ((mod && input.key.toLowerCase() === 'w') || input.key === 'Escape') { e.preventDefault(); child.close(); }
        if (input.key === 'F12') { e.preventDefault(); cwc.toggleDevTools(); }
        if (input.key === 'F5' || (mod && input.key.toLowerCase() === 'r')) { e.preventDefault(); cwc.reload(); }
      });
    });
  }

  // ---------------------------------------------------------------- bố cục
  setContentBounds(b) {
    this.contentBounds = {
      x: Math.round(b.x), y: Math.round(b.y), width: Math.max(0, Math.round(b.width)), height: Math.max(0, Math.round(b.height)),
    };
    this.layout();
  }

  layout() {
    if (this.win.isDestroyed()) return;
    const active = this.active;
    let bounds = this.contentBounds;
    if (active && active.htmlFullscreen) {
      const [width, height] = this.win.getContentSize();
      bounds = { x: 0, y: 0, width, height };
    }
    for (const tab of this.tabs) {
      if (!tab.view) continue;
      const visible = tab === active && !this.overlayOpen && !tab.showStart && !tab.error;
      if (visible) tab.view.setBounds(bounds);
      tab.view.setVisible(visible);
    }
  }

  async setOverlay(open) {
    let snapshot = null;
    const active = this.active;
    if (open && !this.overlayOpen && active && active.view && !active.showStart && !active.error) {
      try {
        const img = await active.view.webContents.capturePage();
        const small = img.resize({ width: Math.min(1280, img.getSize().width || 1280) });
        snapshot = `data:image/jpeg;base64,${small.toJPEG(78).toString('base64')}`;
      } catch { snapshot = null; }
    }
    this.overlayOpen = !!open;
    this.layout();
    if (!open && active && active.view && !active.showStart) active.view.webContents.focus();
    return snapshot;
  }

  // ---------------------------------------------------------------- thao tác tab
  activate(id) {
    const tab = this.get(id);
    if (!tab) return;
    this.activeId = id;
    if (!tab.view && !tab.showStart && (tab.pendingUrl || tab.url)) {
      tab.pendingUrl = tab.pendingUrl || tab.url;
      this.ensureView(tab);
    }
    this.layout();
    if (tab.view && !tab.showStart && !tab.error && !this.overlayOpen) tab.view.webContents.focus();
    this.changed();
    this.emit('title');
    this.emit('activated', tab);
  }

  close(id) {
    const i = this.tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    const tab = this.tabs[i];
    if (tab.url && !tab.temp) {
      this.closedStack.push({ profileId: tab.profileId, url: tab.url, title: tab.title, index: i });
      if (this.closedStack.length > 25) this.closedStack.shift();
    }
    this.tabs.splice(i, 1);
    for (const t of this.tabs) if (t.openerId === id) t.openerId = null;
    this.destroyView(tab);
    if (tab.htmlFullscreen) this.win.setFullScreen(false);
    if (this.activeId === id) {
      const next = this.tabs[i] || this.tabs[i - 1] || null;
      this.activeId = null;
      if (next) this.activate(next.id);
      else { this.layout(); this.changed(); this.emit('title'); }
    } else {
      this.changed();
    }
  }

  destroyView(tab) {
    if (!tab.view) return;
    const view = tab.view;
    tab.view = null;
    try { this.win.contentView.removeChildView(view); } catch { /* đã gỡ */ }
    try { if (!view.webContents.isDestroyed()) view.webContents.close(); } catch { /* đã đóng */ }
  }

  reopenClosed() {
    while (this.closedStack.length) {
      const c = this.closedStack.pop();
      if (this.store.getProfile(c.profileId)) {
        return this.createTab({ profileId: c.profileId, url: c.url, title: c.title, index: c.index });
      }
    }
    return null;
  }

  move(id, toIndex) {
    const i = this.tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    const [tab] = this.tabs.splice(i, 1);
    this.tabs.splice(Math.max(0, Math.min(toIndex, this.tabs.length)), 0, tab);
    tab.openerId = null;
    this.changed();
  }

  cycle(delta) {
    if (!this.tabs.length) return;
    const i = Math.max(0, this.tabs.findIndex((t) => t.id === this.activeId));
    const next = this.tabs[(i + delta + this.tabs.length) % this.tabs.length];
    this.activate(next.id);
  }

  activateIndex(n) {
    const tab = n === -1 ? this.tabs[this.tabs.length - 1] : this.tabs[n];
    if (tab) this.activate(tab.id);
  }

  navigate(id, input) {
    const tab = this.get(id);
    const url = normalizeInput(input);
    if (!tab || !url) return;
    tab.showStart = false;
    tab.error = null;
    tab.url = url;
    if (!tab.view) {
      tab.pendingUrl = url;
      this.ensureView(tab);
    } else {
      tab.view.webContents.loadURL(url).catch(() => {});
    }
    this.layout();
    if (tab.id === this.activeId) tab.view.webContents.focus();
    this.changed();
  }

  goBack(id) {
    const tab = this.get(id);
    if (!tab || !tab.view) return;
    if (tab.showStart) { tab.showStart = false; this.layout(); this.changed(); return; }
    if (tab.view.webContents.navigationHistory.canGoBack()) tab.view.webContents.navigationHistory.goBack();
  }

  goForward(id) {
    const tab = this.get(id);
    if (tab && tab.view && tab.view.webContents.navigationHistory.canGoForward()) tab.view.webContents.navigationHistory.goForward();
  }

  reload(id, ignoreCache = false) {
    const tab = this.get(id);
    if (!tab) return;
    if (tab.error && tab.error.url) { this.navigate(id, tab.error.url); return; }
    if (!tab.view) return;
    if (ignoreCache) tab.view.webContents.reloadIgnoringCache();
    else tab.view.webContents.reload();
  }

  stop(id) {
    const tab = this.get(id);
    if (tab && tab.view) tab.view.webContents.stop();
  }

  home(id) {
    const tab = this.get(id);
    if (!tab) return;
    const profile = tab.temp ? null : this.store.getProfile(tab.profileId);
    if (profile && profile.startUrl) { this.navigate(id, profile.startUrl); return; }
    tab.showStart = true;
    tab.error = null;
    this.layout();
    this.changed();
  }

  zoom(id, direction) {
    const tab = this.get(id);
    if (!tab || !tab.view) return;
    const wc = tab.view.webContents;
    let factor = 1;
    if (direction !== 0) {
      const cur = wc.getZoomFactor();
      const idx = ZOOM_STEPS.findIndex((z) => Math.abs(z - cur) < 0.01);
      let i = idx >= 0 ? idx : ZOOM_STEPS.findIndex((z) => z > cur) - (direction > 0 ? 1 : 0);
      i = Math.max(0, Math.min(ZOOM_STEPS.length - 1, i + direction));
      factor = ZOOM_STEPS[i];
    }
    wc.setZoomFactor(factor);
    tab.zoom = factor;
    this.changed();
  }

  toggleMute(id) {
    const tab = this.get(id);
    if (!tab || !tab.view) return;
    tab.muted = !tab.view.webContents.isAudioMuted();
    tab.view.webContents.setAudioMuted(tab.muted);
    this.changed();
  }

  find(id, text, forward = true) {
    const tab = this.get(id);
    if (!tab || !tab.view) return;
    if (!text) {
      tab.view.webContents.stopFindInPage('clearSelection');
      tab.find = { text: '', matches: 0, active: 0 };
      this.changed();
      return;
    }
    const isNew = !tab.find || tab.find.text !== text;
    tab.find = { text, matches: isNew ? 0 : tab.find.matches, active: isNew ? 0 : tab.find.active };
    tab.view.webContents.findInPage(text, { forward, findNext: isNew });
  }

  stopFind(id) {
    const tab = this.get(id);
    if (!tab) return;
    tab.find = null;
    if (tab.view) tab.view.webContents.stopFindInPage('keepSelection');
    this.changed();
  }

  toggleDevTools(id) {
    const tab = this.get(id);
    if (tab && tab.view) tab.view.webContents.toggleDevTools();
  }

  closeProfileTabs(profileId) {
    for (const tab of [...this.tabs]) if (tab.profileId === profileId) this.close(tab.id);
    this.closedStack = this.closedStack.filter((c) => c.profileId !== profileId);
  }

  async clearProfileData(profileId) {
    const ses = session.fromPartition(`persist:${profileId}`);
    await ses.clearStorageData();
    await ses.clearCache();
    await ses.clearAuthCache();
    for (const tab of this.tabs) if (tab.profileId === profileId && tab.view) tab.view.webContents.reload();
  }

  // ---------------------------------------------------------------- lưu / khôi phục
  serialize() {
    return {
      activeId: this.activeId,
      tabs: this.tabs.map((t) => ({
        id: t.id,
        profileId: t.profileId,
        temp: t.temp,
        tempLabel: t.tempLabel,
        title: t.title,
        url: t.url,
        favicon: t.favicon,
        loading: t.loading,
        canGoBack: t.canGoBack || (t.showStart && !!t.view),
        canGoForward: t.canGoForward,
        error: t.error,
        zoom: t.zoom,
        audible: t.audible,
        muted: t.muted,
        find: t.find,
        showStart: t.showStart,
      })),
    };
  }

  saveSession() {
    const tabs = this.tabs.filter((t) => !t.temp);
    const active = this.active;
    this.store.data.session = {
      tabs: tabs.map((t) => ({ profileId: t.profileId, url: t.url || '', title: t.title || '' })),
      activeIndex: Math.max(0, tabs.indexOf(active)),
    };
    this.store.save();
  }

  restoreSession() {
    const { tabs = [], activeIndex = 0 } = this.store.data.session || {};
    const created = [];
    for (const t of tabs) {
      if (!this.store.getProfile(t.profileId)) continue;
      const tab = this.createTab({
        profileId: t.profileId, url: t.url || '', title: t.title, noActivate: true, lazy: true,
      });
      if (tab) created.push(tab);
    }
    const target = created[Math.min(activeIndex, created.length - 1)];
    if (target) this.activate(target.id);
    return created.length;
  }
}

module.exports = { TabManager, normalizeInput };
