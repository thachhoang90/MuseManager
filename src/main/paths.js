'use strict';
// Xác định thư mục dữ liệu "portable": nằm cạnh file .exe để có thể chép cả
// thư mục sang máy khác mà vẫn giữ nguyên các phiên đăng nhập.
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DATA_FOLDER_NAME = 'TabManagerSP-Data';
const LEGACY_FOLDER_NAME = 'MuseManager-Data'; // tên thư mục của bản 1.x (Muse Manager)

function isWritable(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.write-test-${process.pid}`);
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

// Bản cũ (Muse Manager) để dữ liệu trong MuseManager-Data. Nếu thư mục đó nằm cạnh
// file chạy mà chưa có thư mục mới thì đổi tên để giữ nguyên hồ sơ và đăng nhập.
function migrateLegacy(baseDir) {
  const legacy = path.join(baseDir, LEGACY_FOLDER_NAME);
  const current = path.join(baseDir, DATA_FOLDER_NAME);
  if (fs.existsSync(current) || !fs.existsSync(legacy)) return current;
  try {
    fs.renameSync(legacy, current);
    return current;
  } catch {
    // Thư mục cũ đang bị khóa (bản cũ còn mở) -> dùng luôn thư mục cũ.
    return legacy;
  }
}

function resolveDataDir() {
  const envDir = process.env.TABMANAGERSP_DATA_DIR || process.env.MUSEMANAGER_DATA_DIR;
  if (envDir) return path.resolve(envDir);

  if (!app.isPackaged) return path.join(app.getAppPath(), '.devdata');

  // Bản portable 1 file .exe (electron-builder) tự giải nén vào %TEMP% mỗi lần chạy,
  // nên phải lấy thư mục chứa file .exe gốc qua biến môi trường này.
  const baseDir = process.env.PORTABLE_EXECUTABLE_DIR
    || (process.platform === 'darwin'
      ? path.resolve(path.dirname(process.execPath), '..', '..', '..')
      : path.dirname(process.execPath));

  const portableDir = migrateLegacy(baseDir);
  if (isWritable(portableDir)) return portableDir;

  // Thư mục chứa .exe không ghi được (ví dụ Program Files) -> dùng AppData.
  const appData = path.join(app.getPath('appData'), 'TabManagerSP');
  const legacyAppData = path.join(app.getPath('appData'), 'MuseManager');
  if (!fs.existsSync(appData) && fs.existsSync(legacyAppData)) {
    try { fs.renameSync(legacyAppData, appData); } catch { return legacyAppData; }
  }
  return appData;
}

module.exports = { resolveDataDir, migrateLegacy, DATA_FOLDER_NAME };
