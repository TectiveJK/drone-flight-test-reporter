const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  exportPDF: (html, name, data) => ipcRenderer.invoke('export-pdf', html, name, data),
  saveMarkdown: (markdown, name) => ipcRenderer.invoke('save-markdown', markdown, name),
  saveJSON: (data, name) => ipcRenderer.invoke('save-json', data, name),
  openJSON: () => ipcRenderer.invoke('open-json'),
  selectFiles: (options) => ipcRenderer.invoke('select-files', options)
});
