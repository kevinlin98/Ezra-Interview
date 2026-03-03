import { Page } from '@playwright/test';

export async function loginUser(page: Page, email: string, password: string) {
    await page.goto('https://myezra-staging.ezra.com/sign-in');
    
    // Dismiss the cookie banner if appears (for ease of testing purposes)
    try {
        const cookieBtn = page.getByRole('button', { name: 'Accept', exact: true });
        await cookieBtn.waitFor({ state: 'visible', timeout: 3000 });
        await cookieBtn.click();
        console.log('Cookie banner dismissed.');
    } catch (error) {
        // If it doesn't appear within 3 seconds, it will silently catch the error and move on.
        console.log('No cookie banner appeared, continuing...');
    }

    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Wait for the dashboard to load by waiting for the "Book a scan" button
    await page.getByRole('button', { name: 'Book a scan' }).waitFor({ state: 'visible' });
}