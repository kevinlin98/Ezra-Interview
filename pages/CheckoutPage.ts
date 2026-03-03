import { Page, Locator, expect, FrameLocator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly submitBtn: Locator;
  readonly stripeFrame: FrameLocator;

constructor(page: Page) {
    this.page = page;
    this.submitBtn = page.locator('[data-test="submit"]');
    
   this.stripeFrame = page.locator('iframe[title="Secure payment input frame"]:not([aria-hidden="true"])').first().contentFrame();
  }

  async verifyTotalIs(expectedTotal: string) {
    // This locator finds the exact text that is visible on the screen.
    const totalElement = this.page.locator(`text="${expectedTotal}" >> visible=true`).first();
    
    await expect(totalElement).toBeVisible();
  }

  async fillPaymentDetails(cardNumber: string, exp: string, cvc: string, zip: string) {
    await this.stripeFrame.getByRole('textbox', { name: 'Card number' }).fill(cardNumber);
    await this.stripeFrame.getByRole('textbox', { name: 'Expiration date MM / YY' }).fill(exp);
    await this.stripeFrame.getByRole('textbox', { name: 'Security code' }).fill(cvc);
    await this.stripeFrame.getByRole('textbox', { name: 'ZIP code' }).fill(zip);
  }

  async completeCheckout() {
    await this.submitBtn.click();
  }
}