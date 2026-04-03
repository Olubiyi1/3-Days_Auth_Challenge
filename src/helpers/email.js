import { Loggers } from "../utils/label.js";
import { Resend } from "resend";
import config from "../config/config.js";

const emailVerification = new Resend(config.email_verification);

export const sendVerificationEmail = async (to, token) => {
  try {
    const emailSenderLogs = Loggers.EMAILSENDER;

   const verificationUrl = `http://localhost:3600/api/v1/users/verify-email?token=${token}`;

    const html = `
      <h2>Verify Your Email</h2>
      <p>Hi ${to},</p>
      <p>Please confirm your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>Or copy this link into your browser: ${verificationUrl}</p>
      <p>If you did not create an account, ignore this email.</p>
    `;
    const response = await emailVerification.emails.send({
      from: "Verification <noreply@sewsphere.co>",
      to,
      subject: "Verify Your Email",
      html,
    });

    emailSenderLogs.info(`Verification email sent to ${to}`, { to });
    return response;
  } catch (error) {
    emailSenderLogs.error(`Failed to send verification email to ${to}`, {
      error,
      to,
    });
  }
};
export const sendResetPasswordEmail = async (to, token) => {
  try {
    const emailSenderLogs = Loggers.EMAILSENDER;

    const resetUrl = `http://localhost:3600/api/v1/users/reset-password?token=${token}`;

    const html = `
      <h2>Reset Your Password</h2>
      <p>Hi ${to},</p>
      <p>Please reset your password by clicking the link below:</p>
      <a href="${resetUrl}">Reset Password 🔒</a>
      <p>Or copy this link into your browser: ${resetUrl}</p>
      <p>If you did not request a password reset, ignore this email.</p>
    `;

    const response = await emailVerification.emails.send({
      from: "Support <noreply@example.com>",
      to,
      subject: "Reset Your Password 🔒",
      html,
    });

    emailSenderLogs.info(`Reset password email sent to ${to}`, { to });
    return response;
  } catch (error) {
    emailSenderLogs.error(`Failed to send reset password email to ${to}`, {
      error,
      to,
    });
  }
};
