const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple local apps
    },
    // Hide the default menu bar for a cleaner app look
    autoHideMenuBar: true,
  });

  // Check if we are in development or production
  // In production (exe), we load the built index.html
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    // In dev, we can try to load localhost or the file
    // Fallback to loading dist/index.html if dev server isn't running
    win.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(() => {
        console.log('Ensure you ran "npm run build" first!');
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});