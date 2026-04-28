const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set up the local standalone user directory
const userDir = path.join(app.getPath('home'), 'CareerOps');
if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
if (!fs.existsSync(path.join(userDir, 'data'))) fs.mkdirSync(path.join(userDir, 'data'), { recursive: true });
if (!fs.existsSync(path.join(userDir, '.env'))) fs.writeFileSync(path.join(userDir, '.env'), '');

process.env.CAREER_OPS_ROOT = userDir;

let mainWindow;
let serverProcess;
let uiProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    titleBarStyle: 'hiddenInset', // Makes it look premium on Mac
    backgroundColor: '#09090b' // Zinc 950
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In dev, load Vite UI from localhost
    mainWindow.loadURL('http://localhost:5173');
    // Start Vite UI server
    uiProcess = spawn('npm', ['run', 'dev'], { 
      cwd: path.join(__dirname, 'web-ui'), 
      shell: true, 
      stdio: 'inherit' 
    });
  } else {
    // In production, load the static Vite build
    mainWindow.loadFile(path.join(__dirname, 'web-ui', 'dist', 'index.html'));
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Always start the Node.js backend using Electron's bundled Node binary
  serverProcess = spawn(process.execPath, ['server.mjs'], { 
    cwd: __dirname,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit' 
  });
  
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (serverProcess) serverProcess.kill();
  if (uiProcess) uiProcess.kill();
});
