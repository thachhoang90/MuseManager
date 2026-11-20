'use strict';
// Chạy trong "isolated world" của mỗi trang web (trang không đọc được biến ở đây).
// Nhiệm vụ: phát hiện đăng nhập để đề nghị lưu mật khẩu, và điền tài khoản đã lưu.
const { ipcRenderer } = require('electron');

(() => {
  const USER_TYPES = new Set(['text', 'email', 'tel', '']);
  const USER_HINT = /user|email|e-mail|login|account|phone|mobile|identifier|mail|tài khoản|tên đăng nhập|số điện thoại/i;
  let info = null;          // { accounts: [{username}], hint, autofill }
  let querying = null;
  let lastSent = '';
  let dropdown = null;
  let autoFilledOnce = false;
  let filledAt = 0;

  const visible = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const st = getComputedStyle(el);
    return st.visibility !== 'hidden' && st.display !== 'none' && st.opacity !== '0';
  };
  const isInput = (el) => el instanceof HTMLInputElement;
  const isPw = (el) => isInput(el) && el.type === 'password';
  const isUserField = (el) => isInput(el)
    && USER_TYPES.has((el.getAttribute('type') || 'text').toLowerCase())
    && !el.readOnly && !el.disabled;
  const looksUser = (el) => {
    const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
    if (/username|email/.test(ac)) return true;
    if (el.type === 'email') return true;
    return USER_HINT.test(`${el.name} ${el.id} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`);
  };

  const passwordFields = () => [...document.querySelectorAll('input[type=password]')].filter(visible);

  function usernameFieldFor(pw) {
    const scope = (pw && pw.form) || document;
    const inputs = [...scope.querySelectorAll('input')];
    const idx = pw ? inputs.indexOf(pw) : -1;
    const before = (idx >= 0 ? inputs.slice(0, idx) : inputs).filter((i) => isUserField(i) && visible(i));
    const preferred = before.filter(looksUser);
    return preferred[preferred.length - 1] || before[before.length - 1] || null;
  }

  // Một số trang (ví dụ Google) giữ tên đăng nhập trong ô ẩn ở bước nhập mật khẩu.
  function hiddenUsername(scope) {
    const el = (scope || document).querySelector('input[autocomplete~="username"], input[name="identifier"], input[type=email]');
    return el && el.value ? el.value.trim() : '';
  }

  const loginUserField = () => [...document.querySelectorAll('input')].find((i) => isUserField(i) && visible(i) && looksUser(i)) || null;

  // ------------------------------------------------------------ ghi nhận đăng nhập
  function capture(pw) {
    if (!pw || !pw.value) return;
    // Bỏ qua form đổi mật khẩu / đăng ký có nhiều ô mật khẩu khác nhau.
    const pws = [...((pw.form || document).querySelectorAll('input[type=password]'))].filter((p) => p.value);
    if (new Set(pws.map((p) => p.value)).size > 1) return;
    const uf = usernameFieldFor(pw);
    let username = uf && uf.value ? uf.value.trim() : '';
    if (!username) username = hiddenUsername(pw.form);
    const key = `${username}\u0000${pw.value}`;
    if (key === lastSent) return;
    lastSent = key;
    ipcRenderer.send('pm:submit', { username, password: pw.value });
  }

  function captureFromPage() {
    const pws = passwordFields().filter((p) => p.value);
    if (pws.length) capture(pws[pws.length - 1]);
  }

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (!f || !f.querySelectorAll) return;
    const pw = [...f.querySelectorAll('input[type=password]')].find((p) => p.value);
    if (pw) capture(pw);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideDropdown();
    if (e.key !== 'Enter' || !isInput(e.target)) return;
    if (isPw(e.target)) capture(e.target);
    else captureFromPage();
  }, true);

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.closest && t.closest('button, input[type=submit], input[type=button], [role=button], a')) captureFromPage();
  }, true);

  // Đăng nhập nhiều bước: nhớ tên đăng nhập vừa nhập ở bước 1.
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (isUserField(t) && looksUser(t) && t.value.trim().length >= 3 && !passwordFields().length) {
      ipcRenderer.send('pm:username', { username: t.value.trim() });
    }
  }, true);

  // ------------------------------------------------------------ điền tài khoản
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  function setValue(el, v) {
    el.focus();
    nativeSetter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fill({ username, password }) {
    hideDropdown();
    filledAt = Date.now();
    const pw = passwordFields()[0] || null;
    const uf = pw ? usernameFieldFor(pw) : loginUserField();
    if (uf && username && uf.value !== username) setValue(uf, username);
    if (pw && password) {
      setValue(pw, password);
      lastSent = `${username || ''}\u0000${password}`;
    }
    return !!(uf || pw);
  }

  ipcRenderer.on('pm:fill', (e, c) => fill(c || {}));

  async function query(force = false) {
    if (info && !force) return info;
    if (!querying) {
      querying = ipcRenderer.invoke('pm:query').then((r) => { info = r; querying = null; return r; }, () => { querying = null; return null; });
    }
    return querying;
  }

  async function fillAccount(username) {
    const password = await ipcRenderer.invoke('pm:get', { username });
    if (password !== null && password !== undefined) fill({ username, password });
  }

  // ------------------------------------------------------------ danh sách gợi ý
  function hideDropdown() {
    if (dropdown) {
      dropdown.host.remove();
      dropdown = null;
    }
  }

  function showDropdown(field) {
    hideDropdown();
    if (!info || !info.accounts || !info.accounts.length) return;
    const r = field.getBoundingClientRect();
    const host = document.createElement('div');
    host.style.cssText = `position:absolute;z-index:2147483647;left:${Math.round(r.left + window.scrollX)}px;top:${Math.round(r.bottom + window.scrollY + 4)}px;`;
    const root = host.attachShadow({ mode: 'closed' });
    const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const style = document.createElement('style');
    style.textContent = `
      .box{min-width:${Math.max(240, Math.round(r.width))}px;max-width:420px;background:${dark ? '#2b2d31' : '#fff'};color:${dark ? '#e8e8ea' : '#1f2328'};
        border:1px solid ${dark ? '#3b3e44' : '#d5dae2'};border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.22);padding:6px;
        font:13px/1.35 "Segoe UI",system-ui,sans-serif;}
      .head{font-size:11px;color:${dark ? '#a1a5ad' : '#5f6672'};padding:4px 8px 6px;display:flex;align-items:center;gap:6px}
      button{all:unset;display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;padding:8px 10px;border-radius:7px;cursor:pointer}
      button:hover,button:focus{background:${dark ? 'rgba(255,255,255,.08)' : 'rgba(31,35,40,.07)'}}
      .u{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .k{width:22px;height:22px;border-radius:50%;background:#2f6fed;color:#fff;display:grid;place-items:center;font-size:12px;flex:none}`;
    const box = document.createElement('div');
    box.className = 'box';
    const head = document.createElement('div');
    head.className = 'head';
    head.textContent = 'TabManagerSP · Tài khoản đã lưu';
    box.append(head);
    for (const a of info.accounts.slice(0, 8)) {
      const b = document.createElement('button');
      const k = document.createElement('span');
      k.className = 'k';
      k.textContent = '🔑';
      const u = document.createElement('span');
      u.className = 'u';
      u.textContent = a.username || '(không có tên đăng nhập)';
      b.append(k, u);
      b.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        fillAccount(a.username);
      });
      box.append(b);
    }
    root.append(style, box);
    document.documentElement.append(host);
    dropdown = { host, field };
  }

  document.addEventListener('focusin', async (e) => {
    const t = e.target;
    if (!isInput(t)) return;
    const relevant = isPw(t) || (isUserField(t) && looksUser(t));
    if (!relevant) { hideDropdown(); return; }
    if (Date.now() - filledAt < 800) return;
    const r = await query();
    if (!r || !r.accounts.length || document.activeElement !== t) return;
    if (t.value && !isPw(t)) return;
    if (Date.now() - filledAt < 800) return;
    showDropdown(t);
  }, true);

  document.addEventListener('focusout', () => setTimeout(() => {
    if (dropdown && document.activeElement !== dropdown.field) hideDropdown();
  }, 150), true);
  window.addEventListener('scroll', () => hideDropdown(), true);
  window.addEventListener('resize', () => hideDropdown());

  // ------------------------------------------------------------ tự điền khi chỉ có 1 tài khoản
  async function tryAutofill() {
    if (autoFilledOnce) return;
    const pw = passwordFields()[0];
    if (!pw || pw.value) return;
    const r = await query();
    if (!r || !r.autofill || !r.accounts.length) return;
    // Đăng nhập nhiều bước: ưu tiên tài khoản vừa nhập ở bước trước; nếu không thì chỉ tự điền khi có đúng 1 tài khoản.
    const pick = r.hint && r.accounts.some((a) => a.username === r.hint) ? r.hint : (r.accounts.length === 1 ? r.accounts[0].username : null);
    if (pick === null) return;
    autoFilledOnce = true;
    await fillAccount(pick);
  }

  let scanTimer = null;
  const started = Date.now();
  const observer = new MutationObserver(() => {
    if (Date.now() - started > 30000) { observer.disconnect(); return; }
    clearTimeout(scanTimer);
    scanTimer = setTimeout(tryAutofill, 300);
  });
  window.addEventListener('DOMContentLoaded', () => {
    tryAutofill();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
})();
