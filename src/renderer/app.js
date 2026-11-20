'use strict';
(() => {
  const api = window.api;
  const $ = (sel, root = document) => root.querySelector(sel);

  // ------------------------------------------------------------------ biểu tượng
  const svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const ICONS = {
    back: svg('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>'),
    forward: svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
    reload: svg('<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>'),
    stop: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    home: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>'),
    plus: svg('<path d="M12 5v14"/><path d="M5 12h14"/>'),
    more: svg('<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>'),
    external: svg('<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    userPlus: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>'),
    incognito: svg('<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    warn: svg('<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>'),
    globe: svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
    up: svg('<path d="m18 15-6-6-6 6"/>'),
    down: svg('<path d="m6 9 6 6 6-6"/>'),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
    trash: svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'),
    eraser: svg('<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 19"/><path d="M22 21H7"/><path d="m5 11 9 9"/>'),
    volume: svg('<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'),
    muted: svg('<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m23 9-6 6"/><path d="m17 9 6 6"/>'),
    open: svg('<path d="M7 17 17 7"/><path d="M7 7h10v10"/>'),
    dashboard: svg('<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="19" cy="12" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7.5 12h9"/><path d="M7.2 10.8C10 7 13 5 16.5 5"/><path d="M7.2 13.2C10 17 13 19 16.5 19"/>'),
    star: svg('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>'),
    starFill: svg('<path fill="currentColor" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>'),
    key: svg('<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3"/><path d="m16 7 3 3"/><path d="m18 5 2 2"/>'),
    folder: svg('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>'),
    chevrons: svg('<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>'),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
    cloudOff: svg('<path d="m2 2 20 20"/><path d="M5.78 5.78A7 7 0 0 0 7 19h9a5 5 0 0 0 2.6-.73"/><path d="M21.6 15.56A5 5 0 0 0 18 10h-1.26A8 8 0 0 0 9.88 4.34"/>'),
  };
  const LOGO = `<svg viewBox="0 0 64 64"><defs><linearGradient id="mmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b61ff"/><stop offset="1" stop-color="#2f9bff"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="16" fill="url(#mmg)"/><rect x="11" y="13" width="13" height="10" rx="3" fill="#ff6b6b"/><rect x="25.5" y="13" width="13" height="10" rx="3" fill="#ffd166"/><rect x="40" y="13" width="13" height="10" rx="3" fill="#06d6a0"/><rect x="11" y="20" width="42" height="31" rx="5" fill="#fff"/><rect x="17" y="27" width="30" height="4" rx="2" fill="#c9d3ff"/><rect x="17" y="35" width="22" height="4" rx="2" fill="#e3e8ff"/></svg>`;

  // 30 màu nhận diện hồ sơ (trùng với danh sách trong src/main/store.js).
  const PALETTE = [
    '#e8453c', '#c62828', '#d81b60', '#ff6d9f', '#ff7043', '#f29900', '#ffb300', '#f4c20d', '#c0ca33', '#7cb342',
    '#34a853', '#2e7d32', '#00897b', '#26c6da', '#12b5cb', '#0097a7', '#64b5f6', '#4285f4', '#1565c0', '#5c6bc0',
    '#7b61ff', '#5e35b1', '#c158dc', '#8e24aa', '#ba68c8', '#8d6e63', '#5d4037', '#78909c', '#546e7a', '#3c4043',
  ];
  const TEMP_COLOR = '#80868b';

  // ------------------------------------------------------------------ trạng thái
  let S = { tabs: [], activeId: null, profiles: [], settings: {}, closedCount: 0 };
  let info = null;
  let lastActiveId = null;
  const mru = [];
  const tabEls = new Map();
  const stateListeners = new Set();
  const renderHooks = [];
  const initHooks = [];
  const extraSections = [];
  let addressEditing = false;
  let overlayDepth = 0;
  let drag = null;
  let browsersCache = null;

  // ------------------------------------------------------------------ tiện ích
  function el(tag, props = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'icon') e.innerHTML = ICONS[v];
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(children)) {
      if (c === undefined || c === null || c === false) continue;
      e.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return e;
  }

  function initials(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return [...words[0]].slice(0, 2).join('').toUpperCase();
    return ([...words[0]][0] + [...words[words.length - 1]][0]).toUpperCase();
  }

  function fgFor(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#fff';
    const n = parseInt(m[1], 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.68 ? '#1f2328' : '#ffffff';
  }

  function setPc(node, color) {
    node.style.setProperty('--pc', color);
    node.style.setProperty('--pc-fg', fgFor(color));
  }

  function avatar(p, size) {
    const a = el('div', { class: 'avatar', text: initials(p.name) });
    setPc(a, p.color);
    if (size) a.style.setProperty('--size', `${size}px`);
    return a;
  }

  function profileOf(tab) {
    if (!tab) return null;
    if (tab.temp) return { id: null, temp: true, name: tab.tempLabel || 'Ẩn danh', color: TEMP_COLOR, note: 'Không lưu đăng nhập' };
    return S.profiles.find((p) => p.id === tab.profileId) || { id: tab.profileId, name: '?', color: '#888', note: '' };
  }

  const activeTab = () => S.tabs.find((t) => t.id === S.activeId) || null;
  const tabsOfProfile = (id) => S.tabs.filter((t) => !t.temp && t.profileId === id);
  const menuLabel = (s) => String(s || '').replace(/&/g, '&&');

  function hostOf(url) {
    try { return new URL(url).hostname; } catch { return ''; }
  }

  function displayUrl(t) {
    if (!t || t.showStart) return '';
    return (t.error && t.error.url) || t.url || '';
  }

  function tabTitle(t) {
    if (t.showStart) return 'Tab mới';
    if (t.error) return 'Không mở được trang';
    return t.title || hostOf(t.url) || 'Đang tải…';
  }

  function nextColor() {
    const used = new Set(S.profiles.map((p) => p.color));
    return PALETTE.find((c) => !used.has(c)) || PALETTE[S.profiles.length % PALETTE.length];
  }

  const iconCache = new Map();
  function avatarPng(p) {
    if (!p) return {};
    const key = `${p.color}|${p.name}`;
    if (iconCache.has(key)) return iconCache.get(key);
    const make = (px) => {
      const c = document.createElement('canvas');
      c.width = px;
      c.height = px;
      const g = c.getContext('2d');
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = fgFor(p.color);
      g.font = `700 ${Math.round(px * 0.44)}px "Segoe UI", system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(initials(p.name), px / 2, px / 2 + px * 0.04);
      return c.toDataURL('image/png');
    };
    const v = { icon: make(16), icon2x: make(32) };
    iconCache.set(key, v);
    return v;
  }

  async function popup(template, anchor, pos) {
    let x;
    let y;
    if (pos) ({ x, y } = pos);
    else {
      const r = anchor.getBoundingClientRect();
      x = r.left;
      y = r.bottom + 2;
    }
    return api.popupMenu(template, x, y);
  }

  async function getBrowsers(force = false) {
    if (!force && browsersCache && Date.now() - browsersCache.at < 30000) return browsersCache.list;
    const list = await api.detectBrowsers();
    browsersCache = { at: Date.now(), list };
    return list;
  }

  // ------------------------------------------------------------------ hộp thoại (modal)
  // Trang web (WebContentsView) luôn nằm trên giao diện HTML, nên khi mở hộp thoại
  // phải tạm ẩn trang và hiển thị ảnh chụp của nó làm nền.
  async function pushOverlay() {
    overlayDepth += 1;
    if (overlayDepth !== 1) return;
    document.body.classList.add('has-overlay');
    const snap = await api.overlay(true);
    const s = $('#snapshot');
    if (snap && overlayDepth > 0) {
      s.style.backgroundImage = `url("${snap}")`;
      s.classList.add('on');
    }
  }

  function popOverlay() {
    overlayDepth = Math.max(0, overlayDepth - 1);
    if (overlayDepth !== 0) return;
    document.body.classList.remove('has-overlay');
    const s = $('#snapshot');
    s.classList.remove('on');
    s.style.backgroundImage = '';
    api.overlay(false);
  }

  async function openModal({ title, wide = false, onClose }) {
    await pushOverlay();
    const root = $('#modal-root');
    const backdrop = el('div', { class: 'modal-backdrop' });
    const head = el('div', { class: 'modal-head' }, [el('h3', { text: title })]);
    const body = el('div', { class: 'modal-body' });
    const foot = el('div', { class: 'modal-foot' });
    const modal = el('div', { class: `modal${wide ? ' wide' : ''}`, role: 'dialog', 'aria-label': title }, [head, body, foot]);
    backdrop.append(modal);
    root.append(backdrop);
    let closed = false;
    const onKey = (e) => {
      if (e.key === 'Escape' && root.lastElementChild === backdrop) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    function close() {
      if (closed) return;
      closed = true;
      backdrop.remove();
      document.removeEventListener('keydown', onKey, true);
      popOverlay();
      if (onClose) onClose();
    }
    document.addEventListener('keydown', onKey, true);
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
    return { modal, head, body, foot, close };
  }

  function confirmDialog({ title, message, okText = 'Đồng ý', danger = false }) {
    return new Promise((resolve) => {
      let result = false;
      openModal({ title, onClose: () => resolve(result) }).then((m) => {
        m.body.append(el('p', { text: message }));
        const ok = el('button', {
          class: `btn primary${danger ? ' danger-solid' : ''}`,
          text: okText,
          onclick: () => { result = true; m.close(); },
        });
        m.foot.append(el('button', { class: 'btn', text: 'Hủy', onclick: () => m.close() }), ok);
        ok.focus();
      });
    });
  }

  // ------------------------------------------------------------------ form hồ sơ
  async function openProfileForm(profile = null) {
    const isNew = !profile;
    const data = {
      name: profile ? profile.name : `Hồ sơ ${S.profiles.length + 1}`,
      note: profile ? profile.note || '' : '',
      color: profile ? profile.color : nextColor(),
      startUrl: profile ? profile.startUrl || '' : (S.settings.defaultStartUrl || ''),
    };
    const m = await openModal({ title: isNew ? 'Tạo hồ sơ mới' : `Sửa hồ sơ “${profile.name}”` });

    const name = el('input', { class: 'input', type: 'text', value: data.name, maxlength: '60' });
    const note = el('input', { class: 'input', type: 'text', value: data.note, maxlength: '120', placeholder: 'Ví dụ: email hoặc tên tài khoản Muse AI' });
    const startUrl = el('input', { class: 'input', type: 'text', value: data.startUrl, placeholder: 'https://… (để trống: mở trang Tab mới)' });
    const swatches = el('div', { class: 'swatches' });
    const preview = avatar(data, 44);
    const refreshPreview = () => {
      preview.textContent = initials(name.value || '?');
      setPc(preview, data.color);
    };
    const pickColor = (c, btn) => {
      data.color = c;
      swatches.querySelectorAll('.swatch').forEach((s) => s.classList.toggle('selected', s === btn));
      refreshPreview();
    };
    PALETTE.forEach((c) => {
      const b = el('button', { class: `swatch${c === data.color ? ' selected' : ''}`, type: 'button', title: c });
      setPc(b, c);
      b.addEventListener('click', () => pickColor(c, b));
      swatches.append(b);
    });
    // Ô chọn màu tùy ý (ngoài 30 màu gợi ý).
    const custom = el('label', { class: `swatch custom${PALETTE.includes(data.color) ? '' : ' selected'}`, title: 'Màu khác…' });
    const customInput = el('input', { type: 'color', value: data.color });
    custom.append(customInput);
    setPc(custom, PALETTE.includes(data.color) ? '#ffffff' : data.color);
    customInput.addEventListener('input', () => { setPc(custom, customInput.value); pickColor(customInput.value, custom); });
    swatches.append(custom);
    name.addEventListener('input', refreshPreview);
    m.head.prepend(preview);

    let openAfter = null;
    m.body.append(
      el('label', { class: 'field' }, [el('span', { text: 'Tên hồ sơ' }), name]),
      el('label', { class: 'field' }, [el('span', { text: 'Ghi chú' }), note, el('small', { text: 'Giúp bạn nhận ra tài khoản nào đang đăng nhập trong hồ sơ này.' })]),
      el('div', { class: 'field' }, [el('span', { text: 'Màu nhận diện' }), swatches]),
      el('label', { class: 'field' }, [el('span', { text: 'Trang khởi động' }), startUrl, el('small', { text: 'Trang mở sẵn mỗi khi tạo tab mới bằng hồ sơ này (ví dụ trang Muse AI, Gmail…).' })]),
    );
    if (isNew) {
      openAfter = el('input', { type: 'checkbox', class: 'switch', checked: true });
      m.body.append(el('label', { class: 'switch-row' }, [el('div', {}, [el('b', { text: 'Mở tab ngay sau khi tạo' }), el('small', { text: 'Để đăng nhập tài khoản cho hồ sơ này luôn.' })]), openAfter]));
    }

    const save = async () => {
      const payload = { name: name.value.trim() || data.name, note: note.value, color: data.color, startUrl: startUrl.value.trim() };
      if (isNew) {
        const p = await api.createProfile(payload);
        m.close();
        if (p && openAfter && openAfter.checked) api.newTab({ profileId: p.id });
      } else {
        await api.updateProfile(profile.id, payload);
        m.close();
      }
    };
    [name, note, startUrl].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); }));
    m.foot.append(
      el('button', { class: 'btn', text: 'Hủy', onclick: () => m.close() }),
      el('button', { class: 'btn primary', text: isNew ? 'Tạo hồ sơ' : 'Lưu', onclick: save }),
    );
    name.focus();
    name.select();
  }

  async function clearProfileFlow(p) {
    const ok = await confirmDialog({
      title: 'Xóa dữ liệu đăng nhập',
      message: `Xóa toàn bộ cookie, phiên đăng nhập và bộ nhớ đệm của hồ sơ “${p.name}”? Mọi tài khoản trong hồ sơ này sẽ bị đăng xuất. Hồ sơ vẫn được giữ lại.`,
      okText: 'Xóa dữ liệu',
      danger: true,
    });
    if (ok) {
      await api.clearProfile(p.id);
      showNotice(`Đã xóa dữ liệu đăng nhập của “${p.name}”`, null, 5000);
    }
  }

  async function deleteProfileFlow(p) {
    const n = tabsOfProfile(p.id).length;
    const ok = await confirmDialog({
      title: 'Xóa hồ sơ',
      message: `Xóa vĩnh viễn hồ sơ “${p.name}” cùng toàn bộ dữ liệu đăng nhập của nó?${n ? ` ${n} tab đang mở của hồ sơ này sẽ bị đóng.` : ''} Không thể hoàn tác.`,
      okText: 'Xóa hồ sơ',
      danger: true,
    });
    if (ok) await api.deleteProfile(p.id);
  }

  // ------------------------------------------------------------------ cửa sổ quản lý
  async function openManager(section = 'profiles') {
    let current = section;
    let listener = null;
    const m = await openModal({ title: 'Quản lý', wide: true, onClose: () => stateListeners.delete(listener) });
    const sections = [
      ['profiles', 'Hồ sơ trong ứng dụng'],
      ...extraSections.map((x) => [x.id, x.label]),
      ['browsers', 'Trình duyệt trên máy'],
      ['settings', 'Cài đặt'],
      ['about', 'Phím tắt & giới thiệu'],
    ];
    const seg = el('div', { class: 'seg' });
    sections.forEach(([id, label]) => {
      seg.append(el('button', { 'data-id': id, text: label, onclick: () => { current = id; draw(); } }));
    });
    m.modal.insertBefore(seg, m.body);
    m.foot.append(el('button', { class: 'btn', text: 'Đóng', onclick: () => m.close() }));

    let lastSig = '';
    function draw(force = true) {
      seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === current));
      const extra = extraSections.find((x) => x.id === current);
      if (current === 'profiles') {
        const sig = JSON.stringify([S.profiles, S.tabs.map((t) => t.profileId)]);
        if (!force && sig === lastSig) return;
        lastSig = sig;
        drawProfiles(m.body);
      } else if (extra) {
        // Mục do module khác đăng ký: vẽ lại khi dữ liệu liên quan (sig) thay đổi.
        const sig = extra.sig ? extra.sig() : '';
        if (!force && (!extra.sig || sig === lastSig)) return;
        lastSig = sig;
        extra.draw(m.body, { redraw: () => draw(true), close: () => m.close() });
      } else if (force) {
        lastSig = '';
        if (current === 'browsers') drawBrowsers(m.body);
        if (current === 'settings') drawSettings(m.body);
        if (current === 'about') drawAbout(m.body);
      }
    }
    listener = () => draw(false);
    stateListeners.add(listener);
    draw();
  }

  function drawProfiles(body) {
    const scroll = body.scrollTop;
    body.replaceChildren();
    const bar = el('div', { class: 'list-toolbar' }, [
      el('button', { class: 'btn primary', text: '+ Tạo hồ sơ', onclick: () => openProfileForm() }),
      el('button', {
        class: 'btn',
        text: 'Mở tất cả hồ sơ',
        disabled: !S.profiles.length,
        onclick: () => S.profiles.forEach((p, i) => api.newTab({ profileId: p.id, background: i > 0 })),
      }),
      el('span', { class: 'spacer' }),
      el('span', { class: 'muted', text: `${S.profiles.length} hồ sơ` }),
    ]);
    body.append(bar);
    if (!S.profiles.length) {
      body.append(el('div', { class: 'empty-note', text: 'Chưa có hồ sơ nào. Tạo hồ sơ cho từng tài khoản (Muse AI, Gmail, Facebook…) để đăng nhập độc lập.' }));
      return;
    }
    S.profiles.forEach((p, i) => {
      const open = tabsOfProfile(p.id).length;
      const meta = [p.note, p.startUrl && hostOf(p.startUrl), open ? `${open} tab đang mở` : ''].filter(Boolean).join(' · ');
      const btn = (icon, title, fn, disabled) => el('button', { class: 'icon-btn', icon, title, onclick: fn, disabled });
      body.append(el('div', { class: 'prow' }, [
        avatar(p),
        el('div', { class: 'prow-main' }, [el('b', { text: p.name }), el('span', { text: meta || 'Chưa có ghi chú' })]),
        el('div', { class: 'prow-actions' }, [
          el('button', { class: 'btn sm', text: 'Mở tab', onclick: () => api.newTab({ profileId: p.id }) }),
          btn('edit', 'Sửa hồ sơ', () => openProfileForm(p)),
          btn('up', 'Lên trên', () => api.moveProfile(p.id, -1), i === 0),
          btn('down', 'Xuống dưới', () => api.moveProfile(p.id, 1), i === S.profiles.length - 1),
          btn('eraser', 'Xóa dữ liệu đăng nhập (đăng xuất mọi tài khoản)', () => clearProfileFlow(p)),
          btn('trash', 'Xóa hồ sơ', () => deleteProfileFlow(p)),
        ]),
      ]));
    });
    body.append(el('div', { class: 'callout' }, [
      el('b', { text: 'Mỗi hồ sơ là một "trình duyệt" riêng. ' }),
      'Cookie, phiên đăng nhập, bộ nhớ trang web của từng hồ sơ được lưu tách biệt trong thư mục dữ liệu cạnh file chạy, nên có thể đăng nhập nhiều tài khoản cùng một trang (Muse AI, Gmail, Facebook…) cùng lúc. Nhiều tab của cùng một hồ sơ thì dùng chung đăng nhập, giống Chrome.',
    ]));
    body.scrollTop = scroll;
  }

  async function drawBrowsers(body) {
    body.replaceChildren(el('div', { class: 'empty-note', text: 'Đang tìm trình duyệt trên máy…' }));
    const list = await getBrowsers(true);
    body.replaceChildren();
    body.append(el('div', { class: 'callout' }, [
      el('b', { text: 'Hồ sơ của các trình duyệt đã cài trên máy. ' }),
      'Bấm "Mở" để mở cửa sổ trình duyệt đó với đúng hồ sơ (Chrome, Edge, Brave, Cốc Cốc…). Cửa sổ này chạy riêng, không nằm trong tab của ứng dụng. Dùng khi một trang không cho đăng nhập trong ứng dụng, hoặc khi bạn cần tiện ích (extension) của trình duyệt.',
    ]));
    if (!list.length) {
      body.append(el('div', { class: 'empty-note', text: 'Không tìm thấy trình duyệt nhân Chromium nào (Chrome, Edge, Brave, Cốc Cốc, Vivaldi).' }));
      return;
    }
    const t = activeTab();
    const url = displayUrl(t);
    const canUrl = /^https?:/i.test(url);
    for (const b of list) {
      const group = el('div', { class: 'bgroup' }, [el('h4', {}, [b.name, el('small', { text: `${b.profiles.length} hồ sơ` })])]);
      const profiles = b.profiles.length ? b.profiles : [{ dir: '', name: 'Mở trình duyệt', email: '' }];
      for (const pr of profiles) {
        const launch = async (withUrl) => {
          const r = await api.launchBrowser({ browserId: b.id, profileDir: pr.dir, url: withUrl ? url : undefined });
          if (r && r.error) showNotice(r.error, null, 6000);
          else showNotice(`Đang mở ${b.name}${pr.dir ? ` – ${pr.name}` : ''}`, null, 4000);
        };
        group.append(el('div', { class: 'brow' }, [
          el('div', {}, [el('b', { text: pr.name }), el('span', { text: [pr.email, pr.dir].filter(Boolean).join(' · ') })]),
          el('div', { class: 'row' }, [
            canUrl ? el('button', { class: 'btn sm', text: 'Mở trang hiện tại', title: url, onclick: () => launch(true) }) : null,
            el('button', { class: 'btn sm primary', text: 'Mở', onclick: () => launch(false) }),
          ]),
        ]));
      }
      body.append(group);
    }
  }

  function drawSettings(body) {
    body.replaceChildren();
    const s = S.settings;
    const sw = (key, title, desc) => {
      const input = el('input', { type: 'checkbox', class: 'switch', checked: !!s[key] });
      input.addEventListener('change', () => api.updateSettings({ [key]: input.checked }));
      return el('label', { class: 'switch-row' }, [el('div', {}, [el('b', { text: title }), el('small', { text: desc })]), input]);
    };
    body.append(
      sw('restoreSession', 'Mở lại các tab khi khởi động', 'Lần sau mở ứng dụng sẽ khôi phục các tab đang mở (tab ẩn danh không được khôi phục).'),
      sw('googleLoginFix', 'Chế độ tương thích đăng nhập Google', 'Giả lập trình duyệt Firefox trên trang accounts.google.com để Google không chặn đăng nhập ("trình duyệt này có thể không an toàn"). Tắt nếu gặp lỗi đăng nhập Google.'),
      sw('showSidebar', 'Hiện thanh hồ sơ bên trái', 'Danh sách hồ sơ để chuyển tài khoản nhanh bằng một cú bấm.'),
      sw('showBookmarks', 'Hiện thanh dấu trang', 'Thanh dấu trang nằm dưới thanh địa chỉ (Ctrl+Shift+B để bật/tắt nhanh).'),
      sw('groupTabs', 'Gom tab theo hồ sơ', 'Các tab cùng hồ sơ được gom thành một nhóm có tên hồ sơ, bấm tên nhóm để thu gọn/mở rộng.'),
      sw('offerSavePasswords', 'Đề nghị lưu mật khẩu', 'Hỏi lưu tên đăng nhập và mật khẩu sau khi đăng nhập trên một trang.'),
      sw('autofillPasswords', 'Tự điền mật khẩu', 'Tự điền khi trang đăng nhập chỉ có một tài khoản đã lưu; nhiều tài khoản thì hiện danh sách để chọn.'),
    );

    const defUrl = el('input', { class: 'input', type: 'text', value: s.defaultStartUrl || '', placeholder: 'https://…' });
    defUrl.addEventListener('change', () => api.updateSettings({ defaultStartUrl: defUrl.value.trim() }));
    const ql = el('textarea', { class: 'textarea', spellcheck: 'false' });
    ql.value = (s.quickLinks || []).map((q) => `${q.title} | ${q.url}`).join('\n');
    ql.addEventListener('change', () => {
      const links = ql.value.split('\n').map((line) => {
        const idx = line.lastIndexOf('|');
        const title = (idx >= 0 ? line.slice(0, idx) : line).trim();
        let url = (idx >= 0 ? line.slice(idx + 1) : line).trim();
        if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
        return title && url ? { title, url } : null;
      }).filter(Boolean);
      api.updateSettings({ quickLinks: links });
    });
    body.append(
      el('div', { style: 'height:12px' }),
      el('label', { class: 'field' }, [el('span', { text: 'Trang khởi động mặc định cho hồ sơ mới' }), defUrl, el('small', { text: 'Điền sẵn vào ô "Trang khởi động" khi tạo hồ sơ, ví dụ địa chỉ trang Muse AI bạn hay dùng.' })]),
      el('label', { class: 'field' }, [el('span', { text: 'Lối tắt trên trang Tab mới' }), ql, el('small', { text: 'Mỗi dòng một lối tắt theo dạng:  Tên | địa chỉ web' })]),
    );
    const dataRow = el('div', { class: 'field' }, [
      el('span', { text: 'Thư mục dữ liệu (hồ sơ, đăng nhập)' }),
      el('div', { class: 'row' }, [
        el('code', { class: 'mono', style: 'flex:1;align-self:center', text: info ? info.dataDir : '' }),
        el('button', { class: 'btn sm', text: 'Mở thư mục', onclick: () => api.openDataDir() }),
      ]),
      el('small', { text: 'Sao chép cả thư mục ứng dụng (gồm thư mục dữ liệu) sang máy khác để mang theo các phiên đăng nhập. Không chia sẻ thư mục này cho người khác.' }),
    ]);
    body.append(dataRow);
  }

  function drawAbout(body) {
    body.replaceChildren();
    const rows = [
      ['Ctrl + T', 'Tab mới (chọn hồ sơ)'],
      ['Ctrl + Shift + N', 'Tab ẩn danh (không lưu đăng nhập)'],
      ['Ctrl + W', 'Đóng tab'],
      ['Ctrl + Shift + T', 'Mở lại tab vừa đóng'],
      ['Ctrl + Tab / Ctrl + Shift + Tab', 'Chuyển tab kế / trước'],
      ['Ctrl + 1…8 / Ctrl + 9', 'Chuyển tới tab thứ n / tab cuối'],
      ['Ctrl + L, Alt + D, F6', 'Chọn thanh địa chỉ'],
      ['F5 / Ctrl + R', 'Tải lại (thêm Shift: bỏ qua bộ nhớ đệm)'],
      ['Alt + ← / Alt + →', 'Quay lại / Tiến tới'],
      ['Ctrl + F', 'Tìm trong trang'],
      ['Ctrl + + / Ctrl + − / Ctrl + 0', 'Phóng to / Thu nhỏ / Cỡ mặc định'],
      ['Ctrl + P', 'In trang'],
      ['Ctrl + D', 'Thêm trang hiện tại vào dấu trang'],
      ['Ctrl + Shift + B', 'Hiện/ẩn thanh dấu trang'],
      ['F11', 'Toàn màn hình'],
      ['F12', 'Công cụ nhà phát triển của trang'],
      ['Bấm hồ sơ ở thanh bên', 'Chuyển tới tab của hồ sơ (mở tab mới nếu chưa có)'],
      ['Ctrl + bấm / bấm chuột giữa hồ sơ', 'Luôn mở tab mới của hồ sơ'],
      ['Bấm chuột giữa vào tab', 'Đóng tab'],
    ];
    const table = el('table', { class: 'kbd-table' });
    rows.forEach(([k, v]) => table.append(el('tr', {}, [el('td', {}, [el('kbd', { text: k })]), el('td', { text: v })])));
    body.append(
      el('div', { class: 'row', style: 'align-items:center;gap:14px;margin:8px 0 14px' }, [
        Object.assign(el('div', { style: 'width:52px;height:52px' }), { innerHTML: LOGO }),
        el('div', {}, [
          el('b', { style: 'font-size:16px', text: 'TabManagerSP' }),
          el('div', { class: 'muted', text: info ? `Phiên bản ${info.version} · Chromium ${info.chrome} · Electron ${info.electron}` : '' }),
        ]),
      ]),
      table,
      el('div', { class: 'callout' }, [
        el('b', { text: 'Lưu ý bảo mật: ' }),
        'Thư mục dữ liệu chứa phiên đăng nhập của mọi hồ sơ. Ai có thư mục này có thể dùng các tài khoản đó. Hãy giữ bản portable ở nơi an toàn.',
      ]),
    );
  }

  // ------------------------------------------------------------------ menu native
  async function openNewTabMenu(anchor) {
    const items = S.profiles.map((p, i) => ({
      id: `p:${p.id}`,
      label: `${i < 9 ? `&${i + 1}   ` : '     '}${menuLabel(p.name)}`,
      sublabel: p.note || undefined,
      ...avatarPng(p),
    }));
    if (items.length) items.push({ type: 'separator' });
    items.push({ id: 'temp', label: 'Tab ẩn danh (không lưu đăng nhập)', accelerator: 'CmdOrCtrl+Shift+N' });
    items.push({ id: 'create', label: 'Tạo hồ sơ mới…' });
    if (S.profiles.length) items.push({ id: 'manage', label: 'Quản lý hồ sơ…' });
    const r = await popup(items, anchor || $('#btn-new-tab'));
    if (!r) return;
    if (r.startsWith('p:')) api.newTab({ profileId: r.slice(2) });
    else if (r === 'temp') api.newTab({ temp: true });
    else if (r === 'create') openProfileForm();
    else if (r === 'manage') openManager('profiles');
  }

  async function openTabMenu(t, x, y) {
    const idx = S.tabs.findIndex((o) => o.id === t.id);
    const items = [
      { id: 'new', label: 'Tab mới cùng hồ sơ' },
      { id: 'reload', label: 'Tải lại' },
      { id: 'dup', label: 'Nhân bản tab', enabled: !t.showStart },
      { id: 'mute', label: t.muted ? 'Bật tiếng tab' : 'Tắt tiếng tab' },
      { type: 'separator' },
      { id: 'close', label: 'Đóng tab', accelerator: 'CmdOrCtrl+W' },
      { id: 'others', label: 'Đóng các tab khác', enabled: S.tabs.length > 1 },
      { id: 'right', label: 'Đóng các tab bên phải', enabled: idx < S.tabs.length - 1 },
      { type: 'separator' },
      { id: 'reopen', label: 'Mở lại tab vừa đóng', accelerator: 'CmdOrCtrl+Shift+T', enabled: S.closedCount > 0 },
    ];
    const r = await popup(items, null, { x, y });
    const map = {
      new: 'newSameProfile', reload: 'reload', dup: 'duplicate', mute: 'mute', close: 'close', others: 'closeOthers', right: 'closeRight', reopen: 'reopen',
    };
    if (r && map[r]) api.tabAction(map[r], t.id);
  }

  async function openPillMenu() {
    const t = activeTab();
    if (!t) return;
    const p = profileOf(t);
    const url = displayUrl(t);
    const others = S.profiles.filter((o) => o.id !== t.profileId);
    const items = [
      { label: `${menuLabel(p.name)}${p.note ? ` — ${menuLabel(p.note)}` : ''}`, enabled: false, ...(p.temp ? {} : avatarPng(p)) },
      { type: 'separator' },
      { id: 'newtab', label: 'Mở tab mới với hồ sơ này' },
    ];
    if (others.length && url) {
      items.push({
        label: 'Mở trang này bằng hồ sơ khác',
        submenu: others.map((o) => ({ id: `open:${o.id}`, label: menuLabel(o.name), sublabel: o.note || undefined, ...avatarPng(o) })),
      });
    }
    if (url) items.push({ id: 'temp', label: 'Mở trang này trong tab ẩn danh' });
    if (!p.temp) {
      items.push(
        { type: 'separator' },
        { id: 'edit', label: 'Sửa hồ sơ…' },
        { id: 'clear', label: 'Xóa dữ liệu đăng nhập của hồ sơ…' },
      );
    }
    const r = await popup(items, $('#profile-pill'));
    if (!r) return;
    if (r === 'newtab') api.tabAction('newSameProfile', t.id);
    else if (r.startsWith('open:')) api.newTab({ profileId: r.slice(5), url });
    else if (r === 'temp') api.newTab({ temp: true, url });
    else if (r === 'edit') openProfileForm(p);
    else if (r === 'clear') clearProfileFlow(p);
  }

  async function openExternalMenu() {
    const t = activeTab();
    if (!t) return;
    const url = displayUrl(t);
    const canUrl = /^https?:/i.test(url);
    const browsers = await getBrowsers();
    const items = [{ id: 'default', label: 'Trình duyệt mặc định của máy', enabled: canUrl }];
    if (browsers.length) items.push({ type: 'separator' });
    for (const b of browsers) {
      const subs = b.profiles.length
        ? b.profiles.map((pr) => ({ id: `b|${b.id}|${pr.dir}`, label: `${menuLabel(pr.name)}${pr.email ? `  (${menuLabel(pr.email)})` : ''}` }))
        : [{ id: `b|${b.id}|`, label: 'Mở' }];
      items.push({ label: b.name, submenu: subs });
    }
    items.push({ type: 'separator' }, { id: 'manage', label: 'Xem hồ sơ trình duyệt trên máy…' });
    const r = await popup(items, $('#btn-external'));
    if (!r) return;
    if (r === 'default') api.openExternal(url);
    else if (r === 'manage') openManager('browsers');
    else if (r.startsWith('b|')) {
      const [, browserId, ...rest] = r.split('|');
      const res = await api.launchBrowser({ browserId, profileDir: rest.join('|'), url: canUrl ? url : undefined });
      if (res && res.error) showNotice(res.error, null, 6000);
    }
  }

  async function openMainMenu() {
    const t = activeTab();
    const hasPage = !!(t && !t.showStart);
    const items = [
      { id: 'newtab', label: 'Tab mới…', accelerator: 'CmdOrCtrl+T' },
      { id: 'temp', label: 'Tab ẩn danh mới', accelerator: 'CmdOrCtrl+Shift+N' },
      { id: 'reopen', label: 'Mở lại tab vừa đóng', accelerator: 'CmdOrCtrl+Shift+T', enabled: S.closedCount > 0 },
      { type: 'separator' },
      { id: 'zoomin', label: 'Phóng to', accelerator: 'CmdOrCtrl+Plus', enabled: hasPage },
      { id: 'zoomout', label: 'Thu nhỏ', accelerator: 'CmdOrCtrl+-', enabled: hasPage },
      { id: 'zoomreset', label: 'Cỡ mặc định (100%)', accelerator: 'CmdOrCtrl+0', enabled: hasPage },
      { id: 'find', label: 'Tìm trong trang…', accelerator: 'CmdOrCtrl+F', enabled: hasPage },
      { id: 'print', label: 'In…', accelerator: 'CmdOrCtrl+P', enabled: hasPage },
      { type: 'separator' },
      { id: 'profiles', label: 'Quản lý hồ sơ…' },
      { id: 'browsers', label: 'Hồ sơ trình duyệt trên máy…' },
      { id: 'settings', label: 'Cài đặt…' },
      { id: 'datadir', label: 'Mở thư mục dữ liệu' },
      { type: 'separator' },
      { id: 'devtools', label: 'Công cụ nhà phát triển', accelerator: 'F12', enabled: hasPage },
      { id: 'about', label: 'Phím tắt & giới thiệu' },
    ];
    const btn = $('#btn-menu');
    const rect = btn.getBoundingClientRect();
    const r = await popup(items, null, { x: rect.right - 250, y: rect.bottom + 2 });
    if (!r) return;
    const id = t && t.id;
    switch (r) {
      case 'newtab': openNewTabMenu(); break;
      case 'temp': api.newTab({ temp: true }); break;
      case 'reopen': api.tabAction('reopen'); break;
      case 'zoomin': api.tabAction('zoom', id, 1); break;
      case 'zoomout': api.tabAction('zoom', id, -1); break;
      case 'zoomreset': api.tabAction('zoom', id, 0); break;
      case 'find': openFind(); break;
      case 'print': api.tabAction('print', id); break;
      case 'profiles': openManager('profiles'); break;
      case 'browsers': openManager('browsers'); break;
      case 'settings': openManager('settings'); break;
      case 'datadir': api.openDataDir(); break;
      case 'devtools': api.tabAction('devtools', id); break;
      case 'about': openManager('about'); break;
      default: break;
    }
  }

  async function openRailMenu(p, x, y) {
    const open = tabsOfProfile(p.id).length;
    const items = [
      { label: `${menuLabel(p.name)}${p.note ? ` — ${menuLabel(p.note)}` : ''}`, enabled: false },
      { type: 'separator' },
      { id: 'new', label: 'Mở tab mới' },
      { id: 'closeall', label: `Đóng các tab của hồ sơ (${open})`, enabled: open > 0 },
      { type: 'separator' },
      { id: 'edit', label: 'Sửa hồ sơ…' },
      { id: 'clear', label: 'Xóa dữ liệu đăng nhập…' },
      { id: 'delete', label: 'Xóa hồ sơ…' },
    ];
    const r = await popup(items, null, { x, y });
    if (r === 'new') api.newTab({ profileId: p.id });
    if (r === 'closeall') tabsOfProfile(p.id).forEach((t) => api.tabAction('close', t.id));
    if (r === 'edit') openProfileForm(p);
    if (r === 'clear') clearProfileFlow(p);
    if (r === 'delete') deleteProfileFlow(p);
  }

  // ------------------------------------------------------------------ thông báo nhỏ
  let noticeTimer = null;
  function showNotice(text, action, ms = 6000) {
    const n = $('#notice');
    n.replaceChildren(el('span', { class: 'notice-text', text, title: text }));
    if (action) n.append(el('button', { text: action.label, onclick: () => { action.fn(); n.hidden = true; } }));
    n.hidden = false;
    clearTimeout(noticeTimer);
    if (ms) noticeTimer = setTimeout(() => { n.hidden = true; }, ms);
  }

  // ------------------------------------------------------------------ tab strip
  function createTabEl(id) {
    const icon = el('span', { class: 'tab-icon' });
    const badge = el('span', { class: 'tab-badge' });
    const title = el('span', { class: 'tab-title' });
    const audio = el('button', { class: 'tab-btn tab-audio', title: 'Tắt/bật tiếng', hidden: true });
    const close = el('button', { class: 'tab-btn tab-close', icon: 'close', title: 'Đóng tab (Ctrl+W)' });
    const node = el('div', { class: 'tab', role: 'tab', 'data-id': id }, [icon, badge, title, audio, close]);
    node.refs = { icon, badge, title, audio, close };

    close.addEventListener('pointerdown', (e) => e.stopPropagation());
    close.addEventListener('click', (e) => { e.stopPropagation(); api.tabAction('close', id); });
    audio.addEventListener('pointerdown', (e) => e.stopPropagation());
    audio.addEventListener('click', (e) => { e.stopPropagation(); api.tabAction('mute', id); });
    node.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); api.tabAction('close', id); } });
    node.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
    node.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const t = S.tabs.find((o) => o.id === id);
      if (t) openTabMenu(t, e.clientX, e.clientY);
    });
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      api.tabAction('activate', id);
      drag = { id, node, startX: e.clientX, moved: false };
      node.setPointerCapture(e.pointerId);
    });
    node.addEventListener('pointermove', (e) => {
      if (!drag || drag.node !== node) return;
      const dx = e.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) < 6) return;
      drag.moved = true;
      node.classList.add('dragging');
      node.style.transform = `translateX(${dx}px)`;
    });
    const endDrag = (e, cancelled) => {
      if (!drag || drag.node !== node) return;
      const d = drag;
      drag = null;
      node.classList.remove('dragging');
      node.style.transform = '';
      if (!d.moved || cancelled) { renderTabs(); return; }
      const others = [...$('#tabs').querySelectorAll('.tab')].filter((x) => x !== node && !x.hidden);
      let idx = 0;
      for (const o of others) {
        const r = o.getBoundingClientRect();
        if (e.clientX > r.left + r.width / 2) idx += 1;
      }
      api.tabAction('move', id, idx);
    };
    node.addEventListener('pointerup', (e) => endDrag(e, false));
    node.addEventListener('pointercancel', (e) => endDrag(e, true));
    return node;
  }

  function updateTabEl(node, t, grouped = false, collapsed = false) {
    const p = profileOf(t);
    const { icon, badge, title, audio } = node.refs;
    setPc(node, p.color);
    node.classList.toggle('grouped', grouped);
    badge.hidden = grouped;
    node.hidden = collapsed;
    node.classList.toggle('active', t.id === S.activeId);
    node.classList.toggle('temp', !!t.temp);
    node.setAttribute('aria-selected', String(t.id === S.activeId));

    const iconKey = t.loading ? 'loading' : (t.favicon && !t.showStart && !t.error ? `img:${t.favicon}` : 'globe');
    if (icon.dataset.key !== iconKey) {
      icon.dataset.key = iconKey;
      if (t.loading) icon.replaceChildren(el('span', { class: 'spinner' }));
      else if (iconKey.startsWith('img:')) {
        const img = el('img', { src: t.favicon, alt: '' });
        img.addEventListener('error', () => { icon.innerHTML = `<span class="fallback">${ICONS.globe}</span>`; });
        icon.replaceChildren(img);
      } else icon.innerHTML = `<span class="fallback">${ICONS.globe}</span>`;
    }
    const badgeText = initials(p.name);
    if (badge.textContent !== badgeText) badge.textContent = badgeText;
    const tt = tabTitle(t);
    if (title.textContent !== tt) title.textContent = tt;
    node.title = `${tt}\nHồ sơ: ${p.name}${p.note ? ` (${p.note})` : ''}`;
    const showAudio = t.audible || t.muted;
    audio.hidden = !showAudio;
    if (showAudio) {
      const k = t.muted ? 'muted' : 'volume';
      if (audio.dataset.k !== k) { audio.dataset.k = k; audio.innerHTML = ICONS[k]; }
    }
  }

  // ------------------------------------------------------------------ nhóm tab
  const groupEls = new Map();

  function groupLabel(t) {
    const p = profileOf(t);
    return p ? p.name : 'Nhóm';
  }

  function createGroupEl(partition) {
    const name = el('span', { class: 'tg-name' });
    const count = el('span', { class: 'tg-count' });
    const node = el('div', { class: 'tab-group', 'data-partition': partition, role: 'button' }, [name, count]);
    node.refs = { name, count };
    let gdrag = null;
    node.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openGroupMenu(partition, e.clientX, e.clientY);
    });
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      gdrag = { startX: e.clientX, moved: false };
      node.setPointerCapture(e.pointerId);
    });
    node.addEventListener('pointermove', (e) => {
      if (!gdrag) return;
      const dx = e.clientX - gdrag.startX;
      if (!gdrag.moved && Math.abs(dx) < 6) return;
      gdrag.moved = true;
      drag = { group: partition };
      groupMembers(partition, node).forEach((x) => { x.classList.add('dragging'); x.style.transform = `translateX(${dx}px)`; });
    });
    const end = (e, cancelled) => {
      if (!gdrag) return;
      const d = gdrag;
      gdrag = null;
      drag = null;
      groupMembers(partition, node).forEach((x) => { x.classList.remove('dragging'); x.style.transform = ''; });
      if (!d.moved) { if (!cancelled) api.tabAction('toggleGroup', null, partition); return; }
      if (cancelled) { renderTabs(); return; }
      // Vị trí mới tính theo các "khối" (nhóm hoặc tab lẻ) khác.
      const units = [...new Set(S.tabs.map((t) => t.partition))].filter((p) => p !== partition);
      let idx = 0;
      for (const p of units) {
        const els = groupMembers(p).filter((x) => !x.hidden);
        if (!els.length) continue;
        const left = els[0].getBoundingClientRect().left;
        const right = els[els.length - 1].getBoundingClientRect().right;
        if (e.clientX > (left + right) / 2) idx += 1;
      }
      api.tabAction('moveGroup', null, { partition, index: idx });
    };
    node.addEventListener('pointerup', (e) => end(e, false));
    node.addEventListener('pointercancel', (e) => end(e, true));
    return node;
  }

  function groupMembers(partition, chip = groupEls.get(partition)) {
    const tabsOf = S.tabs.filter((t) => t.partition === partition).map((t) => tabEls.get(t.id)).filter(Boolean);
    return chip ? [chip, ...tabsOf] : tabsOf;
  }

  async function openGroupMenu(partition, x, y) {
    const list = S.tabs.filter((t) => t.partition === partition);
    if (!list.length) return;
    const first = list[0];
    const p = profileOf(first);
    const collapsed = (S.collapsedGroups || []).includes(partition);
    const items = [
      { label: `Nhóm: ${menuLabel(p.name)}`, enabled: false },
      { type: 'separator' },
      { id: 'new', label: 'Tab mới trong nhóm' },
      { id: 'toggle', label: collapsed ? 'Mở rộng nhóm' : 'Thu gọn nhóm' },
      { id: 'close', label: `Đóng nhóm (${list.length} tab)` },
    ];
    if (!first.temp) items.push({ type: 'separator' }, { id: 'edit', label: 'Sửa hồ sơ…' });
    const r = await popup(items, null, { x, y });
    if (r === 'new') api.tabAction('newSameProfile', list[list.length - 1].id);
    if (r === 'toggle') api.tabAction('toggleGroup', null, partition);
    if (r === 'close') api.tabAction('closeGroup', null, partition);
    if (r === 'edit') openProfileForm(p);
  }

  function renderTabs() {
    const container = $('#tabs');
    const plus = $('#btn-new-tab');
    const grouping = S.settings.groupTabs !== false;
    const collapsed = new Set(S.collapsedGroups || []);
    const counts = {};
    S.tabs.forEach((t) => { counts[t.partition] = (counts[t.partition] || 0) + 1; });
    const seq = [];
    const seenTabs = new Set();
    const seenGroups = new Set();
    let prev = null;
    for (const t of S.tabs) {
      const grouped = grouping && counts[t.partition] >= 2;
      if (grouped && t.partition !== prev) {
        let chip = groupEls.get(t.partition);
        if (!chip) { chip = createGroupEl(t.partition); groupEls.set(t.partition, chip); }
        const p = profileOf(t);
        const isCollapsed = collapsed.has(t.partition);
        setPc(chip, p.color);
        chip.classList.toggle('collapsed', isCollapsed);
        chip.classList.toggle('has-active', S.tabs.some((x) => x.partition === t.partition && x.id === S.activeId));
        if (chip.refs.name.textContent !== groupLabel(t)) chip.refs.name.textContent = groupLabel(t);
        chip.refs.count.textContent = isCollapsed ? String(counts[t.partition]) : '';
        chip.title = `Nhóm hồ sơ “${p.name}” – ${counts[t.partition]} tab\nBấm: ${isCollapsed ? 'mở rộng' : 'thu gọn'} · Kéo: di chuyển cả nhóm · Chuột phải: tùy chọn`;
        seq.push(chip);
        seenGroups.add(t.partition);
      }
      prev = t.partition;
      let node = tabEls.get(t.id);
      if (!node) {
        node = createTabEl(t.id);
        tabEls.set(t.id, node);
      }
      updateTabEl(node, t, grouped, grouped && collapsed.has(t.partition));
      seq.push(node);
      seenTabs.add(t.id);
    }
    seq.push(plus);
    if (!drag) {
      seq.forEach((node, i) => {
        if (container.children[i] !== node) container.insertBefore(node, container.children[i] || null);
      });
    }
    for (const [id, node] of tabEls) {
      if (!seenTabs.has(id)) { node.remove(); tabEls.delete(id); }
    }
    for (const [p, node] of groupEls) {
      if (!seenGroups.has(p)) { node.remove(); groupEls.delete(p); }
    }
  }

  // ------------------------------------------------------------------ thanh bên
  let railSig = '';
  function renderSidebar() {
    const at = activeTab();
    const counts = {};
    S.tabs.forEach((t) => { if (!t.temp) counts[t.profileId] = (counts[t.profileId] || 0) + 1; });
    const sig = JSON.stringify([S.profiles.map((p) => [p.id, p.name, p.color, p.note]), counts, at && at.profileId]);
    if (sig === railSig) return;
    railSig = sig;
    const rail = $('#profile-rail');
    rail.replaceChildren();
    S.profiles.forEach((p) => {
      const n = counts[p.id] || 0;
      const a = avatar(p);
      if (n > 1) a.append(el('span', { class: 'rail-count', text: n }));
      const item = el('div', {
        class: `rail-item${n ? ' open' : ''}${at && at.profileId === p.id ? ' active' : ''}`,
        title: `${p.name}${p.note ? `\n${p.note}` : ''}\n${n ? `${n} tab đang mở` : 'Chưa mở'}\n(Ctrl+bấm: luôn mở tab mới)`,
      }, [a]);
      a.addEventListener('click', (e) => onProfileClick(p, e));
      a.addEventListener('auxclick', (e) => { if (e.button === 1) api.newTab({ profileId: p.id }); });
      a.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
      a.addEventListener('contextmenu', (e) => { e.preventDefault(); openRailMenu(p, e.clientX, e.clientY); });
      rail.append(item);
    });
  }

  function onProfileClick(p, e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey) { api.newTab({ profileId: p.id }); return; }
    const open = tabsOfProfile(p.id);
    if (!open.length) { api.newTab({ profileId: p.id }); return; }
    const at = activeTab();
    if (at && at.profileId === p.id) {
      if (open.length > 1) {
        const i = open.findIndex((t) => t.id === at.id);
        api.tabAction('activate', open[(i + 1) % open.length].id);
      }
      return;
    }
    const recent = mru.find((id) => open.some((t) => t.id === id)) || open[0].id;
    api.tabAction('activate', recent);
  }

  // ------------------------------------------------------------------ thanh công cụ
  function renderToolbar() {
    const t = activeTab();
    const p = profileOf(t);
    $('#btn-back').disabled = !t || !t.canGoBack;
    $('#btn-forward').disabled = !t || !t.canGoForward;
    $('#btn-home').disabled = !t;
    $('#btn-external').disabled = !t;
    const reload = $('#btn-reload');
    reload.disabled = !t || (t.showStart && !t.error);
    const rk = t && t.loading ? 'stop' : 'reload';
    if (reload.dataset.k !== rk) {
      reload.dataset.k = rk;
      reload.innerHTML = ICONS[rk];
      reload.title = rk === 'stop' ? 'Dừng tải trang' : 'Tải lại (F5)';
    }

    const omni = $('#omnibox');
    const address = $('#address');
    omni.classList.toggle('disabled', !t);
    address.disabled = !t;
    const pill = $('#profile-pill');
    pill.hidden = !t;
    if (p) {
      setPc(pill, p.color);
      pill.querySelector('.pill-name').textContent = p.name;
      pill.title = `Hồ sơ: ${p.name}${p.note ? ` (${p.note})` : ''}\nBấm để mở trang bằng hồ sơ khác, sửa hồ sơ…`;
    }
    if (!addressEditing) address.value = displayUrl(t);
    address.placeholder = t ? 'Tìm trên Google hoặc nhập địa chỉ web' : 'Chọn một hồ sơ để mở tab';

    const sec = $('#secure-icon');
    const url = displayUrl(t);
    const sk = url.startsWith('https://') ? 'lock' : (url.startsWith('http://') ? 'warn' : '');
    if (sec.dataset.k !== sk) {
      sec.dataset.k = sk;
      sec.innerHTML = sk ? ICONS[sk] : '';
      sec.classList.toggle('insecure', sk === 'warn');
      sec.title = sk === 'lock' ? 'Kết nối bảo mật (HTTPS)' : (sk === 'warn' ? 'Kết nối không bảo mật' : '');
    }
    sec.hidden = !sk;
    const zoom = t && Math.abs((t.zoom || 1) - 1) > 0.001 ? `${Math.round(t.zoom * 100)}%` : '';
    $('#zoom-indicator').textContent = zoom;

    const star = $('#btn-star');
    const webPage = !!(t && /^https?:/i.test(url) && !t.error);
    star.hidden = !webPage;
    const marked = webPage && TM.findBookmarkByUrl && TM.findBookmarkByUrl(url);
    const stk = marked ? 'starFill' : 'star';
    if (star.dataset.k !== stk) { star.dataset.k = stk; star.innerHTML = ICONS[stk]; }
    star.classList.toggle('on', !!marked);
    star.title = marked ? 'Sửa dấu trang (Ctrl+D)' : 'Thêm vào dấu trang (Ctrl+D)';
    const key = $('#btn-key');
    key.hidden = !(t && S.activePwCount > 0);
    key.title = `Mật khẩu đã lưu cho trang này (${S.activePwCount || 0}) – bấm để điền`;
  }

  // ------------------------------------------------------------------ các panel trong vùng nội dung
  const ERRORS = {
    '-105': 'Không tìm thấy địa chỉ máy chủ. Hãy kiểm tra lại địa chỉ web hoặc kết nối mạng.',
    '-137': 'Không phân giải được tên miền (lỗi DNS).',
    '-106': 'Máy tính đang mất kết nối Internet.',
    '-102': 'Máy chủ từ chối kết nối.',
    '-109': 'Không truy cập được địa chỉ này.',
    '-118': 'Kết nối quá thời gian chờ.',
    '-101': 'Kết nối bị ngắt giữa chừng.',
    '-100': 'Kết nối bị đóng đột ngột.',
    '-21': 'Mạng vừa thay đổi. Hãy thử lại.',
    '-130': 'Không kết nối được qua proxy.',
    '-310': 'Trang chuyển hướng quá nhiều lần.',
    '-324': 'Máy chủ không gửi dữ liệu.',
  };

  function errorText(err) {
    const code = Number(err.code);
    if (ERRORS[String(code)]) return ERRORS[String(code)];
    if (code <= -200 && code > -300) return 'Chứng chỉ bảo mật của trang không hợp lệ, kết nối không an toàn.';
    if (Number.isNaN(code)) return 'Trang đã dừng đột ngột. Bấm "Thử lại" để tải lại.';
    return 'Đã xảy ra lỗi khi tải trang.';
  }

  let startSig = '';
  let emptySig = '';
  function renderPanels() {
    const t = activeTab();
    const start = $('#start-panel');
    const error = $('#error-panel');
    const empty = $('#empty-panel');
    start.hidden = !(t && t.showStart && !t.error);
    error.hidden = !(t && t.error && !t.showStart);
    empty.hidden = !!t;

    if (!start.hidden) {
      const p = profileOf(t);
      const links = [];
      if (p.startUrl) links.push({ title: `Trang khởi động`, url: p.startUrl });
      (S.settings.quickLinks || []).forEach((q) => links.push(q));
      const sig = JSON.stringify([t.id, p.name, p.color, p.note, links]);
      if (sig !== startSig) {
        startSig = sig;
        $('#start-profile').replaceChildren(avatar(p), el('h2', { text: p.name }), el('p', { class: 'muted', text: p.note || (p.temp ? 'Tab ẩn danh – đăng nhập sẽ mất khi đóng tab' : 'Hồ sơ độc lập – đăng nhập được lưu riêng') }));
        const grid = $('#quick-links');
        grid.replaceChildren();
        links.forEach((q) => {
          const host = hostOf(q.url);
          const ic = el('span', { class: 'ql-icon', text: (q.title || host || '?').charAt(0).toUpperCase() });
          if (host) {
            const img = el('img', { src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`, alt: '' });
            img.addEventListener('load', () => { ic.replaceChildren(img); });
          }
          grid.append(el('button', {
            class: 'ql', title: q.url, onclick: () => api.tabAction('navigate', S.activeId, q.url),
          }, [ic, el('span', { class: 'ql-title', text: q.title })]));
        });
        $('#start-input').value = '';
      }
    } else startSig = '';

    if (!error.hidden) {
      $('#error-message').textContent = errorText(t.error);
      $('#error-url').textContent = t.error.url || '';
      $('#error-code').textContent = t.error.desc ? `${t.error.desc}${Number.isNaN(Number(t.error.code)) ? '' : ` (${t.error.code})`}` : '';
      $('#error-external').hidden = !/^https?:/i.test(t.error.url || '');
    }

    if (!empty.hidden) {
      const counts = {};
      S.tabs.forEach((x) => { if (!x.temp) counts[x.profileId] = (counts[x.profileId] || 0) + 1; });
      const sig = JSON.stringify([S.profiles, counts]);
      if (sig !== emptySig) {
        emptySig = sig;
        const grid = $('#empty-grid');
        grid.replaceChildren();
        if (!S.profiles.length) {
          $('#empty-title').textContent = 'Chào mừng đến TabManagerSP';
          $('#empty-sub').textContent = 'Mỗi hồ sơ là một trình duyệt riêng với cookie và đăng nhập tách biệt. Tạo một hồ sơ cho từng tài khoản Muse AI, Gmail, Facebook… rồi mở chúng thành các tab trong cùng một cửa sổ.';
          $('#empty-create').textContent = 'Tạo hồ sơ đầu tiên';
          grid.hidden = true;
        } else {
          $('#empty-title').textContent = 'Chọn hồ sơ để mở';
          $('#empty-sub').textContent = 'Mỗi hồ sơ đăng nhập độc lập. Bấm vào hồ sơ để mở tab.';
          $('#empty-create').textContent = 'Tạo hồ sơ mới';
          grid.hidden = false;
          S.profiles.forEach((p) => {
            const card = el('button', { class: 'pcard', onclick: () => api.newTab({ profileId: p.id }) }, [
              avatar(p), el('b', { text: p.name }), el('span', { text: p.note || (p.startUrl ? hostOf(p.startUrl) : ' ') }),
            ]);
            setPc(card, p.color);
            grid.append(card);
          });
        }
      }
    } else emptySig = '';
  }

  // ------------------------------------------------------------------ tìm trong trang
  function openFind() {
    const t = activeTab();
    if (!t || t.showStart) return;
    const input = $('#find-input');
    $('#findbar').hidden = false;
    if (!t.find) api.tabAction('find', t.id, { text: input.value || '' });
    input.focus();
    input.select();
  }

  function renderFind() {
    const t = activeTab();
    const bar = $('#findbar');
    const input = $('#find-input');
    const show = !!(t && t.find && !t.showStart);
    bar.hidden = !show;
    if (!show) return;
    if (document.activeElement !== input) input.value = t.find.text || '';
    const f = t.find;
    $('#find-count').textContent = f.text ? `${f.matches ? f.active : 0}/${f.matches || 0}` : '';
  }

  // ------------------------------------------------------------------ render tổng
  function render() {
    document.body.classList.toggle('no-sidebar', S.settings.showSidebar === false);
    if (S.activeId !== lastActiveId) {
      lastActiveId = S.activeId;
      if (S.activeId) {
        const i = mru.indexOf(S.activeId);
        if (i >= 0) mru.splice(i, 1);
        mru.unshift(S.activeId);
        if (mru.length > 200) mru.length = 200;
      }
      addressEditing = false;
    }
    renderTabs();
    renderSidebar();
    renderToolbar();
    renderPanels();
    renderFind();
    stateListeners.forEach((fn) => fn());
    renderHooks.forEach((fn) => fn(S));
  }

  function sendBounds() {
    const r = $('#content').getBoundingClientRect();
    api.setBounds({ x: r.left, y: r.top, width: r.width, height: r.height });
  }

  function updateWindowControls() {
    const root = document.documentElement;
    if (api.platform === 'darwin') {
      root.style.setProperty('--wco-left', '78px');
      root.style.setProperty('--wco-right', '8px');
      $('#brand').hidden = true;
      return;
    }
    const wco = navigator.windowControlsOverlay;
    if (wco && wco.visible) {
      const r = wco.getTitlebarAreaRect();
      const right = Math.round(window.innerWidth - (r.x + r.width));
      if (right > 0) root.style.setProperty('--wco-right', `${right + 6}px`);
    }
  }

  // ------------------------------------------------------------------ gắn sự kiện
  function bindUi() {
    $('#brand').innerHTML = LOGO;
    $('#empty-logo').innerHTML = LOGO;
    $('.error-icon').innerHTML = ICONS.cloudOff;
    const iconMap = {
      '#btn-new-tab': 'plus', '#btn-back': 'back', '#btn-forward': 'forward', '#btn-reload': 'reload', '#btn-home': 'home',
      '#btn-external': 'external', '#btn-menu': 'more', '#btn-add-profile': 'userPlus', '#btn-incognito': 'incognito',
      '#btn-manage': 'gear', '#find-prev': 'up', '#find-next': 'down', '#find-close': 'close',
      '#btn-dashboard': 'dashboard', '#btn-star': 'star', '#btn-key': 'key', '#bm-more': 'chevrons',
    };
    for (const [sel, icon] of Object.entries(iconMap)) $(sel).innerHTML = ICONS[icon];

    const act = (a, v) => { const t = activeTab(); if (t) api.tabAction(a, t.id, v); };
    $('#btn-new-tab').addEventListener('click', () => openNewTabMenu());
    $('#btn-back').addEventListener('click', () => act('back'));
    $('#btn-forward').addEventListener('click', () => act('forward'));
    $('#btn-reload').addEventListener('click', (e) => {
      const t = activeTab();
      if (t && t.loading) act('stop');
      else act('reload', e.shiftKey);
    });
    $('#btn-home').addEventListener('click', () => act('home'));
    $('#btn-external').addEventListener('click', () => openExternalMenu());
    $('#btn-menu').addEventListener('click', () => openMainMenu());
    $('#btn-add-profile').addEventListener('click', () => openProfileForm());
    $('#btn-incognito').addEventListener('click', () => api.newTab({ temp: true }));
    $('#btn-manage').addEventListener('click', () => openManager('profiles'));
    $('#profile-pill').addEventListener('click', () => openPillMenu());
    $('#zoom-indicator').addEventListener('click', () => act('zoom', 0));
    $('#empty-create').addEventListener('click', () => openProfileForm());
    $('#empty-incognito').addEventListener('click', () => api.newTab({ temp: true }));
    $('#error-retry').addEventListener('click', () => act('reload'));
    $('#error-external').addEventListener('click', () => { const t = activeTab(); if (t && t.error) api.openExternal(t.error.url); });

    const address = $('#address');
    address.addEventListener('focus', () => setTimeout(() => address.select(), 0));
    address.addEventListener('input', () => { addressEditing = true; });
    address.addEventListener('blur', () => { addressEditing = false; renderToolbar(); });
    address.addEventListener('keydown', (e) => {
      const t = activeTab();
      if (e.key === 'Enter' && t && address.value.trim()) {
        addressEditing = false;
        api.tabAction('navigate', t.id, address.value);
        address.blur();
      } else if (e.key === 'Escape') {
        addressEditing = false;
        address.value = displayUrl(t);
        if (t) api.tabAction('focus', t.id);
        address.blur();
      }
    });

    $('#start-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#start-input').value.trim();
      if (v && S.activeId) api.tabAction('navigate', S.activeId, v);
    });

    const findInput = $('#find-input');
    findInput.addEventListener('input', () => act('find', { text: findInput.value }));
    findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') act('find', { text: findInput.value, forward: !e.shiftKey });
      if (e.key === 'Escape') { act('stopFind'); act('focus'); }
    });
    $('#find-next').addEventListener('click', () => act('find', { text: findInput.value, forward: true }));
    $('#find-prev').addEventListener('click', () => act('find', { text: findInput.value, forward: false }));
    $('#find-close').addEventListener('click', () => { act('stopFind'); act('focus'); });



    new ResizeObserver(sendBounds).observe($('#content'));
    window.addEventListener('resize', () => { sendBounds(); updateWindowControls(); });
    if (navigator.windowControlsOverlay) navigator.windowControlsOverlay.addEventListener('geometrychange', updateWindowControls);

    api.onState((s) => { S = s; render(); });
    api.onCommand((cmd) => {
      if (cmd === 'new-tab-menu') openNewTabMenu();
      if (cmd === 'focus-address') { address.focus(); address.select(); }
      if (cmd === 'find') openFind();
      if (cmd === 'bookmark-page' && TM.bookmarkPage) TM.bookmarkPage();
    });
    api.onDownload((d) => {
      if (d.state === 'progressing') showNotice(`Đang tải ${d.name}${d.percent !== null && d.percent !== undefined ? ` – ${d.percent}%` : '…'}`, null, 0);
      else if (d.state === 'completed') showNotice(`Đã tải xong: ${d.name}`, { label: 'Mở thư mục', fn: () => api.showItem(d.path) }, 12000);
      else if (d.state === 'cancelled') showNotice(`Đã hủy tải: ${d.name}`, null, 4000);
      else showNotice(`Tải thất bại: ${d.name}`, null, 8000);
    });
  }

  async function init() {
    document.body.classList.add(`platform-${api.platform}`);
    bindUi();
    initHooks.forEach((fn) => fn());
    updateWindowControls();
    S = await api.getState();
    render();
    sendBounds();
    api.ready();
    info = await api.appInfo();
  }

  // Không gian tên dùng chung cho các module giao diện khác (bookmarks.js, dashboard.js, passwords-ui.js).
  window.TM = {
    api, $, el, ICONS, PALETTE,
    get S() { return S; },
    get info() { return info; },
    initials, fgFor, setPc, avatar, profileOf, activeTab, tabsOfProfile, hostOf, displayUrl, menuLabel, avatarPng,
    popup, openModal, confirmDialog, showNotice, openManager, openProfileForm, pushOverlay, popOverlay,
    onRender: (fn) => renderHooks.push(fn),
    onInit: (fn) => initHooks.push(fn),
    addManagerSection: (section) => extraSections.push(section),
    rerender: () => render(),
  };

  document.addEventListener('DOMContentLoaded', init);
})();
