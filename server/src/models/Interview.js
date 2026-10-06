import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['one-to-one', 'ai-mock'],
      required: true,
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      default: null,
    },
    problems: {
      type: [String],
      default: [],
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    interviewerNotes: { type: String, default: '' },
    transcript: [
      {
        speaker: { type: String, enum: ['Interviewer', 'AI', 'Candidate'] },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

interviewSchema.index({ candidateId: 1, status: 1 });
interviewSchema.index({ interviewerId: 1, status: 1 });
interviewSchema.index({ scheduledAt: -1 });

export const Interview = mongoose.model('Interview', interviewSchema);

