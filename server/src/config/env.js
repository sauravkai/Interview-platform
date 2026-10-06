import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Production security check: ensure default development JWT secret is never used in production
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'ai_interview_platform_super_secret_jwt_key_2026');
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'ai_interview_platform_super_secret_jwt_key_2026')) {
  console.error('[SECURITY FATAL] In production mode, JWT_SECRET must be explicitly configured and not use the default dev secret!');
  process.exit(1);
}

// Parse allowed CORS origins
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3001';
const allowedOrigins = rawAllowedOrigins.split(',').map((o) => o.trim()).filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ai-interview-platform',
  jwtSecret: jwtSecret || 'fallback_secret_for_dev_mode_only',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  nodeEnv,
  isProduction,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  vapiApiKey: process.env.VAPI_API_KEY || '',
  vapiAssistantId: process.env.VAPI_ASSISTANT_ID || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  mailerHost: process.env.SMTP_HOST || process.env.MAIL_HOST || '',
  mailerPort: parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587', 10),
  mailerSecure: process.env.SMTP_SECURE === 'true' || process.env.MAIL_SECURE === 'true',
  mailerUser: process.env.SMTP_USER || process.env.MAIL_USER || '',
  mailerPass: process.env.SMTP_PASS || process.env.MAIL_PASS || '',
  mailerFrom: process.env.MAIL_FROM || process.env.SMTP_FROM || 'AI Interview Platform <noreply@localhost>',
  mailerEnabled: Boolean((process.env.SMTP_HOST || process.env.MAIL_HOST) && (process.env.SMTP_USER || process.env.MAIL_USER) && (process.env.SMTP_PASS || process.env.MAIL_PASS)),
  clientUrl: process.env.CLIENT_URL || (allowedOrigins[0] || 'http://localhost:3001'),
  allowedOrigins,
  allowDemoLogin: process.env.ALLOW_DEMO_LOGIN === 'true' || !isProduction,
  serveStatic: process.env.SERVE_STATIC === 'true' || isProduction,
  maxCodeLength: parseInt(process.env.MAX_CODE_LENGTH || '65536', 10), // 64KB max submission
};

