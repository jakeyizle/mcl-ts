import type {ElectronApplication} from 'playwright';
import {_electron as electron} from 'playwright';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {createHash} from 'crypto';
import {join} from 'path'

let electronApp: ElectronApplication;


beforeAll(async () => {
  let path = join(__dirname, '../dist/electron/main/index.js')
  console.log(path);
  electronApp = await electron.launch({args: [path]});
});


afterAll(async () => {
  await electronApp.close();
});


test('Main window state', async () => {
  const windowState: { isVisible: boolean; isDevToolsOpened: boolean; isCrashed: boolean }
    = await electronApp.evaluate(({BrowserWindow}) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];

    const getState = () => ({
      isVisible: mainWindow.isVisible(),
      isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
      isCrashed: mainWindow.webContents.isCrashed(),
    });

    return new Promise((resolve) => {
      if (mainWindow.isVisible()) {
        resolve(getState());
      } else
        mainWindow.once('ready-to-show', () => setTimeout(() => resolve(getState()), 0));
    });
  });

  expect(windowState.isCrashed, 'App was crashed').toBeFalsy();
  expect(windowState.isVisible, 'Main window was not visible').toBeTruthy();
  expect(windowState.isDevToolsOpened, 'DevTools was opened').toBeFalsy();
});


test('Main window web content', async () => {
  const page = await electronApp.firstWindow();
  const element = await page.$('#root', {strict: true});
  expect(element, 'Can\'t find root element').toBeDefined();
  expect((await element!.innerHTML()).trim(), 'Window content was empty').not.equal('');
});
