import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { release, cpus } from 'os'
import { join } from 'path'
import * as fs from 'fs';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { autoUpdater } from "electron-updater";
autoUpdater.checkForUpdatesAndNotify()

const appDataPath = app.getPath('appData');
import Database from '../../src/scripts/database'
const db = Database.GetInstance(appDataPath);

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here you can add more preload scripts
const splash = join(__dirname, '../preload/splash.js')
// 🚧 Use ['ENV_NAME'] to avoid vite:define plugin
const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
const workerUrl = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}/workerRenderer.html`
async function createWindow() {
  win = new BrowserWindow({
    show: false,
    title: 'Main window',
    webPreferences: {
      preload: splash,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (app.isPackaged || process.env['IS_TEST']) {
    console.log(join(__dirname, '../../index.html'));
    win.loadFile(join(__dirname, '../../index.html'))
  } else {
    win.loadURL(url)
    win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.maximize();
    win?.show();
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.on('close', () => {
    //fuck osx
    //tried browserWindow.foreach.close but causes a stack overflow
    app.quit();
  })
}
app.whenReady().then(() => installExtension(REACT_DEVELOPER_TOOLS.id)).then(initDB).then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

function initDB() {
  const gameStmt = db.prepare(`CREATE TABLE IF NOT EXISTS games (
      name NOT NULL,
      path Primary Key)`).run();
  const conversionStmt = db.prepare(`CREATE TABLE IF NOT EXISTS conversions (
      id Primary Key,
      playerIndex,
      opponentIndex
      ,startFrame
      ,endFrame
      ,startPercent
      ,currentPercent
      ,endPercent
      ,didKill
      ,openingType
      ,attackingPlayer
      ,defendingPlayer
      ,attackingCharacter
      ,defendingCharacter
      ,stage
      ,percent
      ,time
      ,filepath
      ,moveCount
      ,startAt
      ,zeroToDeath
      ,moveString
      ,damagePerFrame
      ,date
      ,FOREIGN KEY (filepath) REFERENCES games(path)
  )`).run();
  const movesStmt = db.prepare(`CREATE TABLE IF NOT EXISTS moves (
      conversionMoveId INTEGER Primary Key,
      conversionId,
      moveId,
      frame,
      hitCount,
      damage,
      moveIndex,
      inverseMoveIndex
      ,FOREIGN KEY (conversionId) REFERENCES conversions(id)
  )`).run();
  const settingsStmt = db.prepare(`CREATE TABLE IF NOT EXISTS settings (
    key Primary Key,
    value
  )`).run();
  const playlistStmt = db.prepare(`CREATE TABLE IF NOT EXISTS playlists (
    name Primary Key
  )`).run();
  const playlistConversionStmt = db.prepare(`CREATE TABLE IF NOT EXISTS playlistConversion (
    playlistName,
    conversionId,
    playlistPosition,
    PRIMARY KEY (playlistName, conversionId),
    FOREIGN KEY (playlistName) REFERENCES playlists(name),
    FOREIGN KEY (conversionId) REFERENCES conversions(id)
  )`).run();
  const errorGameStmt = db.prepare(`CREATE TABLE IF NOT EXISTS errorGame (
    name NOT NULL,
    Path Primary Key,
    reason
  )`).run();
  db.prepare('CREATE INDEX IF NOT EXISTS search_index_2 ON conversions (attackingPlayer, attackingCharacter, defendingPlayer, defendingCharacter, stage, percent, moveCount, didKill)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS count_index ON conversions (id)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS attacking_index ON conversions (attackingPlayer)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS defending_index ON conversions (defendingPlayer)').run();
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle('startDatabaseLoad', async () => {
  return await createDataWorkers();
});

var dataLoadInProgress = false;
var maxGamesToLoad = 0;
var gamesLoaded = 0;
async function createDataWorkers() {
  if (dataLoadInProgress) {
    return { max: maxGamesToLoad, gamesLoaded: gamesLoaded };
  }
  dataLoadInProgress = true;
  maxGamesToLoad = 0;
  gamesLoaded = 0;

  const settingsStmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const replayPath = settingsStmt.get('replayPath').value;
  const localFiles = await getReplayFiles(replayPath);

  const dbFiles = db.prepare('SELECT name FROM games').all().map((x: { name: string; }) => x.name);
  const errorFiles = db.prepare('SELECT name FROM errorGame').all().map((x: { name: string; }) => x.name);
  const alreadyLoadedFiles = dbFiles.concat(errorFiles);
  const files = localFiles.filter((file) => !alreadyLoadedFiles.includes(file.name));
  maxGamesToLoad = files.length;
  //just picking a random number
  let windowCount = maxGamesToLoad < 10 ? 1 : (cpus().length || 1);
  if (maxGamesToLoad > 0) {
    let fileIndexStart = 0;
    const range = Math.ceil(maxGamesToLoad / windowCount);
    const finalRange = range + ((maxGamesToLoad + 1) % windowCount);
    for (let i = 0; i < windowCount; i++) {
      let fileRange = i + 1 === windowCount ? finalRange : range
      createInvisWindow(fileIndexStart, fileRange, files);
      fileIndexStart += fileRange;
    }
  }
  return { max: maxGamesToLoad, gamesLoaded: gamesLoaded };
}

ipcMain.handle('gameLoad', (event, args) => {
  gamesLoaded++
  win!.webContents.send('gameLoad', { gamesLoaded: gamesLoaded });
})

ipcMain.handle('finish', (event, args) => {
  let worker = BrowserWindow.getAllWindows().find(x => x.webContents.id == event.sender.id);
  //sometimes this throws an error but the window closes anyways...
  worker?.close()
  let openWindowCount = BrowserWindow.getAllWindows().length;
  dataLoadInProgress = openWindowCount === 1;
})

const createInvisWindow = (start: number, range: number, files: { path: string; name: string; }[]) => {
  let invisWindow = new BrowserWindow({
    show: !app.isPackaged,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  if (app.isPackaged) {
    invisWindow.loadFile(join(__dirname, '../../workerRenderer.html'))
  } else {
    invisWindow.loadURL(workerUrl)
    //react dev tools does not appreciate other windows having dev tools open
    //invisWindow.webContents.openDevTools()
  }
  invisWindow.webContents.once('did-finish-load', () => {
    invisWindow.webContents.send('startLoad', { start: start, range: range, files: files, appDataPath: appDataPath })
  })
}

//get all files in all subdirectories
async function getFiles(path = "./") {
  const entries = fs.readdirSync(path, {
    withFileTypes: true
  });
  // Get files within the current directory and add a path key to the file objects
  const files = entries
    .filter(file => !file.isDirectory())
    .map(file => ({
      ...file,
      path: path + file.name
    }));

  // Get folders within the current directory
  const folders = entries.filter(folder => folder.isDirectory());

  for (const folder of folders)
    /*
      Add the found files within the subdirectory to the files array by calling the
      current function itself
    */
    files.push(...await getFiles(`${path}${folder.name}/`));

  return files;
}

async function getReplayFiles(path: string | undefined) {
  let files = await getFiles(path);
  //ends in .slp
  let regExp = /.*\.slp$/;
  let replays = files.filter(file => regExp.test(file.name));
  return replays;
}

ipcMain.on('getAppDataPath', (event) => {
  event.returnValue = appDataPath;
})

ipcMain.handle('showOpenDialog', async (event, args)=> {
  let folder = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return folder.filePaths;
})
