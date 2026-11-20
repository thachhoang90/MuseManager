'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,

  getState: () => ipcRenderer.invoke('state:get'),
  appInfo: () => ipcRenderer.invoke('app:info'),
  onState: (cb) => ipcRenderer.on('state', (e, s) => cb(s)),
  onCommand: (cb) => ipcRenderer.on('ui:command', (e, cmd, arg) => cb(cmd, arg)),
  onDownload: (cb) => ipcRenderer.on('download', (e, info) => cb(info)),

  ready: () => ipcRenderer.send('ui:ready'),
  setBounds: (b) => ipcRenderer.send('ui:bounds', b),
  overlay: (open) => ipcRenderer.invoke('ui:overlay', open),
  popupMenu: (template, x, y) => ipcRenderer.invoke('ui:popup-menu', { template, x, y }),

  newTab: (opts) => ipcRenderer.send('tab:new', opts),
  tabAction: (action, id, value) => ipcRenderer.send('tab:action', { action, id, value }),

  createProfile: (data) => ipcRenderer.invoke('profile:create', data),
  updateProfile: (id, patch) => ipcRenderer.invoke('profile:update', id, patch),
  moveProfile: (id, delta) => ipcRenderer.invoke('profile:move', id, delta),
  clearProfile: (id) => ipcRenderer.invoke('profile:clear', id),
  deleteProfile: (id) => ipcRenderer.invoke('profile:delete', id),

  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),

  detectBrowsers: () => ipcRenderer.invoke('browsers:detect'),
  launchBrowser: (args) => ipcRenderer.invoke('browsers:launch', args),

  openDataDir: () => ipcRenderer.send('app:open-data-dir'),
  openExternal: (url) => ipcRenderer.send('app:open-external', url),
  showItem: (p) => ipcRenderer.send('app:show-item', p),
});
