'use strict';
// Xác định thư mục dữ liệu "portable": nằm cạnh file .exe để có thể chép cả
// thư mục sang máy khác mà vẫn giữ nguyên các phiên đăng nhập.
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DATA_FOLDER_NAME = 'MuseManager-Data';

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

function resolveDataDir() {
  if (process.env.MUSEMANAGER_DATA_DIR) return path.resolve(process.env.MUSEMANAGER_DATA_DIR);

  if (!app.isPackaged) return path.join(app.getAppPath(), '.devdata');

  // Bản portable 1 file .exe (electron-builder) tự giải nén vào %TEMP% mỗi lần chạy,
  // nên phải lấy thư mục chứa file .exe gốc qua biến môi trường này.
  const baseDir = process.env.PORTABLE_EXECUTABLE_DIR
    || (process.platform === 'darwin'
      ? path.resolve(path.dirname(process.execPath), '..', '..', '..')
      : path.dirname(process.execPath));

  const portableDir = path.join(baseDir, DATA_FOLDER_NAME);
  if (isWritable(portableDir)) return portableDir;

  // Thư mục chứa .exe không ghi được (ví dụ Program Files) -> dùng AppData.
  return path.join(app.getPath('appData'), 'MuseManager');
}

module.exports = { resolveDataDir };
