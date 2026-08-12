const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  exportPDF: (html) => ipcRenderer.invoke('export-pdf', html),
  saveMarkdown: (markdown) => ipcRenderer.invoke('save-markdown', markdown),
  saveFlightData: (data) => ipcRenderer.invoke('save-flight-data', data),
  selectAttachments: () => ipcRenderer.invoke('select-attachments'),
  selectFile: (filters) => ipcRenderer.invoke('select-file', filters)
});
