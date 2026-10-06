import { config } from '../config/env.js';

export const planCatalog = {
  free: {
    id: 'free',
    name: 'Free Practice',
    description: 'Casual / Beginners',
    price: 0,
    currency: 'INR',
    interval: 'month',
  },
  pro: {
    id: 'pro',
    name: 'Pro Evaluator',
    description: 'Active Job Seekers',
    price: 1999,
    currency: 'INR',
    interval: 'month',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Team / Enterprise',
    description: 'Bootcamps & Recruiters',
    price: 0,
    currency: 'INR',
    interval: 'seat',
    custom: true,
  },
};

export const resolvePlanConfig = (plan = 'pro') => {
  const key = String(plan ?? 'pro').trim().toLowerCase();
  return planCatalog[key] || planCatalog.pro;
};

export const buildCheckoutSessionPayload = ({
  plan = 'pro',
  customerEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}) => {
  const selectedPlan = resolvePlanConfig(plan);

  if (!selectedPlan || selectedPlan.price <= 0 || selectedPlan.custom) {
    throw new Error('This plan is not eligible for direct checkout.');
  }

  const normalizedSuccessUrl = successUrl || `${config.clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const normalizedCancelUrl = cancelUrl || `${config.clientUrl}/pricing`;

  return {
    mode: 'payment',
    customer_email: customerEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: selectedPlan.currency.toLowerCase(),
          product_data: {
            name: selectedPlan.name,
            description: selectedPlan.description,
          },
          unit_amount: selectedPlan.price,
        },
        quantity: 1,
      },
    ],
    success_url: normalizedSuccessUrl,
    cancel_url: normalizedCancelUrl,
    metadata: {
      ...metadata,
      plan: selectedPlan.id,
    },
  };
};

export const createCheckoutSession = async ({
  plan = 'pro',
  customerEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}) => {
  const selectedPlan = resolvePlanConfig(plan);

  if (!selectedPlan || selectedPlan.price <= 0 || selectedPlan.custom) {
    throw new Error('This plan is not eligible for direct checkout.');
  }

  if (config.razorpayEnabled) {
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });

    const amountInPaise = Math.round(selectedPlan.price * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `${selectedPlan.id}-${Date.now()}`,
      notes: {
        ...metadata,
        plan: selectedPlan.id,
      },
    });

    return {
      fallback: false,
      demoMode: false,
      provider: 'razorpay',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: config.razorpayKeyId,
      plan: selectedPlan.id,
      qrEnabled: true,
      redirectUrl: successUrl || `${config.clientUrl}/checkout?status=success`,
    };
  }

  if (!config.stripeSecretKey || !config.stripeEnabled) {
    return {
      fallback: true,
      demoMode: true,
      provider: 'demo',
      message: 'Razorpay is not configured. Demo checkout is enabled for local development.',
      redirectUrl: successUrl || `${config.clientUrl}/checkout?status=success`,
      plan: selectedPlan.id,
    };
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-06-20',
  });

  const session = await stripe.checkout.sessions.create({
    ...buildCheckoutSessionPayload({
      plan,
      customerEmail,
      successUrl,
      cancelUrl,
      metadata,
    }),
  });

  return {
    fallback: false,
    demoMode: false,
    provider: 'stripe',
    sessionId: session.id,
    redirectUrl: session.url,
    plan: selectedPlan.id,
  };
};
