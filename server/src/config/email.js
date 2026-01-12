import nodemailer from 'nodemailer';

// Email configuration
export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.EMAIL_FROM || 'AIDE+ <noreply@aide.plus>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@aide.plus',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@aide.plus',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@aide.plus',
};

// Create transporter
export const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
});

// Alias for backward compatibility
export const EMAIL_CONFIG = emailConfig;

export default transporter;
