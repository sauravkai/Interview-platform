import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  testCaseId: { type: String },
  passed: { type: Boolean, required: true },
  input: { type: String },
  expectedOutput: { type: String },
  actualOutput: { type: String },
  error: { type: String, default: '' },
  executionTimeMs: { type: Number, default: 0 },
});

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      default: null,
    },
    code: { type: String, required: true },
    language: {
      type: String,
      enum: ['javascript', 'python', 'cpp', 'java'],
      default: 'javascript',
    },
    status: {
      type: String,
      enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compile Error', 'Runtime Error'],
      required: true,
    },
    passCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    executionTimeMs: { type: Number, default: 0 },
    memoryMb: { type: Number, default: 0 },
    testResults: [testResultSchema],
  },
  { timestamps: true }
);

submissionSchema.index({ userId: 1, status: 1 });
submissionSchema.index({ problemId: 1, createdAt: -1 });
submissionSchema.index({ interviewId: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);

