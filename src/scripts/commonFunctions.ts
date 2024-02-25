import path from "path";
import fs from "fs";
import { exec, spawnSync } from "child_process";
import Database from "./database";
import { ipcRenderer } from "electron";
import util from "util";
const execPromise = util.promisify(require("child_process").exec);
var pathToFfmpeg = require("ffmpeg-static").replace(
  "app.asar",
  "app.asar.unpacked"
);
const db = Database.GetInstance();
const settingsStmt = db.prepare("SELECT value from settings where key = ?");

export const playAndRecordConversions = async function playAndRecordConversions(
  conversions: Array<any>,
  recordConversions: Boolean = false,
  recordingPath: string = "",
  recordingName: string = ""
) {
  let command = getReplayCommand(conversions);
  if (!recordConversions) {
    disableOrEnableDolphinRecording(false);
    playConversions(command);
  } else {
    const fileName: string =
      recordingName || new Date().toJSON().replaceAll(":", "");
    let recordedFilePath = recordingPath + `${fileName}.avi`;
    //TODO better organization
    await recordDolphinClips(conversions, recordedFilePath);
    return recordedFilePath;
  }
};

async function playConversions(replayCommand: string) {
  return new Promise<void>((resolve) => {
    var dolphinProcess = exec(replayCommand);
    dolphinProcess?.stdout?.on("data", (line) => {
      if (line.includes("[NO_GAME]")) {
        spawnSync("taskkill", ["/pid", `${dolphinProcess.pid}`, "/f", "/t"]);
        resolve();
      }
    });
  });
}

function getReplayCommand(conversions: any) {
  const playbackPath = settingsStmt.get("dolphinPath").value;
  const isoPath = settingsStmt.get("isoPath").value;
  const preRoll = settingsStmt.get("preRoll")?.value || 0;
  const postRoll = settingsStmt.get("postRoll")?.value || 0;
  var output: any = {
    mode: "queue",
    replay: "",
    isRealTimeMode: false,
    outputOverlayFiles: true,
    queue: [],
  };
  for (let conversion of conversions) {
    let startFrame = conversion.startFrame - preRoll;
    //javascript is fun (:
    let endFrame = conversion.endFrame + parseInt(postRoll);
    var queueMessage = {
      path: conversion.filepath,
      startFrame: startFrame,
      endFrame: endFrame,
    };
    output.queue.push(queueMessage);
  }
  let jsonPath = __dirname.includes(".asar")
    ? path.join(__dirname, "..", "..", "tempMoments.json")
    : path.join(__dirname, "tempMoments.json");

  //if i use the json directly it doesnt work, so have to write it to a file first
  fs.writeFileSync(jsonPath, JSON.stringify(output));
  //pretty sure only the -i and -e are needed?
  return `"${playbackPath}" -i "${jsonPath}" -b -e "${isoPath}" --cout`;
}

//TODO BETTER NAMING
function disableOrEnableDolphinRecording(enable = false) {
  const folderPath = getPlaybackFolder();
  const configPath = "User\\Config\\Dolphin.ini";
  const fullPlaybackPath = folderPath + configPath;

  const settingsRegExp = /(DumpFrames =).*/;
  const audioSettingsRegExp = /(DumpAudio =).*/;
  const config = fs.readFileSync(fullPlaybackPath, "utf-8");
  const newSetting = enable ? "DumpFrames = True" : "DumpFrames = False";
  const newAudioSetting = enable ? "DumpAudio = True" : "DumpAudio = False";
  const newConfig = config
    .replace(settingsRegExp, newSetting)
    .replace(audioSettingsRegExp, newAudioSetting);

  //auto deletes files for us
  //could probably leave True?
  const silentFrameDumpExp = /(DumpFramesSilent =).*/;
  const frameSetting = enable
    ? "DumpFramesSilent = True"
    : "DumpFramesSilent = False";
  const silentAudioDumpExp = /(DumpAudioSilent =).*/;
  const audioSetting = enable
    ? "DumpAudioSilent = True"
    : "DumpAudioSilent = False";
  const finalConfig = newConfig
    .replace(silentFrameDumpExp, frameSetting)
    .replace(silentAudioDumpExp, audioSetting);
  fs.writeFileSync(fullPlaybackPath, finalConfig);
}

function getPlaybackFolder() {
  const regExp = /(.*\\)/;
  const playbackPath = settingsStmt.get("dolphinPath").value;
  return regExp.exec(playbackPath)![0];
}

async function executeUntilSuccess(command: string, tryLimit: number = 10) {
  let i = 0;
  return new Promise<void>(async (resolve, reject) => {
    while (i < tryLimit) {
      i++;
      try {
        console.log(`attempt ${i}`);
        let { stdErr } = await execPromise(command);
        if (stdErr) console.log(stdErr);
        if (!stdErr) {
          resolve();
          return;
        }
      } catch (e) {
        console.log(e);
      } finally {
        await sleep(100);
      }
    }
    reject();
  });
}

