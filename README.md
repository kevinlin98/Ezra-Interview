# Question 1

## Part 1: Top 15 Prioritized Test Cases for the booking process

Below are the 15 most important test cases for the first three steps of the booking process, ordered from most important to least important.
1. **End-to-End Core Booking Flow (Happy Path):** User selects a valid scan type, chooses an available location/date/time, inputs valid credit card details, and completes the appointment booking, resulting in a confirmed state.
2. **Dynamic Calendar and Time Slot Availability:** Upon selecting a specific clinic, the calendar accurately fetches and displays only dates and specific times (e.g., 7:30 AM, 11:30 AM) that are actually available in the backend scheduling system. Additionally, verify that the text above the time selector displays the current timezone based on the user’s selected office location
3. **Payment Processing Decline Handling:** User submits an invalid or deliberately declined credit card; the system must reject the transaction, display a helpful error message, and ensure no appointment slot is permanently reserved or confirmed.
4. **Appointment Slot Concurrency (Race Condition):** Two unique users simultaneously attempt to book the exact same time slot at the same location; the system successfully processes the first request and correctly denies the second, preventing a double-booking.
5. **Location and Resource Filtering Accuracy:** User filters by a specific State (e.g., NY) in Step 2; the UI correctly limits the available centers to that geographic area, and clicking "Find closest centers to me" accurately sorts by proximity.
6. **Checkout Price Accuracy & Integrity:** The final total displayed on the checkout step must match the base price and additional add-ons of the selected scan from Step 1, minus any successfully applied valid promo codes.
7. **Mobile Testing:** The complete three-step flow—specifically the date/time picker grid and the payment input fields—scales correctly and remains fully functional on standard mobile devices, with no visual overlap or cutoff.
8. **Third-Party Payment Gateway Integration (Affirm):** User selects the "Affirm" payment option, is successfully redirected to the Affirm portal, and upon successful authentication/approval, is redirected back to the app with a confirmed booking.
9. **Persistence Across Navigation (Back Button):** User proceeds to Step 3, then utilizes the "Back" button to return to Step 2 or Step 1; previously selected scan type, location, and time slot remain preserved without requiring the user to start over.
10. **Session/Hold Timeout Recovery:** User selects a time slot but idles on the payment page beyond the maximum reservation hold time; the system gracefully times out, releases the slot back to the public pool, and prompts the user to refresh/sign in to their session.
11. **Form Accessibility & Screen Reader Compliance:** A user relying solely on keyboard navigation and a screen reader can successfully navigate scan selections, pick a time slot, fill out checkout fields, and submit payment without encountering focus traps or missing ARIA labels.
12. **Invalid/Expired Promo Code Handling:** User attempts to apply a fake, expired, or non-applicable promo code; the system rejects it with an explicit warning and the original price remains unchanged.
13. **Save Link Card: Once a user saves a card with Link, their card details are correctly remembered when they return to the checkout page in the future, allowing for easy card selection during checkout.
14. **Payment Idempotency:** Simulate a slow network connection and verify that if a user clicks the "Continue" (submit payment) button multiple times rapidly, the backend relies on a Stripe idempotency key to ensure only one charge is processed and only one appointment is created.
15. **Bank Transfer (ACH) Workflow:** User selects the "Bank" payment method to claim the "$5 back" offer; the system successfully initiates the bank login workflow and applies the proper discount to the total.


## Part 2: Justification for the Top 3 Test Cases
1. **End-to-End Core E-commerce Flow (Happy Path):** This is the core revenue model. If a user cannot select a scan, find a time, and pay the business money, the application completely fails its primary business objective. Testing this flow validates that all individual microservices (inventory/catalog, scheduling, and payment processing) are communicating correctly in an integrated environment.
2. **Dynamic Calendar and Time Slot Availability:** If users cannot accurately see or interact with open time slots, the entire booking pipeline halts. Healthcare scheduling interfaces are notoriously complex, relying on real-time asynchronous data fetching, strict timezone conversions, and dynamic UI states to reflect true availability. Furthermore, if this synchronization fails and a scheduling conflict occurs, someone could get turned away at the clinic, resulting in scheduling chaos for the medical staff and severe customer dissatisfaction. A failure in this component actively prevents willing customers from purchasing a high-ticket service, damages brand reputation, and risks leaving highly expensive MRI machines sitting idle due to phantom un-bookable slots.
3. **Payment Processing Decline Handling:** Handling failures is just as critical as handling success. If a payment declines but the application backend creates the appointment anyway, the business suffers revenue leakage (providing expensive medical services for free) and manual operational overhead to cancel it. Conversely, if a payment fails and the app crashes without telling the user why, you lose a legitimate customer who might have just needed to use a different card.


