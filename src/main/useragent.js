'use strict';
// User-Agent: bỏ dấu hiệu "Electron" để các trang (Google, Facebook...) coi đây là
// trình duyệt Chrome bình thường. Riêng trang đăng nhập Google dùng UA Firefox vì
// Google hay chặn đăng nhập trong trình duyệt nhúng có UA Chrome.
const chromeMajor = String(process.versions.chrome || '140').split('.')[0];
// Chrome và Firefox cùng ra bản mới mỗi 4 tuần, Firefox thường hơn Chrome ~3 số.
const firefoxMajor = String(Number(chromeMajor) + 3);

function osToken() {
  if (process.platform === 'win32') return 'Windows NT 10.0; Win64; x64';
  if (process.platform === 'darwin') return 'Macintosh; Intel Mac OS X 10_15_7';
  return 'X11; Linux x86_64';
}

function firefoxOsToken() {
  if (process.platform === 'win32') return 'Windows NT 10.0; Win64; x64';
  if (process.platform === 'darwin') return 'Macintosh; Intel Mac OS X 10.15';
  return 'X11; Linux x86_64';
}

const CHROME_UA = `Mozilla/5.0 (${osToken()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36`;
const FIREFOX_UA = `Mozilla/5.0 (${firefoxOsToken()}; rv:${firefoxMajor}.0) Gecko/20100101 Firefox/${firefoxMajor}.0`;

const GOOGLE_LOGIN_HOSTS = new Set(['accounts.google.com']);

function isGoogleLoginUrl(url) {
  try {
    return GOOGLE_LOGIN_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

module.exports = { CHROME_UA, FIREFOX_UA, isGoogleLoginUrl };
