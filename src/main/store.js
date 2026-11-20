'use strict';
// Lưu cấu hình (hồ sơ, cài đặt, dấu trang, phiên làm việc) vào 1 file JSON, ghi kiểu atomic.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 30 màu nhận diện hồ sơ, xếp theo vòng màu.
const PROFILE_COLORS = [
  '#e8453c', '#c62828', '#d81b60', '#ff6d9f', '#ff7043', '#f29900', '#ffb300', '#f4c20d', '#c0ca33', '#7cb342',
  '#34a853', '#2e7d32', '#00897b', '#26c6da', '#12b5cb', '#0097a7', '#64b5f6', '#4285f4', '#1565c0', '#5c6bc0',
  '#7b61ff', '#5e35b1', '#c158dc', '#8e24aa', '#ba68c8', '#8d6e63', '#5d4037', '#78909c', '#546e7a', '#3c4043',
];

const DEFAULT_SETTINGS = {
  restoreSession: true,
  googleLoginFix: true,
  defaultStartUrl: '',
  showSidebar: true,
  showBookmarks: true,
  groupTabs: true,
  offerSavePasswords: true,
  autofillPasswords: true,
  quickLinks: [
    { title: 'Google', url: 'https://www.google.com' },
    { title: 'Gmail', url: 'https://mail.google.com' },
    { title: 'Facebook', url: 'https://www.facebook.com' },
    { title: 'YouTube', url: 'https://www.youtube.com' },
    { title: 'Google Drive', url: 'https://drive.google.com' },
  ],
};

const WEB_URL = /^https?:\/\//i;

function newId(prefix = 'p') {
  return prefix + crypto.randomBytes(5).toString('hex');
}

