'use strict';
// Thanh dấu trang: hiển thị dưới thanh địa chỉ, dùng chung cho mọi hồ sơ
// (bấm dấu trang sẽ mở bằng hồ sơ của tab đang xem).
(() => {
  const TM = window.TM;
  const { api, $, el, ICONS } = TM;
  let barSig = '';
  let drag = null;

  // ------------------------------------------------------------------ tiện ích cây dấu trang
  function walk(list, fn, depth = 0, parent = null) {
    for (const b of list || []) {
      fn(b, depth, parent);
      if (b.type === 'folder') walk(b.children, fn, depth + 1, b);
    }
  }

  const normUrl = (u) => String(u || '').replace(/#.*$/, '').replace(/\/+$/, '');

  function findByUrl(url) {
    let found = null;
    const n = normUrl(url);
    walk(TM.S.bookmarks, (b) => { if (!found && b.type === 'url' && normUrl(b.url) === n) found = b; });
    return found;
  }

  function findById(id) {
    let found = null;
    walk(TM.S.bookmarks, (b, depth, parent) => { if (b.id === id) found = { item: b, parent }; });
    return found;
  }

  function countUrls(list) {
    let n = 0;
    walk(list, (b) => { if (b.type === 'url') n += 1; });
    return n;
  }

  function faviconFor(b) {
    if (b.favicon) return b.favicon;
    const h = TM.hostOf(b.url);
    return h ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=32` : '';
  }

  function iconEl(b) {
    const span = el('span', { class: 'bm-icon' });
    if (b.type === 'folder') {
      span.innerHTML = ICONS.folder;
      return span;
    }
    span.innerHTML = ICONS.globe;
    const src = faviconFor(b);
    if (src) {
      const img = el('img', { src, alt: '' });
      img.addEventListener('load', () => span.replaceChildren(img));
    }
    return span;
  }

  const short = (s, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  // ------------------------------------------------------------------ mở dấu trang
  async function openUrl(url, mode = 'current', anchor = null) {
    const t = TM.activeTab();
    if (t) {
      if (mode === 'current' && !t.error) { api.tabAction('navigate', t.id, url); return; }
      if (mode === 'current') { api.tabAction('navigate', t.id, url); return; }
      if (t.temp) api.newTab({ temp: true, url, background: mode === 'background' });
      else api.newTab({ profileId: t.profileId, url, background: mode === 'background' });
      return;
    }
    // Chưa có tab nào: hỏi mở bằng hồ sơ nào.
    const S = TM.S;
    if (!S.profiles.length) { api.newTab({ temp: true, url }); return; }
    const items = S.profiles.map((p) => ({ id: p.id, label: TM.menuLabel(p.name), ...TM.avatarPng(p) }));
    items.push({ type: 'separator' }, { id: '__temp', label: 'Tab ẩn danh' });
    const r = anchor ? await TM.popup(items, anchor) : null;
    if (r === '__temp') api.newTab({ temp: true, url });
    else if (r) api.newTab({ profileId: r, url });
  }

  function openAll(folder) {
    const urls = [];
    walk(folder.children, (b) => { if (b.type === 'url') urls.push(b.url); });
    urls.slice(0, 20).forEach((u, i) => openUrl(u, i === 0 ? 'new' : 'background'));
  }

  function folderMenuItems(list) {
    if (!list.length) return [{ label: '(Trống)', enabled: false }];
    return list.map((b) => {
      if (b.type === 'folder') {
        const sub = folderMenuItems(b.children || []);
        if (countUrls(b.children)) sub.push({ type: 'separator' }, { id: `all:${b.id}`, label: `Mở tất cả (${Math.min(20, countUrls(b.children))})` });
        return { label: TM.menuLabel(short(b.title)), submenu: sub };
      }
      return { id: `u:${b.id}`, label: TM.menuLabel(short(b.title || b.url)) };
    });
  }

  async function handleMenuResult(r, anchor) {
    if (!r) return;
    const f = findById(r.slice(r.indexOf(':') + 1));
    if (!f) return;
    if (r.startsWith('u:')) openUrl(f.item.url, 'current', anchor);
    if (r.startsWith('all:')) openAll(f.item);
  }

  async function openFolderMenu(folder, anchor) {
    const items = folderMenuItems(folder.children || []);
    if (countUrls(folder.children)) items.push({ type: 'separator' }, { id: `all:${folder.id}`, label: `Mở tất cả (${Math.min(20, countUrls(folder.children))})` });
    handleMenuResult(await TM.popup(items, anchor), anchor);
  }

  // ------------------------------------------------------------------ thêm / sửa
  function folderOptions(excludeId) {
    const opts = [{ id: '', label: 'Thanh dấu trang' }];
    walk(TM.S.bookmarks, (b, depth) => {
      if (b.type !== 'folder') return;
      if (excludeId && (b.id === excludeId)) return;
      opts.push({ id: b.id, label: `${'— '.repeat(depth + 1)}${b.title}` });
    });
    if (excludeId) {
      // Không cho chuyển thư mục vào chính các thư mục con của nó.
      const f = findById(excludeId);
      const banned = new Set();
      if (f) walk(f.item.children, (b) => banned.add(b.id));
      return opts.filter((o) => !banned.has(o.id));
    }
    return opts;
  }

  async function editBookmark(b, isNew = false) {
    const m = await TM.openModal({ title: isNew ? 'Đã thêm dấu trang' : (b.type === 'folder' ? 'Sửa thư mục' : 'Sửa dấu trang') });
    const title = el('input', { class: 'input', type: 'text', value: b.title || '', maxlength: '200' });
    const url = b.type === 'url' ? el('input', { class: 'input', type: 'text', value: b.url, spellcheck: 'false' }) : null;
    const parent = findById(b.id);
    const select = el('select', { class: 'input' });
    folderOptions(b.type === 'folder' ? b.id : null).forEach((o) => {
      const opt = el('option', { value: o.id, text: o.label });
      if ((parent && parent.parent ? parent.parent.id : '') === o.id) opt.selected = true;
      select.append(opt);
    });
    m.body.append(
      el('label', { class: 'field' }, [el('span', { text: 'Tên' }), title]),
      url ? el('label', { class: 'field' }, [el('span', { text: 'Địa chỉ' }), url]) : null,
      el('label', { class: 'field' }, [el('span', { text: 'Thư mục' }), select]),
    );
    const save = async () => {
      const patch = { title: title.value.trim(), parentId: select.value || null };
      if (url) {
        let u = url.value.trim();
        if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
        patch.url = u;
      }
      await api.bookmarks.update(b.id, patch);
      m.close();
    };
    [title, url].filter(Boolean).forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); }));
    m.foot.append(
      el('button', {
        class: 'btn danger',
        text: 'Xóa',
        onclick: async () => {
          if (b.type === 'folder' && countUrls(b.children)) {
            m.close();
            const ok = await TM.confirmDialog({ title: 'Xóa thư mục', message: `Xóa thư mục “${b.title}” cùng ${countUrls(b.children)} dấu trang bên trong?`, okText: 'Xóa', danger: true });
            if (ok) api.bookmarks.remove(b.id);
            return;
          }
          await api.bookmarks.remove(b.id);
          m.close();
        },
      }),
      el('span', { class: 'spacer' }),
      el('button', { class: 'btn', text: 'Hủy', onclick: () => m.close() }),
      el('button', { class: 'btn primary', text: isNew ? 'Xong' : 'Lưu', onclick: save }),
    );
    title.focus();
    title.select();
  }

  async function bookmarkPage() {
    const t = TM.activeTab();
    const url = TM.displayUrl(t);
    if (!t || !/^https?:/i.test(url)) return;
    const existing = findByUrl(url);
    if (existing) { editBookmark(existing); return; }
    const b = await api.bookmarks.add({ title: t.title || TM.hostOf(url), url, favicon: t.favicon || '' });
    if (b) editBookmark(b, true);
  }

  async function addFolder(parentId = null) {
    const m = await TM.openModal({ title: 'Thư mục mới' });
    const name = el('input', { class: 'input', type: 'text', value: 'Thư mục mới', maxlength: '120' });
    const save = async () => {
      await api.bookmarks.add({ type: 'folder', title: name.value.trim() || 'Thư mục mới', parentId });
      m.close();
    };
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
    m.body.append(el('label', { class: 'field' }, [el('span', { text: 'Tên thư mục' }), name]));
    m.foot.append(el('button', { class: 'btn', text: 'Hủy', onclick: () => m.close() }), el('button', { class: 'btn primary', text: 'Tạo', onclick: save }));
    name.focus();
    name.select();
  }

  async function importSubmenu() {
    const browsers = await api.detectBrowsers();
    if (!browsers.length) return [{ label: 'Không tìm thấy trình duyệt nào', enabled: false }];
    return browsers.map((b) => ({
      label: b.name,
      submenu: b.profiles.length
        ? b.profiles.map((p) => ({ id: `imp|${b.id}|${p.dir}`, label: `${TM.menuLabel(p.name)}${p.email ? `  (${TM.menuLabel(p.email)})` : ''}` }))
        : [{ label: '(Không có profile)', enabled: false }],
    }));
  }

  async function runImport(r) {
    const [, browserId, ...rest] = r.split('|');
    const res = await api.bookmarks.importFrom({ browserId, profileDir: rest.join('|') });
    if (res && res.error) TM.showNotice(res.error, null, 7000);
    else TM.showNotice(`Đã nhập ${res.count} dấu trang`, null, 5000);
  }

  async function barMenu(x, y, target = null) {
    const t = TM.activeTab();
    const url = TM.displayUrl(t);
    const items = [];
    if (target && target.type === 'url') {
      items.push(
        { id: 'open', label: 'Mở' },
        { id: 'newtab', label: 'Mở trong tab mới' },
      );
      const profiles = TM.S.profiles;
      if (profiles.length) {
        items.push({ label: 'Mở bằng hồ sơ', submenu: profiles.map((p) => ({ id: `prof|${p.id}`, label: TM.menuLabel(p.name), ...TM.avatarPng(p) })) });
      }
      items.push({ id: 'temp', label: 'Mở trong tab ẩn danh' }, { type: 'separator' }, { id: 'edit', label: 'Sửa…' }, { id: 'delete', label: 'Xóa' }, { type: 'separator' });
    } else if (target && target.type === 'folder') {
      items.push(
        { id: 'openall', label: `Mở tất cả (${Math.min(20, countUrls(target.children))})`, enabled: countUrls(target.children) > 0 },
        { id: 'edit', label: 'Đổi tên / di chuyển…' },
        { id: 'subfolder', label: 'Thêm thư mục con…' },
        { id: 'delete', label: 'Xóa thư mục' },
        { type: 'separator' },
      );
    }
    items.push(
      { id: 'addpage', label: 'Thêm trang đang xem', enabled: /^https?:/i.test(url), accelerator: 'CmdOrCtrl+D' },
      { id: 'addfolder', label: 'Thêm thư mục…' },
      { label: 'Nhập dấu trang từ trình duyệt', submenu: await importSubmenu() },
      { id: 'manage', label: 'Quản lý dấu trang…' },
      { type: 'separator' },
      { id: 'hide', label: 'Ẩn thanh dấu trang', accelerator: 'CmdOrCtrl+Shift+B' },
    );
    const r = await TM.popup(items, null, { x, y });
    if (!r) return;
    if (r.startsWith('imp|')) { runImport(r); return; }
    if (r.startsWith('prof|')) { api.newTab({ profileId: r.slice(5), url: target.url }); return; }
    switch (r) {
      case 'open': openUrl(target.url, 'current'); break;
      case 'newtab': openUrl(target.url, 'new'); break;
      case 'temp': api.newTab({ temp: true, url: target.url }); break;
      case 'edit': editBookmark(target); break;
      case 'delete':
        if (target.type === 'folder' && countUrls(target.children)) {
          const ok = await TM.confirmDialog({ title: 'Xóa thư mục', message: `Xóa thư mục “${target.title}” cùng ${countUrls(target.children)} dấu trang bên trong?`, okText: 'Xóa', danger: true });
          if (!ok) return;
        }
        api.bookmarks.remove(target.id);
        break;
      case 'openall': openAll(target); break;
      case 'subfolder': addFolder(target.id); break;
      case 'addpage': bookmarkPage(); break;
      case 'addfolder': addFolder(); break;
      case 'manage': TM.openManager('bookmarks'); break;
      case 'hide': api.updateSettings({ showBookmarks: false }); break;
      default: break;
    }
  }

  // ------------------------------------------------------------------ vẽ thanh dấu trang
  function itemEl(b) {
    const node = el('button', {
      class: `bm${b.type === 'folder' ? ' folder' : ''}`,
      title: b.type === 'url' ? `${b.title}\n${b.url}` : `${b.title} (${countUrls(b.children)} dấu trang)`,
      'data-id': b.id,
    }, [iconEl(b), el('span', { class: 'bm-title', text: b.title || b.url })]);
    node.addEventListener('click', (e) => {
      if (node.dataset.dragged) return;
      if (b.type === 'folder') { openFolderMenu(b, node); return; }
      const mode = e.ctrlKey || e.metaKey ? 'background' : (e.shiftKey ? 'new' : 'current');
      openUrl(b.url, mode, node);
    });
    node.addEventListener('auxclick', (e) => { if (e.button === 1 && b.type === 'url') { e.preventDefault(); openUrl(b.url, 'background', node); } });
    node.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
    node.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); barMenu(e.clientX, e.clientY, b); });
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = { id: b.id, node, startX: e.clientX, moved: false };
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
    const end = (e, cancelled) => {
      if (!drag || drag.node !== node) return;
      const d = drag;
      drag = null;
      node.classList.remove('dragging');
      node.style.transform = '';
      if (!d.moved || cancelled) return;
      node.dataset.dragged = '1';
      setTimeout(() => { delete node.dataset.dragged; }, 0);
      const others = [...$('#bm-items').querySelectorAll('.bm')].filter((x) => x !== node && !x.hidden);
      let idx = 0;
      for (const o of others) {
        const r = o.getBoundingClientRect();
        if (e.clientX > r.left + r.width / 2) idx += 1;
      }
      api.bookmarks.move(b.id, idx);
    };
    node.addEventListener('pointerup', (e) => end(e, false));
    node.addEventListener('pointercancel', (e) => end(e, true));
    return node;
  }

  function layoutOverflow() {
    const box = $('#bm-items');
    const more = $('#bm-more');
    const items = [...box.querySelectorAll('.bm')];
    items.forEach((i) => { i.hidden = false; });
    if (!items.length) { more.hidden = true; return; }
    more.hidden = false;
    const maxRight = box.getBoundingClientRect().right;
    let overflow = false;
    for (const i of items) {
      if (!overflow && i.getBoundingClientRect().right > maxRight + 0.5) overflow = true;
      if (overflow) i.hidden = true;
    }
    more.hidden = !overflow;
  }

  function build() {
    const box = $('#bm-items');
    box.replaceChildren();
    const list = TM.S.bookmarks || [];
    if (!list.length) {
      box.append(el('span', { class: 'bm-empty', text: 'Bấm ☆ trên thanh địa chỉ (Ctrl+D) để thêm trang vào đây. Chuột phải để nhập dấu trang từ Chrome, Edge, Cốc Cốc…' }));
    }
    list.forEach((b) => box.append(itemEl(b)));
    layoutOverflow();
  }

  function render(S) {
    const bar = $('#bookmarkbar');
    const show = S.settings.showBookmarks !== false;
    bar.hidden = !show;
    if (!show) { barSig = ''; return; }
    const sig = JSON.stringify(S.bookmarks || []);
    if (sig !== barSig && !drag) {
      barSig = sig;
      build();
    }
  }

  // ------------------------------------------------------------------ mục "Dấu trang" trong cửa sổ Quản lý
  function drawManager(body) {
    const scroll = body.scrollTop;
    body.replaceChildren();
    body.append(el('div', { class: 'list-toolbar' }, [
      el('button', { class: 'btn primary', text: '+ Thêm thư mục', onclick: () => addFolder() }),
      el('button', {
        class: 'btn',
        text: 'Nhập từ trình duyệt…',
        onclick: async (e) => {
          const r = await TM.popup(await importSubmenu(), e.currentTarget);
          if (r && r.startsWith('imp|')) runImport(r);
        },
      }),
      el('span', { class: 'spacer' }),
      el('span', { class: 'muted', text: `${countUrls(TM.S.bookmarks)} dấu trang` }),
    ]));
    const list = TM.S.bookmarks || [];
    if (!list.length) {
      body.append(el('div', { class: 'empty-note', text: 'Chưa có dấu trang. Bấm ☆ trên thanh địa chỉ để thêm trang đang xem.' }));
      return;
    }
    walk(list, (b, depth, parent) => {
      const siblings = parent ? parent.children : list;
      const i = siblings.indexOf(b);
      const btn = (icon, title, fn, disabled) => el('button', { class: 'icon-btn', icon, title, onclick: fn, disabled });
      body.append(el('div', { class: 'prow bm-row', style: `padding-left:${10 + depth * 22}px` }, [
        iconEl(b),
        el('div', { class: 'prow-main' }, [el('b', { text: b.title || b.url }), el('span', { text: b.type === 'url' ? b.url : `${countUrls(b.children)} dấu trang` })]),
        el('div', { class: 'prow-actions' }, [
          b.type === 'url' ? el('button', { class: 'btn sm', text: 'Mở', onclick: () => openUrl(b.url, 'new') }) : null,
          btn('edit', 'Sửa', () => editBookmark(b)),
          btn('up', 'Lên', () => api.bookmarks.move(b.id, i - 1), i === 0),
          btn('down', 'Xuống', () => api.bookmarks.move(b.id, i + 1), i === siblings.length - 1),
          btn('trash', 'Xóa', async () => {
            if (b.type === 'folder' && countUrls(b.children)) {
              const ok = await TM.confirmDialog({ title: 'Xóa thư mục', message: `Xóa thư mục “${b.title}” cùng ${countUrls(b.children)} dấu trang bên trong?`, okText: 'Xóa', danger: true });
              if (!ok) return;
            }
            api.bookmarks.remove(b.id);
          }),
        ]),
      ]));
    });
    body.scrollTop = scroll;
  }

  TM.findBookmarkByUrl = findByUrl;
  TM.bookmarkPage = bookmarkPage;
  TM.onRender(render);
  TM.addManagerSection({ id: 'bookmarks', label: 'Dấu trang', draw: drawManager, sig: () => JSON.stringify(TM.S.bookmarks || []) });
  TM.onInit(() => {
    $('#btn-star').addEventListener('click', () => bookmarkPage());
    $('#bm-more').addEventListener('click', async () => {
      const hidden = [...$('#bm-items').querySelectorAll('.bm')].filter((n) => n.hidden).map((n) => n.dataset.id);
      const list = (TM.S.bookmarks || []).filter((b) => hidden.includes(b.id));
      handleMenuResult(await TM.popup(folderMenuItems(list), $('#bm-more')), $('#bm-more'));
    });
    $('#bookmarkbar').addEventListener('contextmenu', (e) => { e.preventDefault(); barMenu(e.clientX, e.clientY, null); });
    new ResizeObserver(() => layoutOverflow()).observe($('#bm-items'));
  });
})();
