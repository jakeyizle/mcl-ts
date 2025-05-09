import * as React from 'react';
import { Box, Button, FormControlLabel, Radio, RadioGroup, TextField, FormLabel } from "@mui/material";
const dialog = require('electron').dialog;
import Database from '../scripts/database'
const db = Database.GetInstance();
const settingsStmt = db.prepare('SELECT value from settings where key = ?').pluck();
const settingsUpsert = db.prepare('INSERT INTO settings (key, value) values (@key, @value) ON CONFLICT (key) DO UPDATE SET value = @value');
import {showOpenDialog} from '../scripts/commonFunctions'

export default class SettingsForm extends React.Component<any, any> {
  replayPath: any;
  isoPath: any;
  dolphinPath: any;
  recordingPath: any;
  constructor(props: any) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.clickRefByName = this.clickRefByName.bind(this);
    this.handleFolderChange = this.handleFolderChange.bind(this);
    this.replayPath = React.createRef();
    this.isoPath = React.createRef();
    this.dolphinPath = React.createRef();
    this.recordingPath = React.createRef();
    this.state = {
      replayPath: '',
      isoPath: '',
      dolphinPath: '',
      preRoll: '',
      postRoll: '',
      recordingPath: ''
    }
  }
  //hacky solution to making invis components update
  componentDidUpdate() {
    for (const setting in this.state) {
      let value = settingsStmt.get(setting) ?? '';
      if (this.state[setting] != value) {
        this.setState({
          [setting]: value
        })
      }
    }
  }
  componentDidMount() {
    for (const setting in this.state) {
      let value = settingsStmt.get(setting);
      this.setState({
        [setting]: value ?? ''
      })
    }
  }
  async handleFolderChange(event: any) {
    let folder = await showOpenDialog();
    this.handleInputChange(event, folder);
  }

  //todo: clean up folder select
  handleInputChange(event: any, folder: string = '') {
    const target = event.target;
    const name = target.name;
    let value: string;
    switch (target.type) {
      case 'file':
        const path = target.files[0]?.path;
        value = path;
        if (target.name === 'replayPath') {
          const fullPath = target.files[0].webkitRelativePath
          // 'SlippiReplays/2024-05/Game_20240501T073330.slp'
          // 'SlippiReplays'
          const folder = fullPath.split('/')[0]
          // get up to and including 'SlippiReplays'
          const prefixPath = target.files[0]?.path.split(folder)[0]
          debugger
          value = prefixPath+folder+'\\'
        }
        break;
      case 'button':
        if (!folder) return;
        value = folder + '\\';
        break;
      default:
        value = target.type === 'checkbox' ? target.checked : target.value;
        break;
    }
    this.setState({
      [name]: value
    })
    settingsUpsert.run({ key: name, value: value });
  }

  clickRefByName(inputName: any) {
    //@ts-ignore
    this[inputName].current.click();
  }

  render() {
    return (
      <Box
        component="form"
        sx={{
          '& .MuiTextField-root': { m: 1, width: '25ch' },
        }}
        noValidate
        autoComplete="off"
      >
        <div>
          {/*Material doesnt have a component that can do FOLDER input*/}
          <input type="file" name="replayPath" webkitdirectory="true" ref={this.replayPath} onChange={(e) => this.handleInputChange(e)} hidden />
          <Button variant="outlined" onClick={(e) => this.clickRefByName('replayPath')}>Set Replay Path</Button>
          {this.state.replayPath && <span>{this.state.replayPath}</span>}
        </div>
        <div>
          <input type="file" name="isoPath" ref={this.isoPath} onChange={(e) => this.handleInputChange(e)} hidden />
          <Button variant="outlined" onClick={(e) => this.clickRefByName('isoPath')}>Set SSBM Iso Path</Button>
          {this.state.isoPath && <span>{this.state.isoPath}</span>}
        </div>
        <div>
          <input type="file" name="dolphinPath" ref={this.dolphinPath} onChange={(e) => this.handleInputChange(e)} hidden />
          <Button variant="outlined" onClick={(e) => this.clickRefByName('dolphinPath')}>Set Playback Dolphin Path</Button>
          {this.state.dolphinPath && <span>{this.state.dolphinPath}</span>}
        </div>
        <div>
          {/*@ts-ignore*/}
          <Button variant="outlined" name="recordingPath" onClick={(e) => this.handleFolderChange(e)}>Set Path Where Recordings Will Be Saved</Button>
          {this.state.recordingPath && <span>{this.state.recordingPath}</span>}
        </div>
        <div>
          <TextField label="preRoll frames" InputLabelProps={{ shrink: true }} type="number" placeholder="preRoll frames" onChange={(e) => this.handleInputChange(e)} name="preRoll" value={this.state.preRoll} />
        </div>
        <div>
          <TextField label="postRoll frames" InputLabelProps={{ shrink: true }} type="number" placeholder="postRoll frames" onChange={(e) => this.handleInputChange(e)} name="postRoll" value={this.state.postRoll} />
        </div>
      </Box>

    )
  }
}

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string;
    webkitdirectory?: string;
  }
}
declare module 'electron' {
  interface CrossProcessExports {
    // extends React's HTMLAttributes
    showOpenDialogSync?: any
  }
}
