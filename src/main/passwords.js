'use strict';
// Kho mật khẩu riêng của ứng dụng (lõi Chromium trong Electron không có trình quản lý
// mật khẩu của Chrome). Mật khẩu được mã hóa bằng safeStorage: trên Windows là DPAPI,
// gắn với tài khoản Windows hiện tại -> sao chép sang máy/tài khoản khác sẽ không giải mã được.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { safeStorage } = require('electron');

function newId() {
  return `k${crypto.randomBytes(6).toString('hex')}`;
}

function originOf(url) {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) ? u.origin : null;
  } catch {
    return null;
  }
}

// CSV theo RFC 4180 (dấu phẩy, ngoặc kép, xuống dòng trong ô).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  const s = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i += 1; } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ''));
}

class PasswordStore {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'passwords.json');
    this.data = this._load();
    this._timer = null;
  }

  _load() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return {
        version: 1,
        items: Array.isArray(raw.items) ? raw.items : [],
        never: Array.isArray(raw.never) ? raw.never : [],
      };
    } catch {
      return { version: 1, items: [], never: [] };
    }
  }

  save() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.saveNow(), 300);
  }

  saveNow() {
    clearTimeout(this._timer);
    try {
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmp, this.file);
    } catch (err) {
      console.error('Không ghi được passwords.json:', err);
    }
  }

  static encrypt(plain) {
    if (safeStorage.isEncryptionAvailable()) return { e: safeStorage.encryptString(plain).toString('base64') };
    return { p: Buffer.from(plain, 'utf8').toString('base64') };
  }

  static decrypt(secret) {
    try {
      if (secret && secret.e) return safeStorage.decryptString(Buffer.from(secret.e, 'base64'));
      if (secret && secret.p) return Buffer.from(secret.p, 'base64').toString('utf8');
    } catch { /* khóa DPAPI khác máy */ }
    return null;
  }

  list(profileId, origin) {
    return this.data.items
      .filter((i) => i.profileId === profileId && i.origin === origin)
      .sort((a, b) => (b.usedAt || b.updatedAt || 0) - (a.usedAt || a.updatedAt || 0));
  }

  find(profileId, origin, username) {
    return this.data.items.find((i) => i.profileId === profileId && i.origin === origin && i.username === username) || null;
  }

  count(profileId, origin) {
    if (!profileId || !origin) return 0;
    return this.data.items.reduce((n, i) => n + (i.profileId === profileId && i.origin === origin ? 1 : 0), 0);
  }

  passwordOf(item) {
    return item ? PasswordStore.decrypt(item.secret) : null;
  }

  upsert(profileId, origin, username, password) {
    const now = Date.now();
    let item = this.find(profileId, origin, username);
    if (item) {
      item.secret = PasswordStore.encrypt(password);
      item.updatedAt = now;
      item.usedAt = now;
    } else {
      item = { id: newId(), profileId, origin, username, secret: PasswordStore.encrypt(password), createdAt: now, updatedAt: now, usedAt: now };
      this.data.items.push(item);
    }
    this.data.never = this.data.never.filter((n) => !(n.profileId === profileId && n.origin === origin));
    this.save();
    return item;
  }

  touch(item) {
    if (!item) return;
    item.usedAt = Date.now();
    this.save();
  }

  remove(id) {
    const before = this.data.items.length;
    this.data.items = this.data.items.filter((i) => i.id !== id);
    this.save();
    return this.data.items.length < before;
  }

  removeProfile(profileId) {
    this.data.items = this.data.items.filter((i) => i.profileId !== profileId);
    this.data.never = this.data.never.filter((n) => n.profileId !== profileId);
    this.save();
  }

  isNever(profileId, origin) {
    return this.data.never.some((n) => n.profileId === profileId && n.origin === origin);
  }

  addNever(profileId, origin) {
    if (!this.isNever(profileId, origin)) this.data.never.push({ profileId, origin, at: Date.now() });
    this.save();
  }

  removeNever(profileId, origin) {
    this.data.never = this.data.never.filter((n) => !(n.profileId === profileId && n.origin === origin));
    this.save();
  }

  // Danh sách cho giao diện quản lý: KHÔNG kèm mật khẩu.
  summary() {
    return {
      encrypted: safeStorage.isEncryptionAvailable(),
      items: this.data.items.map((i) => ({
        id: i.id, profileId: i.profileId, origin: i.origin, username: i.username, updatedAt: i.updatedAt, readable: !!(i.secret && (i.secret.e || i.secret.p)),
      })),
      never: this.data.never.map((n) => ({ profileId: n.profileId, origin: n.origin })),
    };
  }

  reveal(id) {
    return this.passwordOf(this.data.items.find((i) => i.id === id));
  }

  // File CSV xuất từ Chrome/Edge/Cốc Cốc (name,url,username,password,note) hoặc Firefox (url,username,password,...).
  importCsv(profileId, text) {
    const rows = parseCsv(text);
    if (!rows.length) return { added: 0, updated: 0, skipped: 0 };
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (...names) => header.findIndex((h) => names.includes(h));
    const ci = { url: col('url', 'origin', 'website', 'login_uri'), user: col('username', 'login', 'login_username', 'user'), pass: col('password', 'login_password') };
    if (ci.url < 0 || ci.pass < 0) throw new Error('File CSV không đúng định dạng (cần cột url và password).');
    let added = 0;
    let updated = 0;
    let skipped = 0;
    for (const r of rows.slice(1)) {
      const origin = originOf(r[ci.url] || '');
      const username = ci.user >= 0 ? (r[ci.user] || '').trim() : '';
      const password = r[ci.pass] || '';
      if (!origin || !password) { skipped += 1; continue; }
      if (this.find(profileId, origin, username)) updated += 1; else added += 1;
      this.upsert(profileId, origin, username, password);
    }
    return { added, updated, skipped };
  }
}

module.exports = { PasswordStore, originOf, parseCsv };
