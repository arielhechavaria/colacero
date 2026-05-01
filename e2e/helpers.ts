/**
 * Shared helpers for E2E tests.
 */

export const PANEL_URL   = 'http://localhost:3002'
export const CATALOG_URL = 'http://localhost:3001'
export const API_URL     = 'http://localhost:3000'

export const OWNER_EMAIL    = 'ariel@elfogon.cu'
export const OWNER_PASSWORD = 'test1234'
export const TEST_PHONE     = '+5370000001'
export const BUSINESS_SLUG  = 'el-fogon'

/**
 * A fake customer JWT returned by the OTP mock route.
 * In E2E we intercept verify-otp and return this token so we never
 * depend on a real OTP delivery mechanism.
 *
 * The panel login uses real credentials — no mock needed there.
 */
export const FAKE_CUSTOMER_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0LWN1c3RvbWVyLTAxIiwicGhvbmUiOiIrNTM3MDAwMDAwMSIsImlhdCI6MTcwMDAwMDAwMH0.' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

export const FAKE_CUSTOMER = {
  id:    'test-customer-01',
  phone: TEST_PHONE,
}