# Question 2
we can see that the application relies heavily on an encounterId (a UUID like 74648af2-d3a5-4f86-977a-f1b5a9421c71) passed directly in the URL query string within a JSON object. Passing direct object references (like an encounter ID) to the client makes the application an immediate target for an Insecure Direct Object Reference (IDOR) vulnerability if the backend does not rigorously enforce authorization checks on that specific ID. This is a serious security concern and is often at the top of the OWASP API Security Top 10 list.

## Part 1: Integration Test Case (Encounter IDOR Prevention)
### Test Case Name: 
Verify strict tenant isolation against encounterId manipulation during the Medical Questionnaire flow.
### Objective: 
Confirm that a user cannot access, modify, or upload documents (like the Government ID) to an encounterId that belongs to a different user.
### Pre-conditions:
1. Two distinct registered members exist: User A and User B.
2. User A has an active appointment and an assigned encounterId_A.
3. User B has an active appointment and an assigned encounterId_B.
4. User A is authenticated in the system with a valid session token.
### Action: 
1. User A initiates their medical questionnaire.
2. Via an intercepting proxy (like Burp Suite) or automated API script, User A captures the API request that fetches the questionnaire data or submits the safety declarations.
3. User A modifies the payload or URL path, replacing their own encounterId_A with User B's encounterId_B.
4. User A forwards the manipulated request to the server.
### Expected Result: 
The server must validate the ownership of encounterId_B against User A's session token. The server must reject the request with a 403 Forbidden or 404 Not Found. It must not return User B's personal data, nor should it allow User A to save their Government ID or safety answers to User B's record.

## Part 2: HTTP Requests Implementation

Based on the frontend routing, the frontend UI is taking the encounterId from the URL and passing it to a backend API. While I don't know the exact backend routing, it typically looks something like this.

1. Baseline Request (User A fetching their own encounter data - Expected 200 OK):
```
GET /api/v1/encounters/74648af2-d3a5-4f86-977a-f1b5a9421c71/medical-questionnaire HTTP/1.1 
Host: api-staging.ezra.com 
Authorization: Bearer <User_A_Valid_JWT> 
Accept: application/json
```

2. The Exploit Request (User A attempting to fetch User B's encounter data - Expected 403/404) noticed the encounter id is different:
```
GET /api/v1/encounters/4011549f-af3b-45a3-8137-abcdef123456/medical-questionnaire HTTP/1.1
Host: api-staging.ezra.com
Authorization: Bearer <User_A_Valid_JWT>
Accept: application/json
```

3. The Exploit Request for Document Upload (User A attempting to upload their ID to User B's encounter - Expected 403/404):
```
POST /api/v1/encounters/4011549f-af3b-45a3-8137-abcdef123456/documents/government-id HTTP/1.1 
Host: api-staging.ezra.com 
Authorization: Bearer <User_A_Valid_JWT> 
Content-Type: multipart/form-data; boundary=randonBoundaryString

--randonBoundaryString
Content-Disposition: form-data; name="file"; filename="fake_id.jpg" 
Content-Type: image/jpeg

[binary image data of the fake_id]
--randonBoundaryString--
```

## Part 3: Managing Security Quality for Sensitive Endpoints
Given that we know the application uses exposed UUIDs for routing, I would emphasize the following:
* **Attribute-Based Access Control (ABAC):** Standard RBAC (checking if the user is a "patient") is insufficient here. The authorization handler must check attributes: Is the user making the request the documented owner of the encounterId requested? This check must be enforced globally at the API Gateway or middleware level for any route containing /encounters/{id}.
* **Decoupling IDs from the Client Where Possible:** To deeply mitigate this risk, I would challenge the engineering team on why the encounterId needs to be in the URL at all. Ideally, the frontend simply requests /api/v1/members/me/active-encounter and the backend implicitly knows which encounter to serve based only on the secure session cookie/JWT.

### Tradeoffs and Risks of this strategy:
Implementing strict ABAC requires a database lookup (checking the encounter table to verify the user ID) on almost every request, which adds latency.

### Mitigation: 
Caching these authorization mappings (User ID -> List of owned Encounter IDs) in Redis can keep the endpoints fast while maintaining strict security.


# Automation
I have chosen to automate the following two test cases from Part 1:
1. End-to-End Core E-commerce Flow (Happy Path)
2. Payment Processing Decline Handling

### Reasoning:
I selected the End-to-End Happy Path and Payment Processing Decline Handling for automation because they offer the highest ROI and significantly reduce manual overhead. The Happy Path protects the core revenue-generating flow by validating the seamless integration of the UI, backend scheduling, and Stripe. The Payment Decline scenarios were chosen because manually testing various failure codes is incredibly tedious and prone to typing errors; replacing this with a data-driven, parameterized Playwright test allows us to feed multiple Stripe test cards into a single loop that executes in seconds. These scenarios demonstrate a robust framework capable of handling complex UI components, cross-page state persistence, and third-party iframes.





# Ezra Scan Booking Automation Framework explain

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
