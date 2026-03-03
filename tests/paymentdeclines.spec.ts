// Imports from pages
import { test, expect } from '@playwright/test';
import { ScanSelectionPage } from '../pages/ScanSelectionPage';
import { SchedulingPage } from '../pages/SchedulingPage';
import { CheckoutPage } from '../pages/CheckoutPage';

// Imports from utils
import { TEST_USERS, DECLINE_SCENARIOS } from '../utils/test-data';
import { loginUser } from '../utils/helpers';

test.describe('Payment Decline Handling', () => {
  let scanSelectionPage: ScanSelectionPage;
  let schedulingPage: SchedulingPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    scanSelectionPage = new ScanSelectionPage(page);
    schedulingPage = new SchedulingPage(page);
    checkoutPage = new CheckoutPage(page);

    await loginUser(page, TEST_USERS.PRIMARY_USER.email, TEST_USERS.PRIMARY_USER.password);
    await page.getByRole('button', { name: 'Book a scan' }).click();
    // Select Scan, adding the word "Available" to ensure we click the right one, since there is a heading in the previous page with similar text
    await scanSelectionPage.selectScan('MRI Scan with Spine Available');
    await scanSelectionPage.clickContinue();
    
    await schedulingPage.filterByState('New York'); 
    await schedulingPage.selectLocation('AMRIC');
    await schedulingPage.selectFirstAvailableDateAndTime();
    await schedulingPage.clickContinue();

  });

  // Loop through each decline scenario imported from test-data.ts
  for (const scenario of DECLINE_SCENARIOS) {
    test(`Payment should handle ${scenario.description} correctly`, async ({ page }) => {
      
      await checkoutPage.fillPaymentDetails(
        scenario.card,
        scenario.exp,
        scenario.cvc,
        scenario.zip
      );

      await checkoutPage.completeCheckout();

      // Assert the UI displays the correct Stripe error message
      const errorMessage = page.getByText(scenario.expectedError, { exact: false }).first();
      
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Assert we have NOT been redirected to the newly confirmation URL since the payment was declined
      await expect(page).not.toHaveURL(/.*scan-confirm*/);
    });
  }
});