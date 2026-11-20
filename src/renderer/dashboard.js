'use strict';
// Dashboard tài khoản: mỗi hồ sơ là một sơ đồ mindmap (gốc = hồ sơ, nhánh = trang + tài khoản).
// Người dùng tự sửa chữ và link của từng nhánh; bấm nhánh để mở đúng trang bằng đúng hồ sơ.
(() => {
  const TM = window.TM;
  const { api, $, el } = TM;

  const POPULAR = [
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'Google', url: 'https://mail.google.com' },
    { name: 'TikTok', url: 'https://www.tiktok.com' },
    { name: 'Muse', url: 'https://muse.ai' },
    { name: 'Gemini', url: 'https://gemini.google.com' },
    { name: 'Facebook', url: 'https://www.facebook.com' },
    { name: 'Claude', url: 'https://claude.ai' },
    { name: 'Flow', url: 'https://labs.google/fx/tools/flow' },
  ];
  const EXTRA_PICKS = [
    { name: 'ChatGPT', url: 'https://chatgpt.com' },
    { name: 'Google Drive', url: 'https://drive.google.com' },
    { name: 'Canva', url: 'https://www.canva.com' },
    { name: 'Zalo', url: 'https://chat.zalo.me' },
    { name: 'Instagram', url: 'https://www.instagram.com' },
  ];
  const BRANCH_COLORS = ['#e091ea', '#e6cf45', '#9b8ee8', '#8fcd5e', '#e8837c', '#f0a674', '#7aa6e8', '#4fc3c3', '#f28cb1', '#a7b0bd'];

  const ROOT_X = 24;
  const ROOT_W = 210;
  const ROOT_H = 58;
  const ROW_H = 46;
  const PAD = 22;
  const NODE_X = ROOT_X + ROOT_W + 150;

  let open = false;
  let openedActive = null;
  let sig = '';
  let query = '';

  const rid = () => Math.random().toString(36).slice(2, 10);

  function defaultNodes(p) {
    return POPULAR.map((s) => ({ id: rid(), text: `${s.name}: ${p.note || ''}`.trim(), url: s.url }));
  }

  function nodesOf(p) {
    return Array.isArray(p.nodes) ? p.nodes : defaultNodes(p);
  }

  async function saveNodes(p, nodes) {
    await api.updateProfile(p.id, { nodes });
  }

  // ------------------------------------------------------------------ mở / đóng
  async function show() {
    if (open) return;
    open = true;
    openedActive = TM.S.activeId;
    sig = '';
    $('#dashboard').hidden = false;
    $('#btn-dashboard').classList.add('on');
    await TM.pushOverlay();
    render(TM.S, true);
    const search = $('#dashboard .dash-search');
    if (search) search.focus();
  }

  function hide() {
    if (!open) return;
    open = false;
    $('#dashboard').hidden = true;
    $('#btn-dashboard').classList.remove('on');
    TM.popOverlay();
  }

  function openLink(p, url) {
    hide();
    api.tabAction('openInProfile', null, { profileId: p.id, url });
  }

  function openProfile(p) {
    hide();
    const list = TM.tabsOfProfile(p.id);
    if (list.length) api.tabAction('activate', list[0].id);
    else api.newTab({ profileId: p.id });
  }

  // ------------------------------------------------------------------ sửa nhánh
  async function editNode(p, node, index) {
    const isNew = !node;
    const m = await TM.openModal({ title: isNew ? `Thêm nhánh cho “${p.name}”` : 'Sửa nhánh' });
    const text = el('input', { class: 'input', type: 'text', value: node ? node.text : `: ${p.note || ''}`, maxlength: '160', placeholder: 'Ví dụ: Gemini: email@gmail.com' });
    const url = el('input', { class: 'input', type: 'text', value: node ? node.url : '', placeholder: 'https://…', spellcheck: 'false' });
    const picks = el('div', { class: 'chips' });
    [...POPULAR, ...EXTRA_PICKS].forEach((s) => {
      picks.append(el('button', {
        class: 'chip',
        type: 'button',
        text: s.name,
        title: s.url,
        onclick: () => {
          const v = text.value;
          const i = v.indexOf(':');
          const account = i >= 0 ? v.slice(i + 1).trim() : v.trim();
          text.value = `${s.name}: ${account}`;
          url.value = s.url;
          text.focus();
        },
      }));
    });
    m.body.append(
      el('div', { class: 'field' }, [el('span', { text: 'Chọn nhanh trang phổ biến' }), picks]),
      el('label', { class: 'field' }, [el('span', { text: 'Chữ hiển thị trên nhánh' }), text, el('small', { text: 'Dạng “Tên trang: tài khoản”. Phần trước dấu hai chấm được tô màu theo nhánh.' })]),
      el('label', { class: 'field' }, [el('span', { text: 'Link khi bấm vào nhánh' }), url, el('small', { text: `Trang sẽ được mở bằng hồ sơ “${p.name}”.` })]),
    );
    const save = async () => {
      let u = url.value.trim();
      if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
      const nodes = nodesOf(p).map((n) => ({ ...n }));
      const item = { id: node ? node.id : rid(), text: text.value.trim() || 'Nhánh mới', url: u };
      if (isNew) nodes.push(item);
      else nodes[index] = item;
      await saveNodes(p, nodes);
      m.close();
    };
    [text, url].forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); }));
    if (!isNew) {
      m.foot.append(el('button', { class: 'btn danger', text: 'Xóa nhánh', onclick: async () => { await removeNode(p, index); m.close(); } }), el('span', { class: 'spacer' }));
    }
    m.foot.append(el('button', { class: 'btn', text: 'Hủy', onclick: () => m.close() }), el('button', { class: 'btn primary', text: 'Lưu', onclick: save }));
    text.focus();
    if (isNew) text.setSelectionRange(0, 0);
  }

  async function removeNode(p, index) {
    const nodes = nodesOf(p).map((n) => ({ ...n }));
    nodes.splice(index, 1);
    await saveNodes(p, nodes);
  }

  async function moveNode(p, index, delta) {
    const nodes = nodesOf(p).map((n) => ({ ...n }));
    const j = index + delta;
    if (j < 0 || j >= nodes.length) return;
    [nodes[index], nodes[j]] = [nodes[j], nodes[index]];
    await saveNodes(p, nodes);
  }

  // ------------------------------------------------------------------ vẽ sơ đồ
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  function nodeLabel(text) {
    const i = text.indexOf(':');
    const label = i > 0 ? text.slice(0, i + 1) : '';
    const value = i > 0 ? text.slice(i + 1).trim() : text.trim();
    const wrap = el('span', { class: 'mm-text' });
    if (label) wrap.append(el('span', { class: 'mm-label', text: `${label} ` }));
    if (value) wrap.append(el('span', { class: `mm-value${value.includes('@') ? ' email' : ''}`, text: value }));
    else wrap.append(el('span', { class: 'mm-value empty', text: '(chưa nhập tài khoản)' }));
    return wrap;
  }

  function card(p) {
    const nodes = nodesOf(p);
    const rows = Math.max(nodes.length, 1);
    const height = PAD * 2 + rows * ROW_H;
    const cy = height / 2;
    const box = el('div', { class: 'mm-card', style: `height:${height}px` });
    TM.setPc(box, p.color);

    const svg = svgEl('svg', { class: 'mm-lines', width: NODE_X + 4, height, viewBox: `0 0 ${NODE_X + 4} ${height}` });
    const x0 = ROOT_X + ROOT_W;
    nodes.forEach((n, i) => {
      const y1 = PAD + i * ROW_H + ROW_H / 2;
      const x1 = NODE_X - 6;
      const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
      svg.append(
        svgEl('path', { d: `M ${x0} ${cy} C ${x0 + 85} ${cy}, ${x1 - 85} ${y1}, ${x1 - 12} ${y1}`, stroke: color, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', opacity: '0.85' }),
        svgEl('polygon', { points: `${x1 - 16},${y1 - 8} ${x1 + 2},${y1} ${x1 - 16},${y1 + 8}`, fill: color, opacity: '0.85' }),
      );
    });
    box.append(svg);

    const root = el('div', { class: 'mm-root', style: `left:${ROOT_X}px;top:${cy - ROOT_H / 2}px;width:${ROOT_W}px;height:${ROOT_H}px`, title: `Bấm để mở hồ sơ “${p.name}”` }, [
      TM.avatar(p, 34),
      el('div', { class: 'mm-root-text' }, [el('b', { text: p.name }), el('span', { text: p.note || `${TM.tabsOfProfile(p.id).length} tab đang mở` })]),
    ]);
    root.addEventListener('click', () => openProfile(p));
    box.append(root);

    nodes.forEach((n, i) => {
      const y = PAD + i * ROW_H + ROW_H / 2;
      const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
      const btn = (icon, title, fn) => el('button', {
        class: 'mm-act', icon, title, onclick: (e) => { e.stopPropagation(); fn(); },
      });
      const node = el('div', {
        class: `mm-node${n.url ? ' link' : ''}`,
        style: `left:${NODE_X}px;top:${y - 17}px`,
        title: n.url ? `Mở ${n.url} bằng hồ sơ “${p.name}”` : 'Chưa có link – bấm để sửa',
      }, [
        nodeLabel(n.text),
        el('span', { class: 'mm-actions' }, [
          btn('edit', 'Sửa chữ và link', () => editNode(p, n, i)),
          btn('up', 'Lên', () => moveNode(p, i, -1)),
          btn('down', 'Xuống', () => moveNode(p, i, 1)),
          btn('trash', 'Xóa nhánh', () => removeNode(p, i)),
        ]),
      ]);
      node.style.setProperty('--bc', color);
      node.addEventListener('click', () => { if (n.url) openLink(p, n.url); else editNode(p, n, i); });
      node.addEventListener('dblclick', (e) => { e.preventDefault(); editNode(p, n, i); });
      box.append(node);
    });

    if (!nodes.length) {
      box.append(el('div', { class: 'mm-node empty-node', style: `left:${NODE_X}px;top:${cy - 17}px` }, [el('span', { class: 'mm-value empty', text: 'Chưa có nhánh nào' })]));
    }

    box.append(el('div', { class: 'mm-tools' }, [
      el('button', { class: 'btn sm', text: '+ Thêm nhánh', onclick: () => editNode(p, null, -1) }),
      el('button', { class: 'btn sm', text: 'Mở tab', onclick: () => openProfile(p) }),
      el('button', {
        class: 'btn sm',
        text: 'Khôi phục mẫu',
        title: 'Đặt lại các nhánh trang phổ biến (YouTube, Google, TikTok, Muse, Gemini, Facebook, Claude, Flow)',
        onclick: async () => {
          const ok = await TM.confirmDialog({ title: 'Khôi phục nhánh mẫu', message: `Thay toàn bộ nhánh của “${p.name}” bằng các trang phổ biến? Chữ và link bạn đã sửa sẽ mất.`, okText: 'Khôi phục' });
          if (ok) saveNodes(p, defaultNodes(p));
        },
      }),
    ]));
    return box;
  }

  function matches(p) {
    if (!query) return true;
    const q = query.toLowerCase();
    return [p.name, p.note, ...nodesOf(p).map((n) => `${n.text} ${n.url}`)].some((s) => String(s || '').toLowerCase().includes(q));
  }

  function build() {
    const S = TM.S;
    const root = $('#dashboard');
    let search = root.querySelector('.dash-search');
    const hadFocus = search && document.activeElement === search;
    if (!root.firstChild) {
      search = el('input', { class: 'input dash-search', type: 'search', placeholder: 'Tìm hồ sơ, trang hoặc tài khoản…', spellcheck: 'false' });
      search.addEventListener('input', () => { query = search.value.trim(); sig = ''; render(TM.S, true); });
      root.append(
        el('div', { class: 'dash-head' }, [
          el('div', { class: 'dash-title' }, [
            el('h2', { text: 'Dashboard tài khoản' }),
            el('p', { class: 'muted', text: 'Bấm vào nhánh để mở trang bằng đúng hồ sơ. Di chuột vào nhánh để sửa chữ, link hoặc xóa. Nội dung trên sơ đồ do bạn tự ghi chú.' }),
          ]),
          search,
          el('button', { class: 'icon-btn', icon: 'close', title: 'Đóng dashboard (Esc)', onclick: () => hide() }),
        ]),
        el('div', { class: 'mm-grid' }),
      );
    }
    const grid = root.querySelector('.mm-grid');
    const scroll = root.scrollTop;
    grid.replaceChildren();
    const list = S.profiles.filter(matches);
    if (!S.profiles.length) {
      grid.append(el('div', { class: 'empty-note', text: 'Chưa có hồ sơ nào. Tạo hồ sơ trước, rồi quay lại đây để ghi chú tài khoản cho từng trang.' }));
    } else if (!list.length) {
      grid.append(el('div', { class: 'empty-note', text: 'Không tìm thấy hồ sơ phù hợp.' }));
    }
    list.forEach((p) => grid.append(card(p)));
    root.scrollTop = scroll;
    if (hadFocus) search.focus();
  }

  function render(S, force = false) {
    if (!open) return;
    if (S.activeId !== openedActive) { hide(); return; }
    const next = JSON.stringify([S.profiles.map((p) => [p.id, p.name, p.note, p.color, p.nodes]), query]);
    if (!force && next === sig) return;
    sig = next;
    build();
  }

  TM.onRender((S) => render(S));
  TM.onInit(() => {
    $('#btn-dashboard').addEventListener('click', () => (open ? hide() : show()));
    $('#tabs').addEventListener('pointerdown', () => hide());
    $('#profile-rail').addEventListener('click', () => hide());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open && !document.querySelector('.modal-backdrop')) { e.preventDefault(); hide(); }
    });
  });
  TM.openDashboard = show;
})();
