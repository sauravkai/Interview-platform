import mongoose from 'mongoose';
import { Submission } from '../models/Submission.js';
import { Interview } from '../models/Interview.js';
import { InterviewResult } from '../models/InterviewResult.js';

// Helper to get last N month buckets
function lastNMonths(n = 6) {
  const res = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: `${d.toLocaleString(undefined, { month: 'short' })} ${d.getFullYear().toString().slice(-2)}` });
  }
  return res;
}

export const overview = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.json({ success: true, data: {} });
    const uid = new mongoose.Types.ObjectId(userId);

    const problemsAgg = await Submission.aggregate([
      { $match: { userId: uid, status: 'Accepted' } },
      { $group: { _id: '$problemId' } },
      { $count: 'count' },
    ]).exec();
    const problemsSolved = (problemsAgg[0] && problemsAgg[0].count) || 0;

    const interviewsAgg = await InterviewResult.aggregate([
      { $match: { candidateId: uid } },
      { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: '$overallScore' } } },
    ]).exec();
    const interviewsCompleted = (interviewsAgg[0] && interviewsAgg[0].count) || 0;
    const averageScore = Math.round((interviewsAgg[0] && interviewsAgg[0].avgScore) || 0);

    res.json({ success: true, data: { problemsSolved, interviewsCompleted, averageScore } });
  } catch (error) {
    next(error);
  }
};

export const submissionsActivity = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months || '6', 10);
    const userId = req.user?._id || req.user?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.json({ success: true, data: [] });
    const uid = new mongoose.Types.ObjectId(userId);

    const buckets = lastNMonths(months);
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);

    const agg = await Submission.aggregate([
      { $match: { userId: uid, createdAt: { $gte: start } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            problemId: { $cond: [{ $eq: ['$status', 'Accepted'] }, '$problemId', null] },
          },
          accepted: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0],
            },
          },
          total: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
          },
          accepted: {
            $sum: {
              $cond: [{ $eq: ['$_id.problemId', null] }, 0, 1],
            },
          },
          total: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]).exec();

    const map = new Map();
    agg.forEach((a) => map.set(`${a._id.year}-${a._id.month}`, { accepted: a.accepted, total: a.total }));

    const result = buckets.map((b) => ({ label: b.label, accepted: (map.get(b.key) && map.get(b.key).accepted) || 0, total: (map.get(b.key) && map.get(b.key).total) || 0 }));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const interviewsActivity = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months || '6', 10);
    const userId = req.user?._id || req.user?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.json({ success: true, data: [] });
    const uid = new mongoose.Types.ObjectId(userId);

    const buckets = lastNMonths(months);
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);

    const agg = await Interview.aggregate([
      { $match: { $or: [{ candidateId: uid }, { interviewerId: uid }], createdAt: { $gte: start } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]).exec();

    const statusAgg = await Interview.aggregate([
      { $match: { $or: [{ candidateId: uid }, { interviewerId: uid }] } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec();

    const map = new Map();
    agg.forEach((a) => map.set(`${a._id.year}-${a._id.month}`, a.count));
    const timeline = buckets.map((b) => ({ label: b.label, count: map.get(b.key) || 0 }));
    res.json({ success: true, data: { timeline, status: statusAgg } });
  } catch (error) {
    next(error);
  }
};
