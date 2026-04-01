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
