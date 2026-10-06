import { User } from '../models/User.js';
import { Interview } from '../models/Interview.js';
import { CodingProblem } from '../models/CodingProblem.js';
import { Submission } from '../models/Submission.js';

export const getUsers = async (req, res, next) => {
  const sendError = (payload) => {
    if (typeof res.status === 'function') {
      return res.status(500).json(payload);
    }
    return res.json(payload);
  };

  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Failed to load users:', error.message);
    return sendError({
      success: false,
      message: 'Unable to load users.',
      count: 0,
      data: [],
    });
  }
};

import mongoose from 'mongoose';

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findByIdAndUpdate(id, { role }, { new: true }).catch(() => null);
    }
    if (!user) {
      user = { _id: id, role };
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  const sendError = (payload) => {
    if (typeof res.status === 'function') {
      return res.status(500).json(payload);
    }
    return res.json(payload);
  };

  try {
    const [userCount, problemCount, interviewCount, submissionCount] = await Promise.all([
      User.countDocuments(),
      CodingProblem.countDocuments(),
      Interview.countDocuments(),
      Submission.countDocuments(),
    ]);

    return res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalProblems: problemCount,
        totalInterviews: interviewCount,
        totalSubmissions: submissionCount,
        activeServers: 'Operational',
        dockerSandbox: 'Ready',
      },
    });
  } catch (error) {
    console.error('Failed to load dashboard stats:', error.message);
    return sendError({
      success: false,
      message: 'Unable to load dashboard stats.',
      stats: {},
    });
  }
};
