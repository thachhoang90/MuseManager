'use strict';
// Menu chuột phải trong trang web và menu "native" do giao diện yêu cầu
// (menu native luôn nổi trên WebContentsView nên không bị trang web che).
const { Menu, clipboard, shell, nativeImage } = require('electron');

function iconFrom(dataUrl1x, dataUrl2x) {
  if (!dataUrl1x) return undefined;
  try {
    const img = nativeImage.createFromDataURL(dataUrl1x);
    if (dataUrl2x) img.addRepresentation({ scaleFactor: 2, dataURL: dataUrl2x });
    return img;
  } catch {
    return undefined;
  }
}

// Dựng menu từ template JSON gửi từ renderer; trả về id mục được chọn (hoặc null).
function popupTemplate(win, template, x, y) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const build = (items) => items.map((it) => {
      if (it.type === 'separator') return { type: 'separator' };
      const item = {
        label: it.label,
        enabled: it.enabled !== false,
        type: it.type === 'checkbox' || it.type === 'radio' ? it.type : 'normal',
        checked: !!it.checked,
        icon: iconFrom(it.icon, it.icon2x),
        sublabel: it.sublabel,
      };
      if (it.accelerator) {
        item.accelerator = it.accelerator;
        item.registerAccelerator = false;
      }
      if (it.submenu) item.submenu = build(it.submenu);
      else item.click = () => finish(it.id);
      return item;
    });
    const menu = Menu.buildFromTemplate(build(template));
    menu.popup({
      window: win,
      x: Math.round(x),
      y: Math.round(y),
      callback: () => setTimeout(() => finish(null), 120),
    });
  });
}

function pageContextMenu({ manager, tab, wc, params, store, ownerWindow }) {
  const win = ownerWindow || manager.win;
  const items = [];
  const sep = () => { if (items.length && items[items.length - 1].type !== 'separator') items.push({ type: 'separator' }); };
  const otherProfiles = store.profiles.filter((p) => p.id !== tab.profileId);

  if (params.linkURL) {
    const link = params.linkURL;
    items.push(
      { label: 'Mở liên kết trong tab mới', click: () => manager.createTab({ profileId: tab.profileId, temp: tab.temp, partition: tab.partition, tempLabel: tab.tempLabel, url: link, afterId: tab.id, background: true }) },
    );
    if (otherProfiles.length) {
      items.push({
        label: 'Mở liên kết bằng hồ sơ khác',
        submenu: otherProfiles.map((p) => ({ label: p.name, click: () => manager.createTab({ profileId: p.id, url: link }) })),
      });
    }
    items.push(
      { label: 'Mở liên kết trong tab ẩn danh', click: () => manager.createTab({ temp: true, url: link }) },
      { label: 'Mở liên kết bằng trình duyệt mặc định', click: () => shell.openExternal(link) },
      { label: 'Sao chép địa chỉ liên kết', click: () => clipboard.writeText(link) },
    );
  }

  if (params.mediaType === 'image' && params.srcURL) {
    sep();
    items.push(
      { label: 'Mở hình ảnh trong tab mới', click: () => manager.createTab({ profileId: tab.profileId, temp: tab.temp, partition: tab.partition, tempLabel: tab.tempLabel, url: params.srcURL, afterId: tab.id }) },
      { label: 'Lưu hình ảnh...', click: () => wc.downloadURL(params.srcURL) },
      { label: 'Sao chép hình ảnh', click: () => wc.copyImageAt(params.x, params.y) },
      { label: 'Sao chép địa chỉ hình ảnh', click: () => clipboard.writeText(params.srcURL) },
    );
  }

  if (params.isEditable) {
    sep();
    const f = params.editFlags;
    items.push(
      { label: 'Hoàn tác', role: 'undo', enabled: f.canUndo },
      { label: 'Làm lại', role: 'redo', enabled: f.canRedo },
      { type: 'separator' },
      { label: 'Cắt', role: 'cut', enabled: f.canCut },
      { label: 'Sao chép', role: 'copy', enabled: f.canCopy },
      { label: 'Dán', role: 'paste', enabled: f.canPaste },
      { label: 'Dán dạng văn bản thuần', role: 'pasteAndMatchStyle', enabled: f.canPaste },
      { label: 'Chọn tất cả', role: 'selectAll' },
    );
  } else if (params.selectionText && params.selectionText.trim()) {
    sep();
    const text = params.selectionText.trim();
    const short = text.length > 24 ? `${text.slice(0, 24)}…` : text;
    items.push(
      { label: 'Sao chép', role: 'copy' },
      { label: `Tìm "${short}" trên Google`, click: () => manager.createTab({ profileId: tab.profileId, temp: tab.temp, partition: tab.partition, tempLabel: tab.tempLabel, url: `https://www.google.com/search?q=${encodeURIComponent(text)}`, afterId: tab.id }) },
    );
  }

  if (!params.linkURL && !params.isEditable && !params.selectionText) {
    sep();
    items.push(
      { label: 'Quay lại', enabled: wc.navigationHistory.canGoBack(), click: () => wc.navigationHistory.goBack() },
      { label: 'Tiến tới', enabled: wc.navigationHistory.canGoForward(), click: () => wc.navigationHistory.goForward() },
      { label: 'Tải lại', click: () => wc.reload() },
      { type: 'separator' },
      { label: 'Sao chép địa chỉ trang', click: () => clipboard.writeText(wc.getURL()) },
      { label: 'Mở trang bằng trình duyệt mặc định', click: () => shell.openExternal(wc.getURL()) },
    );
  }

  sep();
  items.push({ label: 'Kiểm tra (Inspect)', click: () => wc.inspectElement(params.x, params.y) });
  Menu.buildFromTemplate(items).popup({ window: win });
}

module.exports = { popupTemplate, pageContextMenu };
