# electron-vite-react

![GitHub stars](https://img.shields.io/github/stars/caoxiemeihao/vite-react-electron?color=fa6470&style=flat)
![GitHub issues](https://img.shields.io/github/issues/caoxiemeihao/vite-react-electron?color=d8b22d&style=flat)
![GitHub license](https://img.shields.io/github/license/caoxiemeihao/vite-react-electron?style=flat)
[![Required Node.JS >= v14.17.0](https://img.shields.io/static/v1?label=node&message=%3E=14.17.0&logo=node.js&color=3f893e&style=flat)](https://nodejs.org/about/releases)

**English | [简体中文](README.zh-CN.md)**

## Overview

This is a `Vite`-integrated `Electron` template built with simplification in mind.

The repo contains only the most basic files, dependencies and functionalities to ensure flexibility for various scenarios.

You need a basic understanding of `Electron` and `Vite` to get started. But that's not mandatory - you can learn almost all the details by reading through the source code. Trust me, this repo is not that complex. 😋

## Quick start

```sh
npm create electron-vite
```

![electron-vite-react.gif](https://github.com/electron-vite/electron-vite-react/blob/main/packages/renderer/public/electron-vite-react.gif?raw=true)

## Debug

![electron-vite-react-debug.gif](https://github.com/electron-vite/electron-vite-react/blob/main/packages/renderer/public/electron-vite-react-debug.gif?raw=true)

## Directory structure

Once `dev` or `build` npm-script is executed, the `dist` folder will be generated. It has the same structure as the project, the purpose of this design is to ensure the correct path calculation.

```tree
├── electron                  Electron-related code
|   ├── main                  Main-process source code
|   ├── preload               Preload-script source code
|   └── resources             Resources for the production build
|       ├── icon.icns             Icon for the application on macOS
|       ├── icon.ico              Icon for the application
|       ├── installerIcon.ico     Icon for the application installer
|       └── uninstallerIcon.ico   Icon for the application uninstaller
|
├── release                   Generated after production build, contains executables
|   └──{version}
|       ├── {os}-unpacked     Contains unpacked application executable
|       └── Setup.{ext}       Installer for the application
|
├── public                    Static assets
└── src                       Renderer source code, your React application
```

## Use Electron and NodeJS API

> 🚧 By default, Electron doesn't support the use of API related to Electron and NodeJS in the Renderer process, but someone might need to use it. If so, you can see the template 👉 **[electron-vite-boilerplate](https://github.com/electron-vite/electron-vite-boilerplate)**

#### Invoke Electron and NodeJS API in `Preload-script`

- **electron/preload/index.ts**

  ```typescript
  import fs from "fs";
  import { contextBridge, ipcRenderer } from "electron";

  // --------- Expose some API to Renderer-process. ---------
  contextBridge.exposeInMainWorld("fs", fs);
  contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);
  ```

- **electron/renderer/src/global.d.ts**

  ```typescript
  // Defined in the window
  interface Window {
    fs: typeof import("fs");
    ipcRenderer: import("electron").IpcRenderer;
  }
  ```

- **electron/renderer/src/main.ts**

  ```typescript
  // Use Electron and NodeJS API in the Renderer-process
  console.log("fs", window.fs);
  console.log("ipcRenderer", window.ipcRenderer);
  ```

## Use SerialPort, SQLite3, or other node-native addons in the Main-process

- First, you need to make sure that the dependencies in the `package.json` are NOT in the "devDependencies". Because the project will need them after packaged.

- Main-process, Preload-script are also built with Vite, and they're built as [build.lib](https://vitejs.dev/config/#build-lib).  
  So they just need to configure Rollup.

```js
export default {
  build: {
    // built lib for Main-process, Preload-script
    lib: {
      entry: "index.ts",
      formats: ["cjs"],
      fileName: () => "[name].js",
    },
    rollupOptions: {
      // configuration here
      external: ["serialport", "sqlite3"],
    },
  },
};
```

## `dependencies` vs `devDependencies`

- First, you need to know if your dependencies are needed after the application is packaged.

- Like [serialport](https://www.npmjs.com/package/serialport), [sqlite3](https://www.npmjs.com/package/sqlite3) they are node-native modules and should be placed in `dependencies`. In addition, Vite will not build them, but treat them as external modules.

- Dependencies like [Vue](https://www.npmjs.com/package/vue) and [React](https://www.npmjs.com/package/react), which are pure javascript modules that can be built with Vite, can be placed in `devDependencies`. This reduces the size of the application.
