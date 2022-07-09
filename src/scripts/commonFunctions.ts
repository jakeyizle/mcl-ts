import path from 'path';
import fs from 'fs';
import { exec, spawnSync } from 'child_process';
import split from "lodash/split";
import each from "lodash/each";
import OBSWebsocket from 'obs-websocket-js';
import Database from './database'
import { ipcRenderer } from 'electron';
import util from 'util';
const execPromise = util.promisify(require('child_process').exec);
var pathToFfmpeg = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');
const db = Database.GetInstance();
const settingsStmt = db.prepare('SELECT value from settings where key = ?');

export const playAndRecordConversions = async function playAndRecordConversions(conversions: Array<any>, recordConversions: Boolean = false, recordingPath: string = '', recordingName: string = '') {
  let command = getReplayCommand(conversions);
  if (!recordConversions) {
    disableOrEnableDolphinRecording(false);
    playConversions(command);
  }
  else {
    const recordMethod = settingsStmt.get('recordMethod')?.value;
    const fileName: string = recordingName || new Date().toJSON().replaceAll(':', '');
    let recordedFilePath = recordingPath + `${fileName}.`
    if (recordMethod === 'Dolphin') {
      disableOrEnableDolphinRecording(true);
      recordedFilePath += 'avi'
      const folderPath = getPlaybackFolder()
      const dumpPath = 'User\\Dump\\Frames';
      const movieFolderPath = folderPath + dumpPath
      const movieDump = '\\framedump0.avi'
      const fullMoviePath = movieFolderPath + movieDump;
      const audioPath = folderPath + 'User\\Dump\\Audio\\dspdump.wav';
      const mergeCommand = `"${pathToFfmpeg}" -i "${fullMoviePath}" -i "${audioPath}" -c copy "${recordedFilePath}"`
      await playConversions(command);
      console.log(mergeCommand);
      //dolphin wont let go of my toy
      let mergeFail = true;
      while (mergeFail) {
        try {
          console.log('merging');
          const { stderr } = await execPromise(mergeCommand);
          console.log(stderr);
          if (!stderr) { mergeFail = false };
        } catch (e) {
          console.log(e);
        }
      }
      return recordedFilePath;
    } else if (recordMethod === 'OBS') {
      disableOrEnableDolphinRecording(false);
      recordedFilePath += 'mkv'
      let recordedFile = await recordReplayWithOBS(command);
      let renameLoop = true;
      let i = 0;
      while (renameLoop) {
        i++
        if (i > 10000) { return }
        try {
          fs.copyFileSync(recordedFile, recordedFilePath)
          fs.unlinkSync(recordedFile)
          renameLoop = false;
        } catch (e) { }
      }
    } else { throw `Bad Recording Parameter` }
    return recordedFilePath;
  }
}

export const isOBSOn = async function isOBSOn() {
  try {
    const obsPassword = settingsStmt.get('obsPassword').value;
    const obsPort = settingsStmt.get('obsPort').value;
    const obs = new OBSWebsocket();
    await obs.connect({ address: `localhost:${obsPort}`, password: obsPassword });
    obs.disconnect();
    return true
  } catch (e) {
    console.log(e);
    return false
  }
}

async function playConversions(replayCommand: string) {
  return new Promise<void>((resolve, reject) => {
    var dolphinProcess = exec(replayCommand);
    dolphinProcess?.stdout?.on('data', (line) => {
      if (line.includes('[NO_GAME]')) {
        spawnSync("taskkill", ["/pid", `${dolphinProcess.pid}`, '/f', '/t']);
        resolve();
      }
    })
  })
}

function getReplayCommand(conversions: any) {
  const playbackPath = settingsStmt.get('dolphinPath').value;
  const isoPath = settingsStmt.get('isoPath').value;
  const preRoll = settingsStmt.get('preRoll')?.value || 0;
  const postRoll = settingsStmt.get('postRoll')?.value || 0;
  var output: any = {
    mode: "queue",
    replay: "",
    isRealTimeMode: false,
    outputOverlayFiles: true,
    queue: []
  };
  for (let conversion of conversions) {
    let startFrame = conversion.startFrame - preRoll;
    //javascript is fun (:
    let endFrame = conversion.endFrame + parseInt(postRoll);
    var queueMessage = {
      "path": conversion.filepath,
      "startFrame": startFrame,
      "endFrame": endFrame
    };
    output.queue.push(queueMessage);
  }
  let jsonPath = __dirname.includes('.asar')
    ? path.join(__dirname, '..', '..', 'tempMoments.json')
    : path.join(__dirname, "tempMoments.json");

  //if i use the json directly it doesnt work, so have to write it to a file first
  fs.writeFileSync(jsonPath, JSON.stringify(output));
  //pretty sure only the -i and -e are needed?
  return `"${playbackPath}" -i "${jsonPath}" -b -e "${isoPath}" --cout`;
}

