import { ipcRenderer } from "electron"

export function startDatabaseLoad() {
  console.log(1);
  return ipcRenderer.invoke('startDatabaseLoad');
}

export function listenForLoadUpdate(callback: any) {
  console.log(2);
   ipcRenderer.on('gameLoad', callback);
}

export function removeLoadListener() {
  console.log(3);
  ipcRenderer.removeAllListeners('gameLoad');
}
