import type { ElectronApplication } from 'playwright';
import { _electron as electron } from 'playwright';
import {expect} from '@playwright/test';
import { afterAll, beforeAll, test } from 'vitest';
import { createHash } from 'crypto';
import { join } from 'path'

let electronApp: ElectronApplication;


beforeAll(async () => {
  let path = join(__dirname, '../dist/electron/main/index.js')
  console.log(path);
  electronApp = await electron.launch({ args: [path] });
});


afterAll(async () => {
  await electronApp.close();
});

test('Main window web content', async () => {
  const page = await electronApp.firstWindow();
  const element = await page.$('#root', { strict: true });
  expect(element, 'Can\'t find root element').toBeDefined();
  expect((await element!.innerHTML()).trim(), 'Window content was empty').not.toBe('');
});

test('Can click on settings', async () => {
  const page = await electronApp.firstWindow();
  const settingsElement = page.locator('.Settings');
  await expect(settingsElement).toHaveAttribute('style', 'display: none;')
  await page.locator(`[name='Settings']`).click();
  await expect(settingsElement).toHaveAttribute('style', 'display: block;')
})
