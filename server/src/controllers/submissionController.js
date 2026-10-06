import mongoose from 'mongoose';
import { runCodeService } from '../services/codeRunnerService.js';
import { CodingProblem } from '../models/CodingProblem.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { initialProblems } from '../seeders/problemSeeder.js';

export const runCode = async (req, res, next) => {
  try {
    const { code, language, problemId, testCases } = req.body;

    let evalTestCases = testCases;

    if (!evalTestCases || evalTestCases.length === 0) {
      if (problemId) {
        let problem = null;
        if (mongoose.Types.ObjectId.isValid(problemId)) {
          problem = await CodingProblem.findById(problemId).catch(() => null);
        }
        if (!problem) {
          problem = initialProblems.find((p) => p._id === problemId || p.slug === problemId);
        }
        if (problem) {
          evalTestCases = problem.testCases.filter((tc) => !tc.isHidden);
        }
      }
    }

    if (!evalTestCases || evalTestCases.length === 0) {
      evalTestCases = [
        { input: '2 7 11 15\n9', expectedOutput: '[0,1]' },
        { input: '3 2 4\n6', expectedOutput: '[1,2]' },
      ];
    }

    const result = await runCodeService({
      code,
      language: language || 'javascript',
      testCases: evalTestCases,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const submitCode = async (req, res, next) => {
  try {
    const { code, language, problemId, interviewId } = req.body;

    let problem = null;
    if (mongoose.Types.ObjectId.isValid(problemId)) {
      problem = await CodingProblem.findById(problemId).catch(() => null);
    }
    if (!problem) {
      problem = initialProblems.find((p) => p._id === problemId || p.slug === problemId) || initialProblems[0];
    }

    const result = await runCodeService({
      code,
      language: language || 'javascript',
      testCases: problem.testCases || [],
    });

    let submission = null;
    const userId = req.user?._id || req.user?.id;
    if (mongoose.Types.ObjectId.isValid(userId) && mongoose.Types.ObjectId.isValid(problem._id)) {
      try {
        submission = await Submission.create({
          userId,
          problemId: problem._id,
          interviewId: mongoose.Types.ObjectId.isValid(interviewId) ? interviewId : null,
          code,
          language: language || 'javascript',
          status: result.status,
          passCount: result.passCount,
          totalCount: result.totalCount,
          executionTimeMs: result.executionTimeMs,
          memoryMb: result.memoryMb,
          testResults: result.testResults,
        });

        // Update problemsSolved stat: count unique problems with at least one Accepted submission
        if (result.status === 'Accepted') {
          try {
            const uniqueAccepted = await Submission.find({ userId, status: 'Accepted' }).distinct('problemId');
            await User.findByIdAndUpdate(userId, { 'stats.problemsSolved': uniqueAccepted.length });
          } catch (statErr) {
            console.warn('[submitCode] Stat update failed:', statErr.message);
          }
        }
      } catch (e) {
        submission = null;
      }
    }

    if (!submission) {
      submission = {
        _id: 'sub_' + Date.now(),
        userId: userId || 'c1',
        problemId: problem._id,
        code,
        language: language || 'javascript',
        status: result.status,
        passCount: result.passCount,
        totalCount: result.totalCount,
        executionTimeMs: result.executionTimeMs,
        memoryMb: result.memoryMb,
        testResults: result.testResults,
        createdAt: new Date(),
      };
    }

    res.status(201).json({
      success: true,
      submission,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubmissions = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ success: true, count: 0, data: [] });
    }
    const submissions = await Submission.find({ userId })
      .populate('problemId', 'title difficulty slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.json({ success: true, count: 0, data: [] });
  }
};
