const Database = require('better-sqlite3');

class DatabaseConnection {
  private constructor() {
    console.log('constructing')
  }

  private static _instance: any
  public static GetInstance = () => {
    if (this._instance) {
      console.log('returing existing');
      return this._instance
    }
    console.log('making new instance');
    this._instance = new Database('melee.db');
    this._instance.pragma('journal_mode = WAL');
    return this._instance;
  }
}

export default DatabaseConnection
