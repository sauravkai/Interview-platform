import { Interview } from '../models/Interview.js';
import { InterviewResult } from '../models/InterviewResult.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { generateFinalReport } from '../services/aiService.js';
import { sendInterviewInviteEmail } from '../services/emailService.js';
import { config } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

const inMemoryInterviews = [];

export const createInterview = async (req, res, next) => {
  try {
    const {
      title,
      type,
      candidateName,
      candidateEmail,
      role,
      problemTitle,
      problemId,
      problems,
      scheduledAt,
      durationMinutes,
      sendViaEmail,
    } = req.body;
    const roomId = `room-${uuidv4().substring(0, 8)}`;

    const newInterview = {
      _id: 'int_' + Date.now(),
      title: title || 'Technical Evaluation Round',
      type: type || 'one-to-one',
      interviewerId: req.user?._id || 'i1',
      candidateName: candidateName || (candidateEmail ? candidateEmail.split('@')[0] : 'Candidate'),
      candidateEmail: candidateEmail || 'candidate@example.com',
      role: role || 'Software Developer',
      problemTitle: problemTitle || 'Two Sum',
      problems: problems || [],
      roomId,
      status: 'Scheduled',
      time: scheduledAt ? new Date(scheduledAt).toLocaleString() : 'Scheduled',
      scheduledAt: scheduledAt || new Date().toISOString(),
      durationMinutes: durationMinutes || 45,
    };

    try {
      const dbRecord = await Interview.create({
        title: newInterview.title,
        type: newInterview.type,
        interviewerId: req.user?._id && req.user._id !== 'i1' ? req.user._id : null,
        candidateId: req.user?._id || '661a00000000000000000001',
        roomId,
        scheduledAt: newInterview.scheduledAt,
        durationMinutes: newInterview.durationMinutes,
        problems: newInterview.problems,
      });
      newInterview._id = dbRecord._id.toString();
    } catch (dbErr) {
      console.warn('[Interview Controller] DB save fallback to memory store.');
    }

    if (sendViaEmail === true && candidateEmail) {
      const emailResult = await sendInterviewInviteEmail({
        to: candidateEmail,
        candidateName: newInterview.candidateName,
        interviewTitle: newInterview.title,
        roomId: newInterview.roomId,
        scheduledAt: newInterview.scheduledAt,
        roomUrl: `${config.clientUrl}/live-room/${newInterview.roomId}`,
        interviewerName: req.user?.name || 'Your interviewer',
      });

      if (emailResult.sent) {
        console.log(`[Email] Invitation sent to ${candidateEmail} for room ${newInterview.roomId}`);
      } else {
        console.warn(`[Email] Invitation not delivered to ${candidateEmail}: ${emailResult.reason || 'unknown'}`);
      }
    }

    inMemoryInterviews.unshift(newInterview);
    res.status(201).json({ success: true, data: newInterview });
  } catch (error) {
    next(error);
  }
};

export const getUserInterviews = async (req, res, next) => {
  try {
    let dbInterviews = [];
    try {
      const userId = req.user?._id || req.user?.id;
      dbInterviews = await Interview.find({
        $or: [{ candidateId: userId }, { interviewerId: userId }],
      })
        .populate('problemId', 'title slug difficulty')
        .populate('candidateId', 'name email avatar')
        .populate('interviewerId', 'name email avatar')
        .sort({ scheduledAt: -1 });
    } catch (e) {
      dbInterviews = [];
    }

    const combined = [...inMemoryInterviews, ...dbInterviews];
    const unique = Array.from(
      new Map(combined.map((item) => [item.roomId || item._id?.toString(), item])).values()
    );

    return res.json({ success: true, count: unique.length, data: unique });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load interviews.', count: 0, data: [] });
  }
};

