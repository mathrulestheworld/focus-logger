import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Technical fix to make file paths work with "type": "module"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 450,   // Mobile-like width
    height: 750,  // Tall height
    title: "Focus Logger",
    autoHideMenuBar: true, // Hides the "File Edit View" menu at the top
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the built app
  win.loadFile(path.join(__dirname, 'dist/index.html'));
}

// When Electron is ready, create the window
app.whenReady().then(createWindow);

// Quit when all windows are closed (standard Windows/Linux behavior)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});