function cleanText(v, max = 200) {
  return String(v === undefined || v === null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

function cleanUrl(v) {
  const s = cleanText(v, 2048);
  return WEB_URL.test(s) ? s : '';
}

// Nhánh trên sơ đồ dashboard của một hồ sơ: { id, text, url }.
function cleanNodes(nodes) {
  if (!Array.isArray(nodes)) return undefined;
  return nodes.slice(0, 60).map((n) => ({
    id: /^[a-z0-9]{4,20}$/i.test(String(n && n.id)) ? String(n.id) : newId('n'),
    text: cleanText(n && n.text, 160),
    url: cleanUrl(n && n.url),
  }));
}

class Store {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'config.json');
    this.data = this._load();
    this._timer = null;
  }

  _load() {
    let raw = null;
    for (const f of [this.file, `${this.file}.bak`]) {
      try {
        raw = JSON.parse(fs.readFileSync(f, 'utf8'));
        break;
      } catch { /* thử file tiếp theo */ }
    }
    raw = raw && typeof raw === 'object' ? raw : {};
    return {
      version: 2,
      profiles: Array.isArray(raw.profiles) ? raw.profiles.filter((p) => p && p.id && p.name) : [],
      settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
      bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks : [],
      session: raw.session && Array.isArray(raw.session.tabs) ? raw.session : { tabs: [], activeIndex: 0 },
      windowState: raw.windowState || null,
      pendingDelete: Array.isArray(raw.pendingDelete) ? raw.pendingDelete : [],
    };
  }

  save() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.saveNow(), 400);
  }

  saveNow() {
    clearTimeout(this._timer);
    this._timer = null;
    const json = JSON.stringify(this.data, null, 2);
    const tmp = `${this.file}.tmp`;
    try {
      if (fs.existsSync(this.file)) fs.copyFileSync(this.file, `${this.file}.bak`);
      fs.writeFileSync(tmp, json, 'utf8');
      fs.renameSync(tmp, this.file);
    } catch (err) {
      console.error('Không ghi được config:', err);
    }
  }

  // ---------- Hồ sơ ----------
  get profiles() { return this.data.profiles; }
  get settings() { return this.data.settings; }
  get bookmarks() { return this.data.bookmarks; }

  getProfile(id) { return this.data.profiles.find((p) => p.id === id) || null; }

  nextColor() {
    const used = new Set(this.data.profiles.map((p) => p.color));
    return PROFILE_COLORS.find((c) => !used.has(c))
      || PROFILE_COLORS[this.data.profiles.length % PROFILE_COLORS.length];
  }

  static cleanColor(c) {
    return /^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c).toLowerCase() : null;
  }

  createProfile({ name, color, startUrl, note } = {}) {
    const profile = {
      id: newId('p'),
      name: cleanText(name, 60) || `Hồ sơ ${this.data.profiles.length + 1}`,
      color: Store.cleanColor(color) || this.nextColor(),
      startUrl: cleanText(startUrl, 2048),
      note: cleanText(note, 120),
      createdAt: Date.now(),
    };
    this.data.profiles.push(profile);
    this.save();
    return profile;
  }

  updateProfile(id, patch) {
    const p = this.getProfile(id);
    if (!p) return null;
    if (patch.name !== undefined) p.name = cleanText(patch.name, 60) || 'Hồ sơ';
    if (patch.note !== undefined) p.note = cleanText(patch.note, 120);
    if (patch.startUrl !== undefined) p.startUrl = cleanText(patch.startUrl, 2048);
    if (patch.color !== undefined) p.color = Store.cleanColor(patch.color) || p.color;
    if (patch.nodes !== undefined) p.nodes = cleanNodes(patch.nodes);
    this.save();
    return p;
  }

  removeProfile(id) {
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);
    this.save();
  }

  moveProfile(id, delta) {
    const list = this.data.profiles;
    const i = list.findIndex((p) => p.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    this.save();
  }

  updateSettings(patch) {
    const s = this.data.settings;
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      const v = patch[key];
      if (v === undefined) continue;
      const def = DEFAULT_SETTINGS[key];
      if (typeof def === 'boolean') s[key] = !!v;
      else if (typeof def === 'string') s[key] = String(v).trim();
      else if (Array.isArray(def) && Array.isArray(v)) {
        s[key] = v
          .filter((q) => q && typeof q.title === 'string' && WEB_URL.test(String(q.url || '')))
          .slice(0, 40)
          .map((q) => ({ title: q.title.trim().slice(0, 60), url: String(q.url).trim() }));
      }
    }
    this.save();
    return s;
  }

  // ---------- Dấu trang ----------
  // Cây: [{ id, type: 'url', title, url, favicon } | { id, type: 'folder', title, children: [...] }]
  findBookmark(id, list = this.data.bookmarks, parent = null) {
    for (let i = 0; i < list.length; i += 1) {
      const b = list[i];
      if (b.id === id) return { item: b, list, index: i, parent };
      if (b.type === 'folder') {
        const r = this.findBookmark(id, b.children, b);
        if (r) return r;
      }
    }
    return null;
  }

  listFor(parentId) {
    if (!parentId) return this.data.bookmarks;
    const f = this.findBookmark(parentId);
    return f && f.item.type === 'folder' ? f.item.children : this.data.bookmarks;
  }

  addBookmark({ title, url, favicon, parentId, type } = {}) {
    let item;
    if (type === 'folder') {
      item = { id: newId('b'), type: 'folder', title: cleanText(title, 120) || 'Thư mục mới', children: [] };
    } else {
      const u = cleanUrl(url);
      if (!u) return null;
      item = { id: newId('b'), type: 'url', title: cleanText(title, 200) || u, url: u, favicon: cleanUrl(favicon) };
    }
    this.listFor(parentId).push(item);
    this.save();
    return item;
  }

  updateBookmark(id, patch) {
    const f = this.findBookmark(id);
    if (!f) return null;
    const b = f.item;
    if (patch.title !== undefined) b.title = cleanText(patch.title, 200) || b.title;
    if (b.type === 'url' && patch.url !== undefined) b.url = cleanUrl(patch.url) || b.url;
    if (patch.parentId !== undefined) {
      const target = this.listFor(patch.parentId || null);
      const insideItself = b.type === 'folder' && patch.parentId && this.findBookmark(patch.parentId, b.children);
      if (target !== f.list && !insideItself && patch.parentId !== b.id) {
        f.list.splice(f.index, 1);
        target.push(b);
      }
    }
    this.save();
    return b;
  }

  removeBookmark(id) {
    const f = this.findBookmark(id);
    if (!f) return false;
    f.list.splice(f.index, 1);
    this.save();
    return true;
  }

  moveBookmark(id, toIndex) {
    const f = this.findBookmark(id);
    if (!f) return;
    const [b] = f.list.splice(f.index, 1);
    f.list.splice(Math.max(0, Math.min(toIndex, f.list.length)), 0, b);
    this.save();
  }

  importBookmarks(items, label) {
    const conv = (list) => list.map((b) => (b.type === 'folder'
      ? { id: newId('b'), type: 'folder', title: cleanText(b.title, 120) || 'Thư mục', children: conv(b.children || []) }
      : { id: newId('b'), type: 'url', title: cleanText(b.title, 200) || b.url, url: cleanUrl(b.url), favicon: '' }))
      .filter((b) => b.type === 'folder' || b.url);
    const converted = conv(items);
    if (!converted.length) return 0;
    if (!this.data.bookmarks.length) this.data.bookmarks.push(...converted);
    else this.data.bookmarks.push({ id: newId('b'), type: 'folder', title: label, children: converted });
    this.save();
    const count = (list) => list.reduce((n, b) => n + (b.type === 'folder' ? count(b.children) : 1), 0);
    return count(converted);
  }
}

module.exports = { Store, PROFILE_COLORS, newId };
