import type { ElectronApplication, FileChooser } from 'playwright';
import { _electron as electron } from 'playwright';
import {expect} from '@playwright/test';
import { afterAll, beforeAll, test } from 'vitest';
import { join } from 'path'
import {App} from './page'
import {unlinkSync, existsSync} from 'fs';
let electronApp: ElectronApplication;
const appPath = join(__dirname, '../dist/electron/main/index.js')


beforeAll(async () => {
  electronApp = await electron.launch({ args: [appPath] });
});

afterAll(async () => {
  await electronApp.close();
});

test('Main window web content', async () => {
  const page = new App(await electronApp.firstWindow());
  const element = page.root;
  expect(element, 'Can\'t find root element').toBeDefined();
  expect((await element!.innerHTML()).trim(), 'Window content was empty').not.toBe('');
});

test('Can click on settings', async () => {
  const page = new App(await electronApp.firstWindow());
  const settingsElement = page.settingsPage;
  await expect(settingsElement).toHaveAttribute('style', 'display: none;')
  await page.settingsNav.click();
  await expect(settingsElement).toHaveAttribute('style', 'display: block;')
})

//playwright doesnt support folder uploads yet so replay path is set by database class
test('Can upload replays', async () => {
  await electronApp?.close();
  const basePath = join(__dirname,'../melee.db');
  if (existsSync(basePath)) unlinkSync(basePath);
  if (existsSync(basePath+'-shm')) unlinkSync(basePath+'-shm');
  if (existsSync(basePath+'-wal')) unlinkSync(basePath+'-wal')
  electronApp = await electron.launch({ args: [appPath] });
  const page = new App(await electronApp.firstWindow());
  await expect(page.homePage).toContainText('8 games and 278 conversions loaded', {timeout: 30000});
})

test('Can search replays', async () => {
  const page = new App(await electronApp.firstWindow());
  await page.searchNav.click();
  await page.searchButton.click();
  await expect(page.conversionTable).toBeVisible();
})

test('Can add replays to playlist', async() => {
  const page = new App(await electronApp.firstWindow());
  await page.getNav('Playlists').click();
  await page.playlistDropdown.type('testPlaylist');
  await page.page.keyboard.press('Enter');
  await page.getNav('Search').click();
  // test is dependent on previous test :(
  // await page.searchButton.click();
  let count = await page.searchFormPlaylistDropdowns.count();
  console.log(count)
  for (let i = 0; i < count; i ++) {
    await page.searchFormPlaylistDropdowns.nth(i).click();
    await page.page.keyboard.press('Enter');
  }
  await page.getNav('Playlists').click();
  expect(page.page.locator('text=1–10 of 10')).toBeDefined();
})

//for debugging
function delay(time: number) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time)
  });
}
