# Ezra Scan Booking Automation 

This repository contains an automated testing framework for the Ezra scan booking and checkout flow built with **Playwright** and **TypeScript**. It validates the "happy path" (successful booking) and utilizes data-driven testing to validate negative Stripe payment decline scenarios.

## Setup Steps & Execution

### Prerequisites
* **Node.js** (v14 or higher)
* **npm** or **yarn**

### Installation
1. Clone the repository.
2. Install the project dependencies:
   ```bash
   npm install
   ```
3. Install the Playwright browser binaries:
   ```bash
   npx playwright install
   ```

### Running the Tests
* **Run all tests headlessly:**
  ```bash
  npx playwright test
  ```
* **Run tests in UI mode (Highly recommended for debugging):**
  ```bash
  npx playwright test --ui
  ```
* **Run tests with the HTML Reporter:**
  ```bash
  npx playwright test --reporter=html
  npx playwright show-report
  ```



## Framework Architecture & Notes

This framework is built using the **Page Object Model (POM)** design pattern to ensure maximum reusability and maintainability.

* **`/pages`**: Contains the Page Objects (`ScanSelectionPage`, `SchedulingPage`, `CheckoutPage`, etc). All complex DOM interactions, dynamic calendar parsing, and iframe handling are abstracted here.
* **`/utils`**:
  * `test-data.ts`: A centralized repository for all test data, user credentials, and Stripe testing cards. If a different test account is needed, it can be updated here.
  * `helpers.ts`: Contains reusable session functions, such as the `loginUser` method.
* **`/tests`**: The actual spec files (`booking-flow.spec.ts`, `paymentdeclines.spec.ts`). Because of the POM setup, these files read like plain English and contain zero hardcoded locators.
* **`node_modules/`**: Contains all the project's physical dependencies (Playwright, TypeScript, etc.) defined in `package.json`. This folder is created automatically when running `npm install`.
* **`playwright-report/`**: After a test run finishes, Playwright generates a self-contained HTML dashboard here. It provides a visual breakdown of test passes/fails, including video recordings and step-by-step traces.
* **`test-results/`**: This directory acts as a workspace for Playwright during execution. It stores temporary artifacts like screenshots of failed steps and raw trace files used to generate the final report.


## Assumptions

To ensure the tests are highly deterministic and focus strictly on the recurring checkout logic, the following assumptions were made:

1. **Pre-existing Account Status:** It is assumed the account is pre-existing, meaning that a scan has been booked by the user before. Upon login, they will be taken to the landing page and need to click on the "Book a scan" button.
2. **Profile Data is Populated:** The user already has their birthday, gender, and timezone settings updated and does not need to populate those settings in the automated test. Since these properties only need to be populated one time, it doesn't make sense to add it to a recurring automation test.
3. **Pre-defined Location Override:** To avoid needing to know the user's location and making sure the desired test lab shows up regardless of the location this test is run, the test selects a predefined state and office location during scheduling.
4. **Stripe Test Mode:** The staging environment is connected to Stripe's test environment, allowing the use of official Stripe testing cards.


## Trade-offs

1. **Explicit Locator Waits vs. Network Idle:**
   * *Trade-off:* The framework explicitly waits for specific UI elements to render rather than using Playwright's `waitForLoadState('networkidle')`.
   * *Reasoning:* Modern applications utilizing Stripe and analytics rarely reach a true "network idle" state, causing artificial test timeouts. Waiting for explicit DOM mutations is significantly faster and more stable. This makes test development faster for the purpose of this project, but a hardcoded wait time is not recommended in production test code.
2. **Static Test User vs. Dynamic User Creation:**
   * *Trade-off:* We use a hardcoded static test user (`TEST_USERS.PRIMARY_USER`).
   * *Reasoning:* It simplifies the current setup. However, if these tests are run in parallel in the future, multiple workers using the same account might cause session collisions.
3. **UI Navigation vs. API Setup:** We navigate the entire flow (Login -> Dashboard -> Select Scan -> Calendar -> Checkout) via the UI rather than jumping straight to a checkout URL via API seeding when testing payment declines. 
   * *Reasoning:* While making a backend API call to instantly generate a cart would make the test execute faster, traversing the UI ensures we are testing the actual user journey and catching potential frontend routing or React state bugs.



## Scalability

The framework was designed with scaling in mind:
* **Dynamic Calendar Handling:** The `selectFirstAvailableDateAndTime()` method dynamically parses the DOM to skip dates with disabled classes and filters out hidden (`display: none`) time slots. This means the test will never fail due to hardcoded dates or fully-booked days.
* **Data-Driven Testing:** The `DECLINE_SCENARIOS` array allows QA to test numerous Stripe decline codes by simply adding a few lines to `test-data.ts`. The script automatically loops through the array, scaling test coverage infinitely without writing new test blocks.
* **Page Object Model (POM) Architecture:** The strict separation of concerns between tests, page locators, and test data allows the framework to scale seamlessly. This modularity keeps the test directory organized and simplifies future integrations.



## Future Implementations
If given more time, I would implement the following enhancements:

1. **Expand Automation Coverage:** Automate additional high-value test cases identified in Part 1 of the assignment. The focus will be on scenarios that require significant manual effort and repetitive tasks, rather than low-impact edge cases where the return on investment for automation is low.
2. **API Setup/Teardown:** Implement a `global.setup.ts` script that uses Ezra's backend API to dynamically create a brand-new user before the test run, and delete them afterward. This guarantees a clean slate and allows safe parallel test execution.
3. **CI/CD Integration:** Create a GitHub Actions or GitLab CI `.yml` file to run these tests automatically on every Pull Request or on a nightly schedule, ensuring regressions are caught before reaching production.
4. **Slack Alerting:** Integrate a Playwright reporter that pings a QA Slack channel with a summary of the test results (and a link to the HTML report/trace viewer) if the nightly run fails.
5. **Visual Regression Testing:** Implement Playwright's `toHaveScreenshot()` assertions on each stage of the checkout process to ensures UI layout, fonts, and CSS styles remain consistent across deployments to assure a good user experience.
