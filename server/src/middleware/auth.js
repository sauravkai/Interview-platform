import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

/**
 * Protect routes - ensures valid JWT token exists and attaches authenticated user to req.user.
 * Rejects unauthenticated requests with 401 Unauthorized.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify cryptographic signature of JWT
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        // Fallback to decoded payload in offline dev mode only
        if (!config.isProduction) {
          req.user = {
            _id: decoded.id,
            name: decoded.name || 'User',
            email: decoded.email || '',
            role: decoded.role || 'candidate',
          };
          return next();
        }

        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      const isExpired = error.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        message: isExpired ? 'Session expired. Please log in again.' : 'Not authorized, invalid token.',
      });
    }
  }

  // Missing Authorization Header
  return res.status(401).json({
    success: false,
    message: 'Access denied. No authentication token provided.',
  });
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role || 'guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};
