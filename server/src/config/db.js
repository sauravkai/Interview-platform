import mongoose from 'mongoose';
import { config } from './env.js';

const connectionOptions = {
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
};

// Event listeners for database connection health
mongoose.connection.on('connected', () => {
  console.log('[Database] MongoDB connection established successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error]:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected successfully.');
});

/**
 * Connect to MongoDB with exponential backoff retry logic.
 */
export const connectDB = async (retries = 5, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(config.mongoUri, connectionOptions);
      console.log(`[Database] Connected to MongoDB host: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`[Database Warning] Connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`[Database] Retrying in ${delayMs / 1000}s...`);
        await new Promise((res) => setTimeout(res, delayMs));
        delayMs *= 1.5; // Exponential backoff
      } else {
        if (config.isProduction) {
          console.error('[Database FATAL] Failed to connect to MongoDB in production after maximum retries.');
          // In production, we don't proceed with broken database
          process.exit(1);
        } else {
          console.warn('[Database Dev Mode] Running with offline fallback mode.');
        }
      }
    }
  }
};
