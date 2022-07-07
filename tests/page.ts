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
  searchNav: Locator;
  searchButton: Locator;
  conversionTable: Locator;
  playlistDropdown: Locator;
  searchFormPlaylistDropdowns: Locator;
  playlistConversionTableDropdowns: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsNav = page.locator(`[name='Settings']`);
    this.settingsPage = page.locator('.Settings');
    this.searchNav = page.locator(`[name=Search]`);
    this.searchButton = page.locator('button:has-text("Search Conversions")')
    this.conversionTable = page.locator('#ConversionTable');
    this.homePage = page.locator('.Home')
    this.replayPathBtn = page.locator('text=Set Replay Path');
    this.root = page.locator('#root');
    this.playlistDropdown = page.locator('#playlistDropdown');
    this.playlistConversionTableDropdowns = page.locator('#playlistConversionTable >> .playlistDropdown')
    this.searchFormPlaylistDropdowns = page.locator('.playlistDropdown');
  }

  getNav = (nav: string) => {
    return this.page.locator(`[name=${nav}]`);
  }
}
