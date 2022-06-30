import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { release } from 'os'
import { join } from 'path'
const db = require('better-sqlite3')('melee.db');

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

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    webPreferences: {
      preload: splash,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../../index.html'))
  } else {
    win.loadURL(url)
    // win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

ipcMain.on('makeWindow', () => {

})
app.whenReady().then(initDB).then(createWindow)

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