async function recordReplayWithOBS(replayCommand: string) {
  return new Promise<string>((resolve, reject) => {
    try {
      const obsPassword = settingsStmt.get('obsPassword').value;
      const obsPort = settingsStmt.get('obsPort').value;
      const obs = new OBSWebsocket();
      obs.connect({ address: `localhost:${obsPort}`, password: obsPassword });
      let startFrame: number;
      let endFrame: number;
      let gameEndFrame: number;
      let currentFrame: number;
      let recordingStarted: Boolean;
      let fileName: string;

      var dolphinProcess = exec(replayCommand)
      dolphinProcess?.stdout?.on('data', (line) => {
        const commands = split(line, "\r\n");
        each(commands, async (command: any) => {
          command = split(command, " ");
          console.log(command);
          if (command[0] === '[PLAYBACK_START_FRAME]') {
            startFrame = parseInt(command[1]);
          }
          if (command[0] === '[PLAYBACK_END_FRAME]') {
            endFrame = parseInt(command[1]);
          }
          if (command[0] === '[GAME_END_FRAME]') {
            gameEndFrame = parseInt(command[1]);
          }
          if (command[0] === '[CURRENT_FRAME]') {
            currentFrame = parseInt(command[1]);
            if (currentFrame == startFrame) {
              if (!recordingStarted) {
                console.log('start record');
                await obs.send("StartRecording");
                recordingStarted = true;
              } else {
                console.log('resume record');
                obs.send("ResumeRecording").catch((err: any) => console.log(err));
              }
            }
            if (currentFrame == endFrame || currentFrame == gameEndFrame) {
              console.log('pauseRecord');
              obs.send("PauseRecording").catch((err: any) => console.log(err));
            }
          }
          if (command[0] === '[NO_GAME]') {
            console.log('stopRecord');
            let recordingStatus = await obs.send("GetRecordingStatus");
            fileName = recordingStatus.recordingFilename || '';
            await obs.send("StopRecording");
            spawnSync("taskkill", ["/pid", `${dolphinProcess.pid}`, '/f', '/t']);
            recordingStarted = false;
            resolve(fileName);
          }
        });
      })
    } catch (e) {
      console.log(e);
      reject();
    }
  })
}
//TODO BETTER NAMING
function disableOrEnableDolphinRecording(enable = false) {
  const folderPath = getPlaybackFolder()
  const configPath = 'User\\Config\\Dolphin.ini';
  const fullPlaybackPath = folderPath + configPath;

  const settingsRegExp = /(DumpFrames =).*/;
  const audioSettingsRegExp = /(DumpAudio =).*/;
  const config = fs.readFileSync(fullPlaybackPath, 'utf-8');
  const newSetting = enable ? 'DumpFrames = True' : 'DumpFrames = False';
  const newAudioSetting = enable ? 'DumpAudio = True' : 'DumpAudio = False';
  const newConfig = config.replace(settingsRegExp, newSetting).replace(audioSettingsRegExp, newAudioSetting);

  //auto deletes files for us
  //could probably leave True?
  const silentFrameDumpExp = /(DumpFramesSilent =).*/;
  const frameSetting = enable ? 'DumpFramesSilent = True' : 'DumpFramesSilent = False'
  const silentAudioDumpExp = /(DumpAudioSilent =).*/;
  const audioSetting = enable ? "DumpAudioSilent = True" : 'DumpAudioSilent = False'
  const finalConfig = newConfig.replace(silentFrameDumpExp, frameSetting).replace(silentAudioDumpExp, audioSetting)
  fs.writeFileSync(fullPlaybackPath, finalConfig);
}

function getPlaybackFolder() {
  const regExp = /(.*\\)/;
  const playbackPath = settingsStmt.get('dolphinPath').value;
  return regExp.exec(playbackPath)![0];
}

export const showOpenDialog = async () => {
  return await ipcRenderer.invoke('showOpenDialog')
}
