import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

function CreateWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true
    },
  });

  win.loadFile('index.html');
}

app.on('ready', CreateWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    CreateWindow();
  }
});

ipcMain.on('ytdlp-stdout-renderer', (_event, data) => {
  BrowserWindow.getAllWindows()[0].webContents.send('ytdlp-stdout-renderer', data);
});

ipcMain.on('ytdlp-stderr-renderer', (_event, data) => {
  BrowserWindow.getAllWindows()[0].webContents.send('ytdlp-stderr-renderer', data);
});