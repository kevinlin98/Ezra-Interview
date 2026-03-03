import { Page, Locator } from '@playwright/test';

export class SchedulingPage {
  readonly page: Page;
  readonly continueBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.continueBtn = page.locator('[data-test="submit"]');
  }

  /**
   * Filters the locations by selecting a specific state from the dropdown.
   * @param stateName e.g., 'California', 'New York'
   */
  async filterByState(stateName: string) {
    await this.page.getByText('All Available').first().click();
    await this.page.getByText(stateName, { exact: true }).click();
    await this.page.waitForTimeout(1000); // Wait a moment for the location cards to filter and re-render
  }

  async selectLocation(locationName: string) {
    await this.page.getByText(locationName, { exact: false }).first().click();
    await this.page.waitForTimeout(1000); // This should be revisted to avoid using hardcoded wait time
  }

  // Sselects the first available calendar date by excluding cells with the disabled class, then selects the first time slot.
  async selectFirstAvailableDateAndTime() {
    // Select the date by finding the first locator with data-testid span that is not inside of a diabled cell.
    const firstAvailableDate = this.page.locator('.vuecal__cell:not(.vuecal__cell--disabled) [data-testid$="-cal-day-content"]').first();
    await firstAvailableDate.waitFor({ state: 'visible' });
    await firstAvailableDate.click();
    //Give the frontend a brief moment to fetch the times for this specific date. This should be revisted to avoid using hardcoded wait time
    await this.page.waitForTimeout(500); 

    const availableTimeSlots = this.page.locator('.appointments__individual-appointment label:visible');-
    await availableTimeSlots.first().waitFor({ state: 'visible' });
    
    const count = await availableTimeSlots.count();
    if (count === 0) {
      throw new Error('Date was clicked, but no time slots appeared on the screen!');
    }
    
    await availableTimeSlots.first().click();
  }

  async clickContinue() {
    await this.continueBtn.click();
  }
}