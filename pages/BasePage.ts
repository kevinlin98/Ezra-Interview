import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly continueBtn: Locator;
  readonly backBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.continueBtn = page.getByRole('button', { name: 'Continue' });
    this.backBtn = page.getByRole('button', { name: 'Back' });
  }

  async clickContinue() {
    await this.continueBtn.click();
  }

  async clickBack() {
    await this.backBtn.click();
  }
}