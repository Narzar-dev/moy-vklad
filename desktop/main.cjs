const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function openApp() {
  const window = new BrowserWindow({
    title: 'Мой опыт',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    width: 1180,
    height: 820,
    minWidth: 760,
    minHeight: 600,
    backgroundColor: '#F4F7F6',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  openApp();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) openApp(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
