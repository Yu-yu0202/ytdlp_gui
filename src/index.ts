import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function CreateWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
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