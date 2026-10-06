import express from 'express';
import { createCheckoutSession } from '../services/paymentService.js';

const router = express.Router();

router.post('/checkout', async (req, res, next) => {
  try {
    const { plan = 'pro', customerEmail, successUrl, cancelUrl } = req.body || {};

    const result = await createCheckoutSession({
      plan,
      customerEmail,
      successUrl,
      cancelUrl,
      metadata: {
        source: 'landing-page',
      },
    });

    if (result.fallback) {
      return res.json({
        success: true,
        demoMode: true,
        message: result.message,
        redirectUrl: result.redirectUrl,
      });
    }

    return res.json({
      success: true,
      demoMode: false,
      redirectUrl: result.redirectUrl,
      sessionId: result.sessionId,
      plan: result.plan,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
