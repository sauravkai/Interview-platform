import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { seedProblems } from './seeders/problemSeeder.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupInterviewSocket } from './sockets/interviewSocket.js';

import authRoutes from './routes/authRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import userRoutes from './routes/userRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Trust first proxy if running behind Nginx / Cloud Load Balancer
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// 1. HTTP Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        connectSrc: ["'self'", 'ws:', 'wss:', ...config.allowedOrigins, 'https://generativelanguage.googleapis.com', 'https://api.vapi.ai'],
        workerSrc: ["'self'", 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. HTTP Request Logger
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// 3. High-performance Gzip/Deflate Compression
app.use(compression());

// 4. CORS Setup
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser agents (Postman, curl, internal healthchecks)
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin) || !config.isProduction) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// 5. Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: config.isProduction ? config.allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// 6. Request Body Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 7. Rate Limiting Rules
// General API Limiter (150 requests per 15 minutes per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' },
});

// Sensitive Auth Limiter (15 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

// Code Runner Limiter (20 runs per minute per IP to prevent execution DOS)
const codeRunLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Code execution limit exceeded. Maximum 25 code runs per minute.' },
});

// AI Evaluation Limiter (20 requests per minute per IP)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI evaluation rate limit reached. Please wait a moment.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/submissions/run', codeRunLimiter);
app.use('/api/submissions/submit', codeRunLimiter);
app.use('/api/ai/', aiLimiter);

// 8. Health Check Probe Endpoint
app.get('/api/health', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbState = dbStateMap[mongoose.connection.readyState] || 'unknown';
  const isHealthy = mongoose.connection.readyState === 1 || !config.isProduction;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'AI Interview Platform API',
    version: '1.0.0',
    environment: config.nodeEnv,
    database: {
      status: dbState,
      name: mongoose.connection.name || 'ai-interview-platform',
    },
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: {
      rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(1),
      heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
    },
    timestamp: new Date().toISOString(),
  });
});

// 9. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);

// 10. Static Client Serving (for Monolith / Single-Service Deployments)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (config.serveStatic && fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving production client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        // Never cache index.html so updates are immediate
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        // Cache hashed JS/CSS assets aggressively
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  // Client SPA Route Fallback
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 11. Global Error Handler
app.use(errorHandler);

// 12. Connect DB & Setup Real-time WebSockets
connectDB().then(() => {
  seedProblems();
});
setupInterviewSocket(io);

// 13. Start HTTP Server
server.listen(config.port, () => {
  console.log('===================================================');
  console.log(`🚀 AI Interview Platform Server Running on Port ${config.port}`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
  console.log(`📡 Allowed Origins: ${config.allowedOrigins.join(', ')}`);
  console.log(`🛡️  Security Headers & Rate Limiting: Active`);
  console.log('===================================================');
});

// 14. Graceful Shutdown Handler
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP and WebSocket listeners closed.');
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log('[Database] MongoDB connection terminated cleanly.');
      }
      process.exit(0);
    } catch (err) {
      console.error('[Server Error] Exception during DB teardown:', err);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if connections refuse to terminate
  setTimeout(() => {
    console.error('[Server] Forced shutdown timeout expired. Exiting immediately.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
