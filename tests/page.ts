// playwright-dev-page.ts
import { expect, Locator, Page } from '@playwright/test';
import { isThisQuarter } from 'date-fns';

export class App {
  page: Page;
  settingsNav: Locator;
  root: Locator;
  settingsPage: Locator;
  homePage: Locator;
  replayPathBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsNav = page.locator(`[name='Settings']`);
    this.settingsPage = page.locator('.Settings');
    this.homePage = page.locator('.Home')
    this.replayPathBtn = page.locator('text=Set Replay Path');
    this.root = page.locator('#root');
  }

}
