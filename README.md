# vite-electron-boilerplate

![GitHub stars](https://img.shields.io/github/stars/caoxiemeihao/vite-electron-boilerplate?color=fa6470&style=flat)
![GitHub issues](https://img.shields.io/github/issues/caoxiemeihao/vite-electron-boilerplate?color=d8b22d&style=flat)
![GitHub license](https://img.shields.io/github/license/caoxiemeihao/vite-electron-boilerplate?style=flat)
[![Required Node.JS >= v14.17.0](https://img.shields.io/static/v1?label=node&message=%3E=14.17.0&logo=node.js&color=3f893e&style=flat)](https://nodejs.org/about/releases)

**English | [简体中文](README.zh-CN.md)**
## Run Setup

  ```bash
  # clone the project
  git clone git@github.com:caoxiemeihao/vite-electron-boilerplate.git

  # enter the project directory
  cd vite-electron-boilerplate

  # install dependency(Recommend use yarn)
  yarn

  # develop
  yarn dev
  ```

## Branchs

- `main` - **[Electron + Vite + React](https://github.com/caoxiemeihao/vite-electron-boilerplate/tree/main)**

- `vue-ts` - **[Electron + Vite + Vue3](https://github.com/caoxiemeihao/vite-electron-boilerplate/tree/vue-ts)**

## Directory

```tree
├
├── configs
├   ├── vite.main.ts                 Main-process config file, for -> src/main
├   ├── vite.preload.ts              Preload-script config file, for -> src/preload
├   ├── vite.react-ts.ts             Renderer-script config file, for -> src/react-ts
├
├── scripts
├   ├── build.mjs                    Build script, for -> npm run build
├   ├── electron-builder.config.mjs
├   ├── watch.mjs                    Develop script, for -> npm run dev
├
├── src
├   ├── main                         Main-process source code
├   ├── preload                      Preload-script source code
├   ├── react-ts                     Renderer-process source code
├
```

## How to work

- The Main-process, Renderer-process and Preload-script are all config in `configs/xxx.ts`

- The full-scale `Vite` compilation is supper fast

- `scripts/build.mjs` only calls the `Vite` API and uses the `configs/xxx.ts` config file to build

- The difference between `scripts/watch.mjs` and `build.mjs` is that the watch option is configured for the Main-process and Preload-script. The Renderer-process uses `require ('vite').createServer`

- The whole project tends to be configured rather than a large number of scripts, which is dazzling -- **🥳 上手简单**

## Demo

<img width="400px" src="https://raw.githubusercontent.com/caoxiemeihao/blog/main/vite-electron-boilerplate/react-win.png" />

## Wechat group | | 请我喝杯下午茶 🥳

<div style="display:flex;">
  <img width="244px" src="https://raw.githubusercontent.com/caoxiemeihao/blog/main/assets/wechat/group/qrcode.jpg" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img width="244px" src="https://raw.githubusercontent.com/caoxiemeihao/blog/main/assets/wechat/%24qrcode/%2419.99.png" />
</div>