export const getUserInterviewReports = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    let dbResults = [];

    if (userId) {
      const query = InterviewResult.find({
        $or: [{ candidateId: userId }, { interviewerId: userId }],
      });

      const resolvedQuery = query && typeof query.then === 'function' ? await query : query;

      if (resolvedQuery && typeof resolvedQuery.populate === 'function') {
        let populated = await resolvedQuery.populate(
          'interviewId',
          'title candidateName candidateEmail role roomId scheduledAt durationMinutes problems'
        );

        if (populated && typeof populated.sort === 'function' && !Array.isArray(populated)) {
          populated = await populated.sort({ createdAt: -1 });
        }

        dbResults = Array.isArray(populated) ? populated : [];
      } else if (Array.isArray(resolvedQuery)) {
        dbResults = resolvedQuery;
      }
    }

    const memoryResults = Array.from(inMemoryResults.values()).filter((result) => {
      if (!result) return false;
      const matchUser = String(result.candidateId || '') === String(userId) || String(result.interviewerId || '') === String(userId);
      return matchUser || (result.interviewId && String(result.interviewId) === String(userId));
    });

    const normalizedResults = [...dbResults, ...memoryResults].reduce((acc, result) => {
      const rawResult = result && result.toObject ? result.toObject() : result;
      if (!rawResult || !rawResult._id) return acc;
      const interviewMeta = rawResult.interviewId && typeof rawResult.interviewId === 'object' ? rawResult.interviewId : null;
      const questionMetrics = Array.isArray(rawResult.questionMetrics) ? rawResult.questionMetrics : [];
      const chatMessages = Array.isArray(rawResult.chatMessages) ? rawResult.chatMessages : [];
      const transcriptHistory = Array.isArray(rawResult.transcriptHistory) ? rawResult.transcriptHistory : [];
      const notes = typeof rawResult.interviewerNotes === 'string' ? rawResult.interviewerNotes : '';
      const durationSeconds = Number(rawResult.totalSessionTime || 0);
      const durationLabel = durationSeconds > 0 ? `${Math.max(1, Math.round(durationSeconds / 60))} min` : (interviewMeta?.durationMinutes ? `${interviewMeta.durationMinutes} min` : 'N/A');
      const overallScore = Number(rawResult.overallScore ?? 0);
      const derivedTechnical = Number(rawResult.technicalScore ?? (questionMetrics.length ? questionMetrics.reduce((sum, item) => sum + Number(item.score || 0), 0) / questionMetrics.length : 0));
      const derivedCommunication = Number(rawResult.communicationScore ?? derivedTechnical);
      const derivedProblem = Number(rawResult.problemSolvingScore ?? derivedTechnical);
      const derivedCode = Number(rawResult.codeQualityScore ?? derivedTechnical);

      const item = {
        ...rawResult,
        _id: rawResult._id?.toString ? rawResult._id.toString() : rawResult._id,
        title: interviewMeta?.title || rawResult.title || rawResult.topic || 'Interview Report',
        role: interviewMeta?.role || rawResult.role || 'Software Engineer',
        candidateName: interviewMeta?.candidateName || rawResult.candidateName || 'Candidate',
        candidateEmail: interviewMeta?.candidateEmail || rawResult.candidateEmail || '',
        roomId: interviewMeta?.roomId || rawResult.roomId || 'room-unknown',
        sessionId: interviewMeta?.roomId || rawResult.sessionId || rawResult.interviewId || 'session',
        status: 'completed',
        problemTitle: interviewMeta?.problemTitle || rawResult.problemTitle || questionMetrics[0]?.question || 'Technical Round',
        totalQuestions: questionMetrics.length || rawResult.totalQuestions || 0,
        questionsAsked: questionMetrics.length || rawResult.questionsAsked || 0,
        overallScore,
        duration: durationLabel,
        completedDate: rawResult.updatedAt ? new Date(rawResult.updatedAt).toLocaleDateString() : (interviewMeta?.scheduledAt ? new Date(interviewMeta.scheduledAt).toLocaleDateString() : 'Recently'),
        interviewDate: interviewMeta?.scheduledAt || rawResult.createdAt || new Date().toISOString(),
        technicalSkills: rawResult.technicalSkills || {
          technical: derivedTechnical,
          communication: derivedCommunication,
          problemSolving: derivedProblem,
          codeQuality: derivedCode,
        },
        feedback: typeof rawResult.feedback === 'object' && rawResult.feedback !== null
          ? rawResult.feedback
          : {
              rating: Number((overallScore / 20 || 0)).toFixed(1),
              strengths: Array.isArray(rawResult.strengths) && rawResult.strengths.length ? rawResult.strengths : ['Strong technical reasoning', 'Clear communication'],
              improvements: Array.isArray(rawResult.improvements) && rawResult.improvements.length ? rawResult.improvements : ['Continue practicing system design tradeoffs'],
            },
        questionMetrics,
        chatMessages: chatMessages.length ? chatMessages : transcriptHistory,
        transcriptHistory: transcriptHistory.length ? transcriptHistory : chatMessages,
        interviewerNotes: notes,
        reportSummary: notes || (chatMessages.length ? chatMessages.map((message) => message?.text || message?.message || '').filter(Boolean).slice(0, 2).join(' • ') : 'Interview completed successfully.'),
      };

      if (!acc.some((existing) => String(existing._id) === String(item._id))) {
        acc.push(item);
      }
      return acc;
    }, []);

    if (typeof res.json === 'function') {
      return res.json({ success: true, count: normalizedResults.length, data: normalizedResults });
    }
    return { success: true, count: normalizedResults.length, data: normalizedResults };
  } catch (error) {
    if (typeof res.status === 'function') {
      return res.status(500).json({ success: false, message: 'Unable to load saved interview reports.', count: 0, data: [] });
    }
    return { success: false, message: 'Unable to load saved interview reports.', count: 0, data: [] };
  }
};

