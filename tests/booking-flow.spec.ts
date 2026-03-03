// Imports from pages
import { test, expect } from '@playwright/test';
import { ScanSelectionPage } from '../pages/ScanSelectionPage';
import { SchedulingPage } from '../pages/SchedulingPage';
import { CheckoutPage } from '../pages/CheckoutPage';

// Imports from utils
import { TEST_USERS, VALID_PAYMENT_DETAILS } from '../utils/test-data';
import { loginUser } from '../utils/helpers';

test.describe('Booking Flow End-to-End Tests', () => {
  let scanSelectionPage: ScanSelectionPage;
  let schedulingPage: SchedulingPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    scanSelectionPage = new ScanSelectionPage(page);
    schedulingPage = new SchedulingPage(page);
    checkoutPage = new CheckoutPage(page);
    
    await loginUser(page, TEST_USERS.PRIMARY_USER.email, TEST_USERS.PRIMARY_USER.password);
    await page.getByRole('button', { name: 'Book a scan' }).click();
  });

  test('User can successfully book an MRI Scan with Spine', async ({ page }) => {
    // Step 1: Select Scan, adding the word "Available" to ensure we click the right one, since there is a heading in the previous page with similar text
    await scanSelectionPage.selectScan('MRI Scan with Spine Available'); 
    await scanSelectionPage.clickContinue();

    // Step 2: Schedule
    await schedulingPage.filterByState('New York'); 
    await schedulingPage.selectLocation('AMRIC'); // Update with actual name!
    await schedulingPage.selectFirstAvailableDateAndTime();
    await schedulingPage.clickContinue();

    // Step 3: Checkout
    await checkoutPage.verifyTotalIs('$1699');
    
    // Fill payment using the stripe card test data
    await checkoutPage.fillPaymentDetails(
      VALID_PAYMENT_DETAILS.card, 
      VALID_PAYMENT_DETAILS.exp, 
      VALID_PAYMENT_DETAILS.cvc, 
      VALID_PAYMENT_DETAILS.zip
    );
    
    await checkoutPage.completeCheckout();
    await expect(page.getByRole('button', { name: 'Begin Medical Questionnaire' })).toBeVisible({timeout: 10000});
  });
});