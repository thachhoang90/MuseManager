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

  bookmarks: {
    add: (data) => ipcRenderer.invoke('bm:add', data),
    update: (id, patch) => ipcRenderer.invoke('bm:update', id, patch),
    remove: (id) => ipcRenderer.invoke('bm:remove', id),
    move: (id, index) => ipcRenderer.invoke('bm:move', id, index),
    importFrom: (args) => ipcRenderer.invoke('bm:import', args),
  },

  passwords: {
    prompt: (args) => ipcRenderer.invoke('pm:prompt', args),
    fillActive: (username) => ipcRenderer.invoke('pm:fill-active', { username }),
    accountsActive: () => ipcRenderer.invoke('pm:accounts-active'),
    summary: () => ipcRenderer.invoke('pm:summary'),
    reveal: (id) => ipcRenderer.invoke('pm:reveal', id),
    remove: (id) => ipcRenderer.invoke('pm:remove', id),
    removeNever: (args) => ipcRenderer.invoke('pm:remove-never', args),
    add: (args) => ipcRenderer.invoke('pm:add', args),
    importCsv: (profileId) => ipcRenderer.invoke('pm:import-csv', { profileId }),
  },

  openDataDir: () => ipcRenderer.send('app:open-data-dir'),
  openExternal: (url) => ipcRenderer.send('app:open-external', url),
  showItem: (p) => ipcRenderer.send('app:show-item', p),
});
