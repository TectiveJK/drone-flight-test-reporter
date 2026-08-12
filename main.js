const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.removeMenu();
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('export-pdf', async (event, htmlContent) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Flight Test Report PDF',
    defaultPath: 'flight-test-report.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
  const pdfBuffer = await printWindow.webContents.printToPDF({
    printBackground: true,
    marginsType: 1,
    pageSize: 'A4'
  });
  await fs.writeFile(filePath, pdfBuffer);
  printWindow.close();

  return { canceled: false, filePath };
});

ipcMain.handle('select-attachments', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Select Attachments',
    properties: ['openFile', 'multiSelections']
  });

  if (canceled) {
    return { canceled: true };
  }

  return { canceled: false, filePaths };
});

ipcMain.handle('select-file', async (event, options) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: options.title || 'Select File',
    properties: ['openFile'],
    filters: options.filters || []
  });

  if (canceled || !filePaths.length) {
    return { canceled: true };
  }

  return { canceled: false, filePath: filePaths[0] };
});

ipcMain.handle('save-markdown', async (event, markdown) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Flight Test Report Markdown',
    defaultPath: 'flight-test-report.md',
    filters: [{ name: 'Markdown Files', extensions: ['md'] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await fs.writeFile(filePath, markdown);
  return { canceled: false, filePath };
});

ipcMain.handle('save-flight-data', async (event, data) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Flight Data JSON',
    defaultPath: 'flight-test-data.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return { canceled: false, filePath };
});