async function sleep(delay = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

export const showOpenDialog = async () => {
  return await ipcRenderer.invoke("showOpenDialog");
};

async function tryCopyUntilSuccess(
  from: string,
  to: string,
  tryLimit: number = 10
) {
  let i = 0;
  while (i < tryLimit) {
    try {
      console.log(`attempt ${i}, from ${from} to ${to}`);
      fs.copyFileSync(from, to);
      return;
    } catch (e) {
      console.log(e);
      await sleep(200);
      i++;
    }
  }
}
async function recordDolphinClips(
  conversions: any,
  fullDestinationPath: string
) {
  disableOrEnableDolphinRecording(true);
  cleanupMomentFiles();
  const basePlaybackFolder = getPlaybackFolder();
  const frameDumpFolder = basePlaybackFolder + "User\\Dump\\Frames";
  const frameDumpPath = frameDumpFolder + "\\framedump0.avi";
  const audioDumpPath = basePlaybackFolder + "User\\Dump\\Audio\\dspdump.wav";
  //const mergePath = frameDumpFolder + '\\video.avi';

  const playbackPath = settingsStmt.get("dolphinPath").value;
  const isoPath = settingsStmt.get("isoPath").value;
  const momentFiles = createMomentFiles(conversions);
  const commands = momentFiles.map((file: string) => {
    return `"${playbackPath}" -i "${file}" -b -e "${isoPath}" --cout`;
  });
  // record each clip individually
  let concatFileText = "";
  for (let i = 0; i < commands.length; i++) {
    const tempVideoPath = path.join(frameDumpFolder, `temp${i}.avi`);
    const tempAudioPath = path.join(frameDumpFolder, `temp${i}.wav`);
    await playConversions(commands[i]);
    await tryCopyUntilSuccess(frameDumpPath, tempVideoPath);
    await tryCopyUntilSuccess(audioDumpPath, tempAudioPath);
    const mergePath = path.join(frameDumpFolder, `merged${i}.avi`);
    const mergeCommand = `"${pathToFfmpeg}" -y -i "${tempVideoPath}" -i "${tempAudioPath}" -c copy "${mergePath}"`;
    await executeUntilSuccess(mergeCommand);
    concatFileText += `file '${mergePath}'\n`;
  }
  const concatFileName = __dirname.includes(".asar")
    ? path.join(__dirname, "..", "..", "concat.txt")
    : path.join(__dirname, "concat.txt");
  fs.writeFileSync(concatFileName, concatFileText);
  // concat all clips into a single video
  const concatCommand = `${pathToFfmpeg} -f concat -safe 0 -i "${concatFileName}" -c copy "${fullDestinationPath}"`;
  console.log("concat", concatCommand);
  await executeUntilSuccess(concatCommand);
  cleanupMomentFiles();
  const cleanupFiles = fs.readdirSync(frameDumpFolder);
  cleanupFiles.map((file) => fs.unlinkSync(path.join(frameDumpFolder, file)));
}

function createMomentFiles(conversions: any) {
  const preRoll = settingsStmt.get("preRoll")?.value || 0;
  const postRoll = settingsStmt.get("postRoll")?.value || 0;

  let jsonPaths = [];
  let queueMessages = [];
  for (let conversion of conversions) {
    let startFrame = conversion.startFrame - preRoll;
    //javascript is fun (:
    let endFrame = conversion.endFrame + parseInt(postRoll);
    let queueMessage = {
      path: conversion.filepath,
      startFrame: startFrame,
      endFrame: endFrame,
    };
    queueMessages.push(queueMessage);
  }

  for (let i = 0; i < queueMessages.length; i++) {
    const fileName = `tempMoments${i}.json`;
    let jsonPath = __dirname.includes(".asar")
      ? path.join(__dirname, "..", "..", fileName)
      : path.join(__dirname, fileName);

    let output: any = {
      mode: "queue",
      replay: "",
      isRealTimeMode: true,
      queue: [queueMessages[i]],
    };
    fs.writeFileSync(jsonPath, JSON.stringify(output));
    jsonPaths.push(jsonPath);
  }
  return jsonPaths;
}

function cleanupMomentFiles() {
  let momentDir = __dirname.includes(".asar")
    ? path.join(__dirname, "..", "..")
    : __dirname;
  let files = fs.readdirSync(momentDir);
  for (let i = 0; i < files.length; i++) {
    if (files[i].includes("tempMoments")) {
      fs.unlinkSync(path.join(momentDir, files[i]));
    }
  }
}
