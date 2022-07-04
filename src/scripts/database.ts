//dont believe quick fix's lies
const Database = require('better-sqlite3');
import { join } from 'path';
import { ipcRenderer } from 'electron';
//putting db in application path makes updates overwrite it
//actually gets created twice, once in main-world and once in renderer-world
//ipcRenderer is not available when this is in main-world, but main can pass in the appDataPath so it never actually gets called in main-world
class DatabaseConnection {
  private constructor() {}
  private static _appDataPath: string = '';
  private static _instance: any
  public static GetInstance = (appDataPath: string = '') => {
    if (this._instance) {
      return this._instance
    }
    this._appDataPath ||= appDataPath;
    if (!appDataPath && !this._appDataPath) {
      this._appDataPath = ipcRenderer.sendSync('getAppDataPath');
    }
    this._instance = new Database(join(this._appDataPath, 'melee.db'));
    this._instance.pragma('journal_mode = WAL');
    return this._instance;
  }
}

export default DatabaseConnection
