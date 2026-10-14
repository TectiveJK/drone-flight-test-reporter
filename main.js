const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const fsSync = require('fs');

function sharedTestDayDir() {
  const dir = path.join(os.homedir(), 'DroneTestDay');
  fsSync.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileExt(p = '') {
  const m = String(p).match(/\.[^./\\]+$/);
  return m ? m[0] : '';
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n >>> 0, 0);
  return b;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

function dosDateTime(date = new Date()) {
  return {
    dosTime: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    dosDate: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function buildZip(files) {
  const now = dosDateTime();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name.replace(/\\/g, '/'), 'utf8');
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    const crc = crc32(data);
    const local = Buffer.concat([
      Buffer.from('PK\x03\x04'), u16(20), u16(0), u16(0),
      u16(now.dosTime), u16(now.dosDate), u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), name, data
    ]);
    const central = Buffer.concat([
      Buffer.from('PK\x01\x02'), u16(20), u16(20), u16(0), u16(0),
      u16(now.dosTime), u16(now.dosDate), u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const central = Buffer.concat(centrals);
  const eocd = Buffer.concat([
    Buffer.from('PK\x05\x06'), u16(0), u16(0),
    u16(files.length), u16(files.length), u32(central.length), u32(offset), u16(0)
  ]);
  return Buffer.concat([...locals, central, eocd]);
}

function evidenceJobs(report = {}) {
  const jobs = [];
  for (const flight of report.flights || []) {
    const n = pad2(flight.flightNumber || flight.number || 1);
    if (flight.flightLogPath) jobs.push({ src: flight.flightLogPath, name: `evidence/flight-${n}-log${fileExt(flight.flightLogPath)}` });
    if (flight.captureFilePath) jobs.push({ src: flight.captureFilePath, name: `evidence/flight-${n}-capture${fileExt(flight.captureFilePath)}` });
    (flight.attachments || []).forEach((src, i) => {
      if (src) jobs.push({ src, name: `evidence/flight-${n}-attachment-${i + 1}${fileExt(src)}` });
    });
  }
  return jobs;
}

async function gatherEvidence(report = {}) {
  const files = [];
  const missing = [];
  for (const job of evidenceJobs(report)) {
    try {
      files.push({ name: job.name, data: await fs.readFile(job.src) });
    } catch {
      missing.push(job.src);
    }
  }
  return { files, missing };
}

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

ipcMain.handle('export-pdf', async (event, htmlContent, defaultName = 'flight-test-report.zip', report = {}) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const hasEvidence = evidenceJobs(report).length > 0;
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: hasEvidence ? 'Save Flight Test Report Package' : 'Save Flight Test Report PDF',
    defaultPath: path.join(sharedTestDayDir(), hasEvidence ? defaultName.replace(/\.pdf$/i, '.zip') : defaultName.replace(/\.zip$/i, '.pdf')),
    filters: hasEvidence
      ? [{ name: 'Report package (ZIP)', extensions: ['zip'] }, { name: 'PDF only', extensions: ['pdf'] }]
      : [{ name: 'PDF Files', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return { canceled: true };
  const printWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
    const pdfBuffer = await printWindow.webContents.printToPDF({ printBackground: true, marginsType: 1, pageSize: 'A4' });
    const { files, missing } = await gatherEvidence(report);
    if (filePath.toLowerCase().endsWith('.zip')) {
      const readme = Buffer.from(
        'Drone Flight Test Report package\n\n' +
        'flight-test-report.pdf — the written report\n' +
        'evidence/ — original flight logs, captures, and other attachments\n\n' +
        'Open the PDF for the report. Open files in evidence/ to inspect the actual logs.\n'
      );
      await fs.writeFile(filePath, buildZip([
        { name: 'flight-test-report.pdf', data: pdfBuffer },
        { name: 'README.txt', data: readme },
        ...files
      ]));
    } else {
      await fs.writeFile(filePath, pdfBuffer);
      if (files.length) {
        const dir = filePath.replace(/\.pdf$/i, '-attachments');
        await fs.mkdir(dir, { recursive: true });
        for (const file of files) await fs.writeFile(path.join(dir, path.basename(file.name)), file.data);
      }
    }
    return { canceled: false, filePath, attachmentCount: files.length, missing };
  } finally { printWindow.close(); }
});

ipcMain.handle('save-markdown', async (event, markdown, defaultName = 'flight-test-report.md') => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, { title: 'Save Flight Test Report Markdown', defaultPath: path.join(sharedTestDayDir(), defaultName), filters: [{ name: 'Markdown Files', extensions: ['md'] }] });
  if (canceled || !filePath) return { canceled: true };
  await fs.writeFile(filePath, markdown, 'utf8');
  return { canceled: false, filePath };
});

ipcMain.handle('save-json', async (event, data, defaultName = 'flight-test-report.json') => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, { title: 'Save Flight Test Report JSON', defaultPath: path.join(sharedTestDayDir(), defaultName), filters: [{ name: 'JSON Files', extensions: ['json'] }] });
  if (canceled || !filePath) return { canceled: true };
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return { canceled: false, filePath };
});

ipcMain.handle('open-json', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const result = await dialog.showOpenDialog(win, { title: 'Open Drone Flight Test Report', defaultPath: sharedTestDayDir(), properties: ['openFile'], filters: [{ name: 'Flight Test Reports', extensions: ['json'] }] });
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