export const getInterviewByRoomId = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    let interview = null;

    try {
      interview = await Interview.findOne({ roomId })
        .populate('problemId')
        .populate('candidateId', 'name email avatar title')
        .populate('interviewerId', 'name email avatar title');
    } catch (e) {
      interview = null;
    }

    if (!interview) {
      interview = inMemoryInterviews.find((i) => i.roomId === roomId);
    }

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found.',
      });
    }

    res.json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

import mongoose from 'mongoose';

const inMemoryResults = new Map();

export const endInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      sessionScores = [],
      transcriptHistory = [],
      topic = 'React.js',
      interviewTitle = topic || 'Technical Evaluation Round',
      questionMetrics = [],
      chatMessages = [],
      interviewerNotes = '',
      totalSessionTime = 0,
    } = req.body || {};
    let interview = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      interview = await Interview.findById(id).catch(() => null);
    }

    if (!interview) {
      interview = await Interview.findOne({ roomId: id }).catch(() => null);
    }

    if (!interview) {
      interview = inMemoryInterviews.find((i) => i.roomId === id || i._id === id);
    }

    if (interview && mongoose.Types.ObjectId.isValid(interview._id)) {
      interview.status = 'completed';
      interview.endedAt = new Date();
      interview.title = interview.title || interviewTitle || 'Technical Evaluation Round';
      if (typeof interviewerNotes === 'string' && interviewerNotes.trim()) {
        interview.interviewerNotes = interviewerNotes;
      }
      await interview.save().catch(() => {});
    } else if (interview) {
      interview.status = 'completed';
      interview.title = interview.title || interviewTitle || 'Technical Evaluation Round';
      if (typeof interviewerNotes === 'string' && interviewerNotes.trim()) {
        interview.interviewerNotes = interviewerNotes;
      }
    }

    let submissions = [];
    if (mongoose.Types.ObjectId.isValid(id)) {
      submissions = await Submission.find({ interviewId: id }).catch(() => []);
    }

    const reportData = await generateFinalReport({
      interview: interview || { type: 'one-to-one' },
      submissions,
      sessionScores: sessionScores || [],
      transcriptHistory: transcriptHistory || [],
      topic: topic || 'React.js',
      questionMetrics: questionMetrics || [],
      chatMessages: chatMessages || [],
      interviewerNotes: interviewerNotes || interview?.interviewerNotes || '',
      totalSessionTime: totalSessionTime || 0,
    });

    let result = null;
    if (mongoose.Types.ObjectId.isValid(id) && mongoose.Types.ObjectId.isValid(req.user?._id)) {
      try {
        result = await InterviewResult.create({
          interviewId: id,
          candidateId: interview ? interview.candidateId : req.user._id,
          interviewerId: interview ? interview.interviewerId : null,
          topic: interviewTitle || topic || 'React.js',
          title: interviewTitle || interview?.title || topic || 'Technical Evaluation Round',
          interviewerNotes: interviewerNotes || interview?.interviewerNotes || '',
          questionMetrics: reportData.questionMetrics || [],
          transcriptHistory: reportData.transcriptHistory || [],
          chatMessages: reportData.chatMessages || [],
          totalSessionTime: reportData.totalSessionTime || 0,
          avgTimePerQuestion: reportData.avgTimePerQuestion || 0,
          difficultyBreakdown: reportData.difficultyBreakdown || { easy: [], medium: [], hard: [] },
          avgScoreByDifficulty: reportData.avgScoreByDifficulty || { easy: 0, medium: 0, hard: 0 },
          ...reportData,
        });
      } catch (e) {
        result = null;
      }
    }

    if (!result) {
      result = {
        _id: 'res_' + Date.now(),
        interviewId: id,
        candidateId: req.user?._id || 'c1',
        topic: interviewTitle || topic || 'React.js',
        title: interviewTitle || interview?.title || topic || 'Technical Evaluation Round',
        interviewerNotes: interviewerNotes || interview?.interviewerNotes || '',
        questionMetrics: reportData.questionMetrics || [],
        transcriptHistory: reportData.transcriptHistory || [],
        chatMessages: reportData.chatMessages || [],
        totalSessionTime: reportData.totalSessionTime || 0,
        avgTimePerQuestion: reportData.avgTimePerQuestion || 0,
        difficultyBreakdown: reportData.difficultyBreakdown || { easy: [], medium: [], hard: [] },
        avgScoreByDifficulty: reportData.avgScoreByDifficulty || { easy: 0, medium: 0, hard: 0 },
        ...reportData,
      };
    }

    inMemoryResults.set(id, result);
    inMemoryResults.set(result._id, result);

    // Update interviewsCompleted stat for the user
    try {
      const actorId = req.user?._id || req.user?.id;
      if (mongoose.Types.ObjectId.isValid(actorId)) {
        const completedCount = await Interview.countDocuments({
          $or: [{ candidateId: actorId }, { interviewerId: actorId }],
          status: 'completed',
        });
        await User.findByIdAndUpdate(actorId, { 'stats.interviewsCompleted': completedCount });
      }
    } catch (statErr) {
      console.warn('[endInterview] Stat update failed:', statErr.message);
    }

    res.json({
      success: true,
      message: 'Interview completed and AI evaluation scorecard generated successfully.',
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewReport = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    let result = null;

    if (inMemoryResults.has(interviewId)) {
      result = inMemoryResults.get(interviewId);
    } else if (mongoose.Types.ObjectId.isValid(interviewId)) {
      try {
        result = await InterviewResult.findOne({ interviewId }).populate('interviewId');
      } catch (e) {
        result = null;
      }
    }

    if (!result) {
      const reportData = await generateFinalReport({
        interview: { type: 'one-to-one' },
        submissions: [],
      });
      result = {
        _id: interviewId || 'res_demo',
        interviewId,
        candidateId: req.user?._id || 'c1',
        ...reportData,
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
