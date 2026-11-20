'use strict';
// Giao diện trình quản lý mật khẩu: thanh hỏi "Lưu mật khẩu?", nút chìa khóa trên
// thanh địa chỉ, và mục "Mật khẩu" trong cửa sổ Quản lý.
(() => {
  const TM = window.TM;
  const { api, $, el, ICONS } = TM;
  let barKey = '';
  let filterProfile = '';

  // ------------------------------------------------------------------ thanh hỏi lưu mật khẩu
  function renderBar(S) {
    const bar = $('#pwbar');
    const p = S.pwPrompt;
    const show = !!(p && p.tabId === S.activeId);
    bar.hidden = !show;
    if (!show) { barKey = ''; return; }
    if (barKey === p.id) return;
    barKey = p.id;
    const isUpdate = p.type === 'update';
    const user = el('input', { class: 'input pw-user', type: 'text', value: p.username || '', placeholder: 'Tên đăng nhập', spellcheck: 'false' });
    user.disabled = isUpdate;
    const act = (action) => api.passwords.prompt({ id: p.id, action, username: user.value });
    const ico = el('span', { class: 'pw-icon' });
    ico.innerHTML = ICONS.key;
    bar.replaceChildren(
      ico,
      el('span', { class: 'pw-text' }, [
        isUpdate ? 'Cập nhật mật khẩu mới cho ' : 'Lưu mật khẩu cho ',
        el('b', { text: p.host }),
        isUpdate ? ` (${p.username || 'không tên'})?` : '?',
      ]),
      isUpdate ? null : user,
      el('button', { class: 'btn sm primary', text: isUpdate ? 'Cập nhật' : 'Lưu', onclick: () => act('save') }),
      el('button', { class: 'btn sm', text: isUpdate ? 'Không' : 'Không bao giờ', title: isUpdate ? '' : 'Không hỏi lại cho trang này trong hồ sơ này', onclick: () => act(isUpdate ? 'dismiss' : 'never') }),
      el('button', { class: 'icon-btn small', icon: 'close', title: 'Để sau', onclick: () => act('dismiss') }),
    );
    user.addEventListener('keydown', (e) => { if (e.key === 'Enter') act('save'); });
  }

  // ------------------------------------------------------------------ nút chìa khóa
  async function openKeyMenu() {
    const accounts = await api.passwords.accountsActive();
    const items = accounts.map((u, i) => ({ id: `fill:${i}`, label: TM.menuLabel(u || '(không có tên đăng nhập)') }));
    if (items.length) items.unshift({ label: 'Điền tài khoản đã lưu:', enabled: false });
    items.push({ type: 'separator' }, { id: 'manage', label: 'Quản lý mật khẩu…' });
    const r = await TM.popup(items, $('#btn-key'));
    if (!r) return;
    if (r === 'manage') { TM.openManager('passwords'); return; }
    const ok = await api.passwords.fillActive(accounts[Number(r.slice(5))]);
    if (!ok) TM.showNotice('Không điền được: trang không có ô đăng nhập phù hợp.', null, 5000);
  }

  // ------------------------------------------------------------------ mục "Mật khẩu" trong Quản lý
  const profileName = (id) => {
    const p = TM.S.profiles.find((x) => x.id === id);
    return p ? p.name : '(hồ sơ đã xóa)';
  };

  async function drawManager(body, ctx) {
    const scroll = body.scrollTop;
    const data = await api.passwords.summary();
    body.replaceChildren();
    const profiles = TM.S.profiles;
    if (filterProfile && !profiles.some((p) => p.id === filterProfile)) filterProfile = '';

    const select = el('select', { class: 'input', style: 'width:auto;min-width:200px' });
    select.append(el('option', { value: '', text: 'Tất cả hồ sơ' }));
    profiles.forEach((p) => {
      const o = el('option', { value: p.id, text: p.name });
      if (p.id === filterProfile) o.selected = true;
      select.append(o);
    });
    select.addEventListener('change', () => { filterProfile = select.value; ctx.redraw(); });

    const importBtn = el('button', {
      class: 'btn',
      text: 'Nhập file CSV…',
      title: 'Nhập mật khẩu xuất từ Chrome/Edge/Cốc Cốc vào hồ sơ đang chọn',
      onclick: async () => {
        if (!filterProfile) { TM.showNotice('Hãy chọn một hồ sơ để nhập mật khẩu vào.', null, 5000); select.focus(); return; }
        const r = await api.passwords.importCsv(filterProfile);
        if (!r || r.canceled) return;
        if (r.error) TM.showNotice(r.error, null, 8000);
        else TM.showNotice(`Đã nhập ${r.added} mật khẩu mới, cập nhật ${r.updated}${r.skipped ? `, bỏ qua ${r.skipped} dòng` : ''}.`, null, 8000);
        ctx.redraw();
      },
    });
    body.append(el('div', { class: 'list-toolbar' }, [
      select,
      el('button', { class: 'btn primary', text: '+ Thêm thủ công', onclick: () => addManual(ctx) }),
      importBtn,
      el('span', { class: 'spacer' }),
      el('span', { class: 'muted', text: `${data.items.length} mật khẩu` }),
    ]));

    const items = data.items
      .filter((i) => !filterProfile || i.profileId === filterProfile)
      .sort((a, b) => profileName(a.profileId).localeCompare(profileName(b.profileId)) || a.origin.localeCompare(b.origin));
    if (!items.length) {
      body.append(el('div', { class: 'empty-note', text: 'Chưa có mật khẩu nào. Sau khi đăng nhập trên một trang, ứng dụng sẽ hỏi có lưu mật khẩu không.' }));
    }
    for (const it of items) {
      const p = profiles.find((x) => x.id === it.profileId) || { name: '?', color: '#888' };
      const pwText = el('span', { class: 'pw-mask mono', text: '••••••••' });
      let shown = false;
      const btn = (icon, title, fn) => el('button', { class: 'icon-btn', icon, title, onclick: fn });
      const copy = async (text, what) => {
        await navigator.clipboard.writeText(text);
        TM.showNotice(`Đã sao chép ${what}`, null, 3000);
      };
      body.append(el('div', { class: 'prow pw-row' }, [
        TM.avatar(p, 32),
        el('div', { class: 'prow-main' }, [
          el('b', { text: TM.hostOf(it.origin) }),
          el('span', { text: `${it.username || '(không có tên đăng nhập)'} · ${p.name}` }),
        ]),
        el('div', { class: 'prow-actions' }, [
          pwText,
          btn('eye', 'Hiện / ẩn mật khẩu', async () => {
            if (shown) { pwText.textContent = '••••••••'; shown = false; return; }
            const pw = await api.passwords.reveal(it.id);
            pwText.textContent = pw === null ? '(không giải mã được)' : pw;
            shown = true;
          }),
          btn('copy', 'Sao chép mật khẩu', async () => {
            const pw = await api.passwords.reveal(it.id);
            if (pw === null) TM.showNotice('Không giải mã được mật khẩu này (dữ liệu được tạo trên máy hoặc tài khoản Windows khác).', null, 8000);
            else copy(pw, 'mật khẩu');
          }),
          btn('open', 'Mở trang bằng hồ sơ này', () => api.tabAction('openInProfile', null, { profileId: it.profileId, url: it.origin })),
          btn('trash', 'Xóa', async () => {
            const ok = await TM.confirmDialog({ title: 'Xóa mật khẩu', message: `Xóa mật khẩu của ${it.username || 'tài khoản này'} trên ${TM.hostOf(it.origin)}?`, okText: 'Xóa', danger: true });
            if (ok) { await api.passwords.remove(it.id); ctx.redraw(); }
          }),
        ]),
      ]));
    }

    const never = data.never.filter((n) => !filterProfile || n.profileId === filterProfile);
    if (never.length) {
      body.append(el('h4', { class: 'sub-head', text: 'Không bao giờ lưu cho các trang này' }));
      for (const n of never) {
        body.append(el('div', { class: 'brow' }, [
          el('div', {}, [el('b', { text: TM.hostOf(n.origin) }), el('span', { text: ` · ${profileName(n.profileId)}` })]),
          el('button', { class: 'btn sm', text: 'Bỏ chặn', onclick: async () => { await api.passwords.removeNever(n); ctx.redraw(); } }),
        ]));
      }
    }

    body.append(el('div', { class: 'callout' }, [
      el('b', { text: 'Lấy mật khẩu đã lưu trong Chrome: ' }),
      'mở Chrome đúng profile → gõ chrome://password-manager/settings → "Xuất mật khẩu" (Export passwords) → được file .csv. Chọn hồ sơ tương ứng ở ô bên trên rồi bấm "Nhập file CSV…". Xóa file .csv sau khi nhập vì nó chứa mật khẩu dạng chữ thường.',
    ]));
    body.append(el('div', { class: 'callout' }, [
      el('b', { text: data.encrypted ? 'Mật khẩu được mã hóa ' : 'Cảnh báo: ' }),
      data.encrypted
        ? 'bằng tài khoản Windows của bạn (DPAPI) trong file passwords.json. Chép thư mục dữ liệu sang máy hoặc tài khoản Windows khác thì mật khẩu sẽ không đọc được (hồ sơ và đăng nhập vẫn giữ nguyên); khi đó chỉ cần nhập lại.'
        : 'hệ điều hành này không hỗ trợ mã hóa, mật khẩu chỉ được che bằng base64.',
    ]));
    body.scrollTop = scroll;
  }

  async function addManual(ctx) {
    const profiles = TM.S.profiles;
    if (!profiles.length) { TM.showNotice('Hãy tạo hồ sơ trước.', null, 4000); return; }
    const m = await TM.openModal({ title: 'Thêm mật khẩu' });
    const select = el('select', { class: 'input' });
    profiles.forEach((p) => {
      const o = el('option', { value: p.id, text: p.name });
      if (p.id === (filterProfile || (TM.activeTab() && TM.activeTab().profileId))) o.selected = true;
      select.append(o);
    });
    const url = el('input', { class: 'input', type: 'text', placeholder: 'https://accounts.google.com', spellcheck: 'false' });
    const user = el('input', { class: 'input', type: 'text', placeholder: 'email hoặc tên đăng nhập', spellcheck: 'false' });
    const pass = el('input', { class: 'input', type: 'password', placeholder: 'mật khẩu' });
    m.body.append(
      el('label', { class: 'field' }, [el('span', { text: 'Hồ sơ' }), select]),
      el('label', { class: 'field' }, [el('span', { text: 'Trang web' }), url, el('small', { text: 'Địa chỉ trang đăng nhập, ví dụ https://www.facebook.com' })]),
      el('label', { class: 'field' }, [el('span', { text: 'Tên đăng nhập' }), user]),
      el('label', { class: 'field' }, [el('span', { text: 'Mật khẩu' }), pass]),
    );
    const save = async () => {
      let u = url.value.trim();
      if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
      const r = await api.passwords.add({ profileId: select.value, url: u, username: user.value, password: pass.value });
      if (r && r.error) { TM.showNotice(r.error, null, 6000); return; }
      m.close();
      ctx.redraw();
    };
    m.foot.append(el('button', { class: 'btn', text: 'Hủy', onclick: () => m.close() }), el('button', { class: 'btn primary', text: 'Lưu', onclick: save }));
    url.focus();
  }

  TM.onRender(renderBar);
  TM.addManagerSection({ id: 'passwords', label: 'Mật khẩu', draw: drawManager });
  TM.onInit(() => {
    $('#btn-key').addEventListener('click', () => openKeyMenu());
  });
})();
