import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlanConfig, buildCheckoutSessionPayload } from './paymentService.js';

test('resolvePlanConfig returns the correct Pro plan configuration in INR', () => {
  const config = resolvePlanConfig('pro');
  assert.equal(config?.id, 'pro');
  assert.equal(config?.price, 1999);
  assert.equal(config?.currency, 'INR');
});

test('resolvePlanConfig normalizes whitespace and casing for plan names', () => {
  assert.equal(resolvePlanConfig(' ENTERPRISE ').id, 'enterprise');
  assert.equal(resolvePlanConfig('  FREE  ').id, 'free');
  assert.equal(resolvePlanConfig('PrO').id, 'pro');
});

test('buildCheckoutSessionPayload rejects custom plans even when casing or spacing is messy', () => {
  assert.throws(() => {
    buildCheckoutSessionPayload({
      plan: ' Enterprise ',
      customerEmail: 'user@example.com',
      successUrl: 'http://localhost:3001/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:3001/pricing',
    });
  }, /not eligible for direct checkout/i);
});

test('buildCheckoutSessionPayload produces a valid Stripe session payload in INR', () => {
  const payload = buildCheckoutSessionPayload({
    plan: 'pro',
    customerEmail: 'user@example.com',
    successUrl: 'http://localhost:3001/checkout/success?session_id={CHECKOUT_SESSION_ID}',
    cancelUrl: 'http://localhost:3001/pricing',
  });

  assert.equal(payload.mode, 'payment');
  assert.equal(payload.line_items[0].price_data.unit_amount, 1999);
  assert.equal(payload.success_url.includes('CHECKOUT_SESSION_ID'), true);
  assert.equal(payload.customer_email, 'user@example.com');
  assert.equal(payload.line_items[0].price_data.currency, 'inr');
});
