const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Linux AppImages are commonly launched from filesystems where the Electron
// SUID sandbox helper cannot retain the required root:root 4755 permissions.
// Disable the Chromium SUID sandbox only for the packaged Linux build so the
// AppImage/.deb can start without requiring a manual chmod/chown step.
// The BrowserWindow still uses contextIsolation and no Node.js integration.
if (process.platform === 'linux' && app.isPackaged) {
  app.commandLine.appendSwitch('no-sandbox');
}

let mainWindow;

function createEditMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', accelerator: 'CommandOrControl+Z' },
        { role: 'redo', accelerator: 'CommandOrControl+Shift+Z' },
        { type: 'separator' },
        { role: 'cut', accelerator: 'CommandOrControl+X' },
        { role: 'copy', accelerator: 'CommandOrControl+C' },
        { role: 'paste', accelerator: 'CommandOrControl+V' },
        { role: 'selectAll', accelerator: 'CommandOrControl+A' }
      ]
    }
  ]));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#10141b',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Provide the normal Linux right-click editing menu in text fields.
  mainWindow.webContents.on('context-menu', (event, params) => {
    if (!params.isEditable && !params.selectionText) return;

    const menu = Menu.buildFromTemplate([
      { role: 'undo', enabled: params.isEditable },
      { role: 'redo', enabled: params.isEditable },
      { type: 'separator' },
      { role: 'cut', enabled: params.isEditable },
      { role: 'copy', enabled: Boolean(params.selectionText) },
      { role: 'paste', enabled: params.isEditable },
      { role: 'selectAll', enabled: params.isEditable }
    ]);

    menu.popup({ window: mainWindow });
  });
}

app.whenReady().then(() => {
  createEditMenu();
  createMainWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('export-pdf', async (event, htmlContent, defaultName = 'flight-test-report.pdf') => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, { title: 'Save Flight Test Report PDF', defaultPath: defaultName, filters: [{ name: 'PDF Files', extensions: ['pdf'] }] });
  if (canceled || !filePath) return { canceled: true };
  const printWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
    const pdfBuffer = await printWindow.webContents.printToPDF({ printBackground: true, marginsType: 1, pageSize: 'A4' });
    await fs.writeFile(filePath, pdfBuffer);
    return { canceled: false, filePath };
  } finally { printWindow.close(); }
});

ipcMain.handle('save-markdown', async (event, markdown, defaultName = 'flight-test-report.md') => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, { title: 'Save Flight Test Report Markdown', defaultPath: defaultName, filters: [{ name: 'Markdown Files', extensions: ['md'] }] });
  if (canceled || !filePath) return { canceled: true };
  await fs.writeFile(filePath, markdown, 'utf8');
  return { canceled: false, filePath };
});

ipcMain.handle('save-json', async (event, data, defaultName = 'flight-test-report.json') => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, { title: 'Save Flight Test Report JSON', defaultPath: defaultName, filters: [{ name: 'JSON Files', extensions: ['json'] }] });
  if (canceled || !filePath) return { canceled: true };
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return { canceled: false, filePath };
});

ipcMain.handle('open-json', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const result = await dialog.showOpenDialog(win, { title: 'Open Drone Flight Test Report', properties: ['openFile'], filters: [{ name: 'Flight Test Reports', extensions: ['json'] }] });
  if (result.canceled || !result.filePaths.length) return { canceled: true };
  try {
    const content = await fs.readFile(result.filePaths[0], 'utf8');
    return { canceled: false, filePath: result.filePaths[0], data: JSON.parse(content) };
  } catch (error) {
    return { canceled: false, error: `Could not open report: ${error.message}` };
  }
});

ipcMain.handle('select-files', async (event, options = {}) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const result = await dialog.showOpenDialog(win, { title: options.title || 'Select Files', properties: options.multi ? ['openFile', 'multiSelections'] : ['openFile'], filters: options.filters || [] });
  if (result.canceled) return { canceled: true, filePaths: [] };
  return { canceled: false, filePaths: result.filePaths };
});
