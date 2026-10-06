import mongoose from 'mongoose';

const interviewResultSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    topic: { type: String, default: 'React.js' },
    technicalScore: { type: Number, min: 0, max: 100, default: 0 },
    communicationScore: { type: Number, min: 0, max: 100, default: 0 },
    problemSolvingScore: { type: Number, min: 0, max: 100, default: 0 },
    codeQualityScore: { type: Number, min: 0, max: 100, default: 0 },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    hiringRecommendation: {
      type: String,
      enum: ['Strong Hire', 'Hire', 'Weak Hire', 'Reject'],
      default: 'Hire',
    },
    aiSummary: { type: String, default: '' },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    feedback: { type: String, default: '' },
    interviewerNotes: { type: String, default: '' },
    questionMetrics: [{ type: mongoose.Schema.Types.Mixed, default: [] }],
    transcriptHistory: [{ type: mongoose.Schema.Types.Mixed, default: [] }],
    chatMessages: [{ type: mongoose.Schema.Types.Mixed, default: [] }],
    totalSessionTime: { type: Number, default: 0 },
    avgTimePerQuestion: { type: Number, default: 0 },
    difficultyBreakdown: { type: mongoose.Schema.Types.Mixed, default: { easy: [], medium: [], hard: [] } },
    avgScoreByDifficulty: { type: mongoose.Schema.Types.Mixed, default: { easy: 0, medium: 0, hard: 0 } },
  },
  { timestamps: true }
);

export const InterviewResult = mongoose.model('InterviewResult', interviewResultSchema);
