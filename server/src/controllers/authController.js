import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Submission } from '../models/Submission.js';
import { InterviewResult } from '../models/InterviewResult.js';
import { Interview } from '../models/Interview.js';
import { config } from '../config/env.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
};

export const demoLogin = async (req, res, next) => {
  try {
    const { role = 'candidate' } = req.body || {};
    const selectedRole = ['candidate', 'interviewer', 'admin'].includes(role) ? role : 'candidate';

    if (config.isProduction && !config.allowDemoLogin) {
      return res.status(403).json({
        success: false,
        message: 'Demo login is disabled in production.',
      });
    }

    const user = await User.findOne({ role: selectedRole }).sort({ createdAt: -1 }).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No ${selectedRole} user exists in the database.`,
      });
    }

    const token = generateToken(user);
    const liveStats = await computeLiveUserStats(user._id, user.role);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        title: user.title,
        stats: liveStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedRole = ['candidate', 'interviewer', 'admin'].includes(String(role || '').trim().toLowerCase())
      ? String(role).trim().toLowerCase()
      : 'candidate';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: normalizedRole,
    });

    const token = generateToken(user);

    try {
      const liveStats = await computeLiveUserStats(user._id, user.role);
      // persist in background
      User.findByIdAndUpdate(user._id, { stats: liveStats }).catch(() => {});
      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          title: user.title,
          stats: liveStats,
        },
      });
    } catch (statErr) {
      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          title: user.title,
          stats: user.stats,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Create login session
    try {
      await Session.create({
        userId: user._id,
        type: 'login',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        device: req.headers['user-agent'] || 'Unknown Device',
        location: 'Unknown Location', // In production, use IP geolocation service
        isActive: true,
      });
    } catch (sessionError) {
      console.warn('Failed to create session:', sessionError.message);
    }

    try {
      const liveStats = await computeLiveUserStats(user._id, user.role);
      // persist to DB in background
      User.findByIdAndUpdate(user._id, { stats: liveStats }).catch(() => {});
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          title: user.title,
          stats: liveStats,
        },
      });
    } catch (statErr) {
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          title: user.title,
          stats: user.stats,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

import mongoose from 'mongoose';

export const forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address.',
      });
    }

    const user = await User.findOne({ email });
    let resetToken = '';

    if (user) {
      resetToken = jwt.sign(
        { id: user._id, purpose: 'password-reset' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const resetUrl = `${config.clientUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
      const mailResult = await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        userName: user.name || 'there',
      });

      console.info(`[Password Reset] Reset token generated for ${user.email} (${resetToken.slice(0, 12)}...)`);
      if (mailResult?.previewUrl) {
        console.info(`[Password Reset] Preview URL: ${mailResult.previewUrl}`);
      }
    }

    return res.json({
      success: true,
      resetToken,
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body || {};

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is missing.',
      });
    }

    if (!password || String(password).trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'This password reset link is invalid or has expired.',
      });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(401).json({
        success: false,
        message: 'This password reset link is invalid.',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found for this reset request.',
      });
    }

    user.password = String(password).trim();
    await user.save();

    return res.json({
      success: true,
      message: 'Password reset successful. You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({
        success: true,
        user: req.user,
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: true,
        user: req.user,
      });
    }
    try {
      const liveStats = await computeLiveUserStats(user._id, user.role);
      User.findByIdAndUpdate(user._id, { stats: liveStats }).catch(() => {});
      const payloadUser = { ...user.toObject(), stats: liveStats };
      res.json({ success: true, user: payloadUser });
    } catch (statErr) {
      res.json({ success: true, user });
    }
  } catch (error) {
    res.json({ success: true, user: req.user });
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, title, bio, skills, avatar, location, website, socialLinks } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const updated = { ...req.user, name, title, bio, skills, avatar, location, website, socialLinks };
      return res.json({ success: true, user: updated });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { name, title, bio, skills, avatar, location, website, socialLinks },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: user || req.user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { avatar } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const updated = { ...req.user, avatar };
      return res.json({ success: true, user: updated });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user: user || req.user });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { id, name, email, role, avatar } = req.body;

    let user = await User.findOne({ email });
    
    if (user) {
      const token = generateToken(user);
      try {
        const liveStats = await computeLiveUserStats(user._id, user.role);
        User.findByIdAndUpdate(user._id, { stats: liveStats }).catch(() => {});
        return res.json({
          success: true,
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            title: user.title,
            stats: liveStats,
          },
        });
      } catch (statErr) {
        return res.json({
          success: true,
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            title: user.title,
            stats: user.stats,
          },
        });
      }
    }

    user = await User.create({
      name,
      email,
      password: Math.random().toString(36).slice(-8),
      role: role || 'candidate',
      avatar: avatar || null,
    });

    const token = generateToken(user);
    try {
      const liveStats = await computeLiveUserStats(user._id, user.role);
      User.findByIdAndUpdate(user._id, { stats: liveStats }).catch(() => {});
      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          title: user.title,
          stats: liveStats,
        },
      });
    } catch (statErr) {
      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          title: user.title,
          stats: user.stats,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper: compute live aggregated stats for a user
async function computeLiveUserStats(userId, role = 'candidate') {
  const uid = mongoose.Types.ObjectId(userId);

  // problemsSolved: distinct accepted problemIds from submissions
  const problemsAgg = await Submission.aggregate([
    { $match: { userId: uid, status: 'Accepted' } },
    { $group: { _id: '$problemId' } },
    { $count: 'count' },
  ]).exec();
  const problemsSolved = (problemsAgg[0] && problemsAgg[0].count) || 0;

  // interviewsCompleted and averageScore from InterviewResult
  const matchField = role === 'interviewer' ? { interviewerId: uid } : { candidateId: uid };
  const interviewsAgg = await InterviewResult.aggregate([
    { $match: matchField },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgScore: { $avg: '$overallScore' },
      },
    },
  ]).exec();
  const interviewsCompleted = (interviewsAgg[0] && interviewsAgg[0].count) || 0;
  const averageScore = Math.round((interviewsAgg[0] && interviewsAgg[0].avgScore) || 0);

  // totalHours: sum of durationMinutes for completed interviews (candidate or interviewer)
  const interviewsHoursAgg = await Interview.aggregate([
    { $match: { status: 'completed', $or: [{ candidateId: uid }, { interviewerId: uid }] } },
    { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
  ]).exec();
  const totalMinutes = (interviewsHoursAgg[0] && interviewsHoursAgg[0].totalMinutes) || 0;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // one decimal

  return {
    interviewsCompleted,
    problemsSolved,
    averageScore,
    totalHours,
  };
}
