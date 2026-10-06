import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;
let etherealTestAccount = null;

const createEtherealTransporter = async () => {
  if (!etherealTestAccount) {
    try {
      etherealTestAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealTestAccount.user,
          pass: etherealTestAccount.pass,
        },
      });
      console.log('[Mail] Using Ethereal test account for local email delivery.');
      console.log(`[Mail] Preview URL: ${etherealTestAccount.web}`);
    } catch (error) {
      console.warn('[Mail] Failed to create Ethereal test account:', error.message);
      return null;
    }
  }

  return transporter;
};

const getTransporter = async () => {
  if (config.mailerEnabled) {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: config.mailerHost,
        port: config.mailerPort,
        secure: config.mailerSecure,
        auth: {
          user: config.mailerUser,
          pass: config.mailerPass,
        },
      });
    }

    try {
      await transporter.verify();
      return transporter;
    } catch (error) {
      console.warn('[Mail] SMTP verification failed. Falling back to Ethereal test account.', error.message);
      return createEtherealTransporter();
    }
  }

  return createEtherealTransporter();
};

export const sendInterviewInviteEmail = async ({
  to,
  candidateName,
  interviewTitle,
  roomId,
  scheduledAt,
  roomUrl,
  interviewerName,
}) => {
  if (!to) {
    return { sent: false, reason: 'missing-recipient' };
  }

  const activeTransporter = await getTransporter();
  if (!activeTransporter) {
    console.log(`[Mail] Invite email skipped for ${to}. Configure SMTP_* or MAIL_* env vars to enable delivery.`);
    return { sent: false, reason: 'smtp-not-configured' };
  }

  const humanName = candidateName || 'Candidate';
  const interviewName = interviewTitle || 'Technical Interview';
  const scheduled = scheduledAt ? new Date(scheduledAt).toLocaleString() : 'As soon as possible';
  const finalRoomUrl = roomUrl || `${config.clientUrl}/live-room/${roomId}`;

  try {
    const info = await activeTransporter.sendMail({
      from: config.mailerFrom,
      to,
      subject: `Interview invite: ${interviewName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px; color: #1f2937;">Interview Room Invitation</h2>
          <p>Hi ${humanName},</p>
          <p>${interviewerName || 'Your interviewer'} has scheduled a live interview for <strong>${interviewName}</strong>.</p>
          <p><strong>Scheduled:</strong> ${scheduled}</p>
          <p><strong>Room:</strong> ${roomId}</p>
          <p>
            <a href="${finalRoomUrl}" style="display: inline-block; padding: 10px 16px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px;">
              Join Interview Room
            </a>
          </p>
          <p>If the button does not work, use this link:</p>
          <p><a href="${finalRoomUrl}">${finalRoomUrl}</a></p>
          <p>Best,<br />AI Interview Platform</p>
        </div>
      `,
      text: `Hi ${humanName},\n\n${interviewerName || 'Your interviewer'} has scheduled a live interview for ${interviewName}.\nScheduled: ${scheduled}\nRoom: ${roomId}\nJoin: ${finalRoomUrl}\n\nBest,\nAI Interview Platform`,
    });

    if (info?.messageId) {
      console.log(`[Mail] Interview invite email queued for ${to}. Message ID: ${info.messageId}`);
    }

    return { sent: true, to };
  } catch (error) {
    console.error('[Mail] Failed to send interview invite email:', error.message);
    return { sent: false, reason: error.message };
  }
};

export const sendPasswordResetEmail = async ({ to, resetUrl, userName = 'there' }) => {
  if (!to) {
    return { sent: false, reason: 'missing-recipient' };
  }

  const activeTransporter = await getTransporter();
  if (!activeTransporter) {
    console.log(`[Mail] Password reset email skipped for ${to}. Configure SMTP_* or MAIL_* env vars to enable delivery.`);
    return { sent: false, reason: 'smtp-not-configured' };
  }

  const resetLink = resetUrl || `${config.clientUrl}/reset-password`;

  try {
    const info = await activeTransporter.sendMail({
      from: config.mailerFrom,
      to,
      subject: 'Reset your AI Interview Platform password',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px; color: #1f2937;">Password Reset Request</h2>
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password for AI Interview Platform.</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 16px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px;">
              Reset Password
            </a>
          </p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>Best,<br />AI Interview Platform</p>
        </div>
      `,
      text: `Hi ${userName},\n\nWe received a request to reset your password for AI Interview Platform.\nReset here: ${resetLink}\n\nThis link will expire in 1 hour.\n\nBest,\nAI Interview Platform`,
    });

    if (info?.messageId) {
      console.log(`[Mail] Password reset email queued for ${to}. Message ID: ${info.messageId}`);
    }

    return { sent: true, to, previewUrl: nodemailer.getTestMessageUrl(info) || null };
  } catch (error) {
    console.error('[Mail] Failed to send password reset email:', error.message);
    return { sent: false, reason: error.message };
  }
};
