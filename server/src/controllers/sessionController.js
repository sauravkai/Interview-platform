import mongoose from 'mongoose';
import { Session } from '../models/Session.js';

export const createSession = async (req, res, next) => {
  try {
    // Derive userId from authenticated token if available, otherwise from body (for public logout events)
    const userId = req.user?._id || req.user?.id || req.body?.userId;
    const { type, location, device, userAgent } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // Silently succeed for mock/demo token sessions - don't fail the flow
      return res.status(201).json({ success: true, session: { userId, type, isActive: type === 'login' } });
    }

    // Mark all previous active sessions as inactive on new login
    if (type === 'login') {
      await Session.updateMany({ userId, isActive: true }, { isActive: false });
    }

    const session = await Session.create({
      userId,
      type: type || 'login',
      ipAddress: req.ip || '',
      location: location || '',
      device: device || req.headers['user-agent'] || '',
      userAgent: userAgent || req.headers['user-agent'] || '',
      isActive: type === 'login',
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

export const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ success: true, sessions: [] });
    }

    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const session = await Session.findOneAndUpdate(
      { _id: sessionId, userId },
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or not owned by current user.' });
    }

    res.json({ success: true, message: 'Session revoked successfully.', session });
  } catch (error) {
    next(error);
  }
};
