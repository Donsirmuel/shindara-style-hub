/**
 * Application configuration
 * Toggle between mock data and real API
 */
export const config = {
  useMocks: true, // Set to false when connecting to real API
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.example.com',
} as const;
