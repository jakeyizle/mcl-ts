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
      try {
      this._appDataPath = ipcRenderer.sendSync('getAppDataPath');
      }
      catch (e) {
        this._appDataPath = '';
      }
    }
    this._instance = new Database(join(this._appDataPath, 'melee.db'));
    this._instance.pragma('journal_mode = WAL');
    return this._instance;
  }

  public static SetReplayDirectoryForTest = () => {
    const dir = join(__dirname, '../../../tests/resources/');
    const settingsUpsert = this._instance.prepare('INSERT INTO settings (key, value) values (@key, @value) ON CONFLICT (key) DO UPDATE SET value = @value');
    settingsUpsert.run({key: 'replayPath', value: dir});
  }
}

export default DatabaseConnection
