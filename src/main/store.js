'use strict';
// Lưu cấu hình (hồ sơ, cài đặt, phiên làm việc) vào 1 file JSON, ghi kiểu atomic.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROFILE_COLORS = [
  '#e8453c', '#f29900', '#f4c20d', '#34a853', '#12b5cb',
  '#4285f4', '#7b61ff', '#c158dc', '#ff6d9f', '#8d6e63',
];

const DEFAULT_SETTINGS = {
  restoreSession: true,
  googleLoginFix: true,
  defaultStartUrl: '',
  showSidebar: true,
  quickLinks: [
    { title: 'Google', url: 'https://www.google.com' },
    { title: 'Gmail', url: 'https://mail.google.com' },
    { title: 'Facebook', url: 'https://www.facebook.com' },
    { title: 'YouTube', url: 'https://www.youtube.com' },
    { title: 'Google Drive', url: 'https://drive.google.com' },
  ],
};

function newId(prefix = 'p') {
  return prefix + crypto.randomBytes(5).toString('hex');
}

class Store {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'config.json');
    this.data = this._load();
    this._timer = null;
  }

  _load() {
    let raw = null;
    for (const f of [this.file, this.file + '.bak']) {
      try {
        raw = JSON.parse(fs.readFileSync(f, 'utf8'));
        break;
      } catch { /* thử file tiếp theo */ }
    }
    raw = raw && typeof raw === 'object' ? raw : {};
    return {
      version: 1,
      profiles: Array.isArray(raw.profiles) ? raw.profiles.filter((p) => p && p.id && p.name) : [],
      settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
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
    const tmp = this.file + '.tmp';
    try {
      if (fs.existsSync(this.file)) fs.copyFileSync(this.file, this.file + '.bak');
      fs.writeFileSync(tmp, json, 'utf8');
      fs.renameSync(tmp, this.file);
    } catch (err) {
      console.error('Không ghi được config:', err);
    }
  }

  // ---------- Hồ sơ ----------
  get profiles() { return this.data.profiles; }
  get settings() { return this.data.settings; }

  getProfile(id) { return this.data.profiles.find((p) => p.id === id) || null; }

  nextColor() {
    const used = new Set(this.data.profiles.map((p) => p.color));
    return PROFILE_COLORS.find((c) => !used.has(c))
      || PROFILE_COLORS[this.data.profiles.length % PROFILE_COLORS.length];
  }

  createProfile({ name, color, startUrl, note } = {}) {
    const profile = {
      id: newId('p'),
      name: String(name || '').trim() || `Hồ sơ ${this.data.profiles.length + 1}`,
      color: color || this.nextColor(),
      startUrl: String(startUrl || '').trim(),
      note: String(note || '').trim(),
      createdAt: Date.now(),
    };
    this.data.profiles.push(profile);
    this.save();
    return profile;
  }

  updateProfile(id, patch) {
    const p = this.getProfile(id);
    if (!p) return null;
    for (const key of ['name', 'color', 'startUrl', 'note']) {
      if (patch[key] !== undefined) p[key] = String(patch[key]).trim();
    }
    if (!p.name) p.name = 'Hồ sơ';
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
          .filter((q) => q && typeof q.title === 'string' && /^https?:\/\//i.test(String(q.url || '')))
          .slice(0, 40)
          .map((q) => ({ title: q.title.trim().slice(0, 60), url: String(q.url).trim() }));
      }
    }
    this.save();
    return s;
  }
}

module.exports = { Store, PROFILE_COLORS, newId };
