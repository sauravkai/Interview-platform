import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['login', 'logout'],
      required: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ createdAt: -1 });

export const Session = mongoose.model('Session', sessionSchema);

