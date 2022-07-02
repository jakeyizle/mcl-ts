import * as React from 'react';
import DatabaseProgressBar from './DatabaseProgressBar';
import Database from './database'
const db = Database.GetInstance();
export default class HomeForm extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
  }

  isReplayPathValid() {
    const replayPath = db.prepare("SELECT value from settings where key = 'replayPath'").pluck().get();
    return replayPath;
  }
  render() {
    return (
      this.isReplayPathValid()
        ? <DatabaseProgressBar />
        : <div>Please set a valid replay path.</div>
    )
  }
}
