'use strict';
// Dò các trình duyệt nhân Chromium đã cài trên máy (Chrome, Edge, Brave, Cốc Cốc...)
// và đọc danh sách profile của chúng để mở nhanh bằng chính trình duyệt đó.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

function browserDefs() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    const local = env('LOCALAPPDATA', path.join(home, 'AppData', 'Local'));
    const pf = env('ProgramFiles', 'C:\\Program Files');
    const pf86 = env('ProgramFiles(x86)', 'C:\\Program Files (x86)');
    const app = (...p) => [pf, pf86, local].map((base) => path.join(base, ...p));
    return [
      { id: 'chrome', name: 'Google Chrome', userData: path.join(local, 'Google', 'Chrome', 'User Data'), exe: app('Google', 'Chrome', 'Application', 'chrome.exe') },
      { id: 'edge', name: 'Microsoft Edge', userData: path.join(local, 'Microsoft', 'Edge', 'User Data'), exe: app('Microsoft', 'Edge', 'Application', 'msedge.exe') },
      { id: 'brave', name: 'Brave', userData: path.join(local, 'BraveSoftware', 'Brave-Browser', 'User Data'), exe: app('BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe') },
      { id: 'coccoc', name: 'Cốc Cốc', userData: path.join(local, 'CocCoc', 'Browser', 'User Data'), exe: app('CocCoc', 'Browser', 'Application', 'browser.exe') },
      { id: 'vivaldi', name: 'Vivaldi', userData: path.join(local, 'Vivaldi', 'User Data'), exe: app('Vivaldi', 'Application', 'vivaldi.exe') },
      { id: 'chromium', name: 'Chromium', userData: path.join(local, 'Chromium', 'User Data'), exe: app('Chromium', 'Application', 'chrome.exe') },
    ];
  }
  if (process.platform === 'darwin') {
    const sup = path.join(home, 'Library', 'Application Support');
    const a = (n, bin) => [path.join('/Applications', `${n}.app`, 'Contents', 'MacOS', bin || n), path.join(home, 'Applications', `${n}.app`, 'Contents', 'MacOS', bin || n)];
    return [
      { id: 'chrome', name: 'Google Chrome', userData: path.join(sup, 'Google', 'Chrome'), exe: a('Google Chrome') },
      { id: 'edge', name: 'Microsoft Edge', userData: path.join(sup, 'Microsoft Edge'), exe: a('Microsoft Edge') },
      { id: 'brave', name: 'Brave', userData: path.join(sup, 'BraveSoftware', 'Brave-Browser'), exe: a('Brave Browser') },
      { id: 'coccoc', name: 'Cốc Cốc', userData: path.join(sup, 'Coccoc'), exe: a('CocCoc') },
      { id: 'vivaldi', name: 'Vivaldi', userData: path.join(sup, 'Vivaldi'), exe: a('Vivaldi') },
      { id: 'chromium', name: 'Chromium', userData: path.join(sup, 'Chromium'), exe: a('Chromium') },
    ];
  }
  const cfg = env('XDG_CONFIG_HOME', path.join(home, '.config'));
  const bins = (...names) => names.flatMap((n) => [`/usr/bin/${n}`, `/usr/local/bin/${n}`, `/snap/bin/${n}`, `/opt/google/chrome/${n}`]);
  return [
    { id: 'chrome', name: 'Google Chrome', userData: path.join(cfg, 'google-chrome'), exe: bins('google-chrome', 'google-chrome-stable') },
    { id: 'edge', name: 'Microsoft Edge', userData: path.join(cfg, 'microsoft-edge'), exe: bins('microsoft-edge', 'microsoft-edge-stable') },
    { id: 'brave', name: 'Brave', userData: path.join(cfg, 'BraveSoftware', 'Brave-Browser'), exe: bins('brave-browser', 'brave') },
    { id: 'vivaldi', name: 'Vivaldi', userData: path.join(cfg, 'vivaldi'), exe: bins('vivaldi', 'vivaldi-stable') },
    { id: 'chromium', name: 'Chromium', userData: path.join(cfg, 'chromium'), exe: bins('chromium', 'chromium-browser') },
  ];
}

function readProfiles(userDataDir) {
  let localState;
  try {
    localState = JSON.parse(fs.readFileSync(path.join(userDataDir, 'Local State'), 'utf8'));
  } catch {
    return fs.existsSync(path.join(userDataDir, 'Default'))
      ? [{ dir: 'Default', name: 'Default', email: '' }]
      : [];
  }
  const cache = (localState.profile && localState.profile.info_cache) || {};
  const order = (localState.profile && localState.profile.profiles_order) || Object.keys(cache);
  const dirs = [...new Set([...order, ...Object.keys(cache)])].filter((d) => cache[d]);
  return dirs.map((dir) => {
    const info = cache[dir] || {};
    return {
      dir,
      name: info.name || info.gaia_name || dir,
      email: info.user_name || '',
      fullName: info.gaia_name || '',
    };
  });
}

function detectBrowsers() {
  const result = [];
  for (const def of browserDefs()) {
    const exe = def.exe.find((p) => {
      try { return fs.statSync(p).isFile(); } catch { return false; }
    });
    if (!exe) continue;
    result.push({ id: def.id, name: def.name, exe, userData: def.userData, profiles: readProfiles(def.userData) });
  }
  return result;
}

function launchBrowser({ browserId, profileDir, url }) {
  const browser = detectBrowsers().find((b) => b.id === browserId);
  if (!browser) throw new Error('Không tìm thấy trình duyệt trên máy');
  const args = [];
  if (profileDir) args.push(`--profile-directory=${profileDir}`);
  if (url && /^https?:\/\//i.test(url)) args.push(url);
  const child = spawn(browser.exe, args, { detached: true, stdio: 'ignore' });
  child.on('error', (err) => console.error('Không mở được trình duyệt:', err));
  child.unref();
  return true;
}

module.exports = { detectBrowsers, launchBrowser };
