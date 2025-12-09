import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'AIDE+ <noreply@aide.plus>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@aide.plus',
};

export default resend;
