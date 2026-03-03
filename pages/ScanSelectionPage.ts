import { Page, Locator } from '@playwright/test';

export class ScanSelectionPage {
  readonly page: Page;
  readonly continueBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.continueBtn = page.getByTestId('select-plan-submit-btn');
  }

  async selectScan(scanName: string) {
    await this.page.getByText(scanName, { exact: false }).first().click();
  }

  async clickContinue() {
    await this.continueBtn.click();
  }
}