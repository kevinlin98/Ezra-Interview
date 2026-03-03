// Account to login to the Ezra Scan booking website, replace with your own test account if needed
export const TEST_USERS = {
  PRIMARY_USER: {
      email: 'KL_ezra_interview_test_account@gmail.com',
      password: 'Hello1122'
  }
};

// Store all type of credit card numbers here
export const STRIPE_TEST_CARDS = {
  VALID_VISA: '4242424242424242',
  GENERIC_DECLINE: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED_CARD: '4000000000000069',
  PROCESSING_ERROR: '4000000000000011',
};

const DEFAULT_PAYMENT_META = {
  exp: '12/30',
  cvc: '123',
  zip: '10001'
};

export const VALID_PAYMENT_DETAILS = {
  card: STRIPE_TEST_CARDS.VALID_VISA,
  ...DEFAULT_PAYMENT_META
};

export const DECLINE_SCENARIOS = [
  {
    description: 'Generic Decline',
    card: STRIPE_TEST_CARDS.GENERIC_DECLINE,
    expectedError: 'Your card has been declined.',
    ...DEFAULT_PAYMENT_META
  },
  {
    description: 'Insufficient Funds',
    card: STRIPE_TEST_CARDS.INSUFFICIENT_FUNDS,
    expectedError: 'Your card has insufficient funds. Try a different card.',
    ...DEFAULT_PAYMENT_META
  },
  {
    description: 'Expired Card',
    card: STRIPE_TEST_CARDS.EXPIRED_CARD,
    expectedError: 'Your card is expired. Try a different card.',
    ...DEFAULT_PAYMENT_META
  }
];