# Melee Combo Library

A desktop app for Super Smash Bros. Melee players: it indexes every combo in your [Slippi](https://slippi.gg) replay folder, lets you search them, and plays back or records playlists of combos as a single video. Useful for finding your best moments, studying a matchup, or cutting a combo video.

Download the latest installer from [Releases](https://github.com/jakeyizle/mcl-ts/releases/latest). It updates itself when a new version is published.

## Features

- **Search every combo you've played.** Filter by player code, character, stage, damage range, move count, whether it killed, zero-to-deaths, or the exact sequence of moves a combo starts with, ends with or contains.
- **Playlists.** Collect combos, reorder them, and play the whole list back in Slippi's Dolphin with configurable pre- and post-roll.
- **Record to video.** Plays each combo through Dolphin's frame dump, merges the audio and video with ffmpeg, and concatenates the clips into one file.
- **Fast import of large libraries.** Replays are parsed in parallel, one hidden renderer per CPU core, into a local SQLite database indexed for the search filters. Files already imported or known to be corrupt are skipped on later runs.

## How it's built

| Concern | Choice |
|---|---|
| Shell | Electron + Vite, auto-updates via `electron-updater` and GitHub Releases |
| UI | React, MUI (data grid for results) |
| Replay parsing | `@slippi/slippi-js` |
| Storage | SQLite via `better-sqlite3` |
| Video | Slippi Dolphin frame dump + `ffmpeg-static` |
| Tests / CI | Playwright driving the packaged Electron app, run on Windows, macOS and Linux by GitHub Actions |

## Setup

In **Settings**:

- **Replay path:** your Slippi replay folder (usually `Documents\Slippi`).
- **SSBM ISO path:** any ISO that works with Slippi.
- **Playback Dolphin path:** in the Slippi Launcher, open Settings → Dolphin Settings → Playback → Open Containing Folder, and choose that `Dolphin.exe`.
- **Recording path:** where recorded videos are saved.
- **Pre-roll / post-roll frames:** how much to show before and after each combo (e.g. 30 and 45).

Then open **Home** to import your replays, and use **Search** and **Playlists** from there. For better recordings, raise the bitrate in the playback Dolphin's graphics settings.

## Development

```bash
npm install
npm run dev
npm test        # builds, then runs the Playwright E2E suite against the Electron app
npm run build   # packages an installer into release/
```

## Status

Feature-complete for my own use and no longer under active development. Released builds are tested mainly on Windows. The local database has no migration system, so an update that changes the schema requires deleting the database and re-importing.
