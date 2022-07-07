import type { ElectronApplication, FileChooser } from 'playwright';
import { _electron as electron } from 'playwright';
import {expect} from '@playwright/test';
import { afterAll, beforeAll, test } from 'vitest';
import { join } from 'path'
import {App} from './page'
import {unlinkSync} from 'fs';
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
  unlinkSync(basePath);
  unlinkSync(basePath+'-shm');
  unlinkSync(basePath+'-wal')
  electronApp = await electron.launch({ args: [appPath] });
  const page = new App(await electronApp.firstWindow());
  await expect(page.homePage).toContainText('8 games and 278 conversions loaded', {timeout: 10000});
})


//for debugging
function delay(time: number) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time)
  });
}
