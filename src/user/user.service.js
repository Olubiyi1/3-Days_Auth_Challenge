import User from "./user.model.js";
import { Loggers } from "../utils/label.js";
import axios from "axios";
import crypto from "crypto";
import {
  comparePassword,
  hashPassword,
  createAccessToken,
  createRefreshToken,
} from "../guards/guards.js";
import AppError from "../errorHandlers/appError.js";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../helpers/email.js";
import config from "../config/config.js";
import jwt from "jsonwebtoken";

const SCOPE = "openid email profile";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const serviceLogs = Loggers.SERVICE;

export const registerUser = async (userData) => {
  const serviceLogs = Loggers.SERVICE;
  const emailSenderLogs = Loggers.EMAILSENDER;

  const allowedRole = ["user", "admin"];

  const { firstName, lastName, email, password, role } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    serviceLogs.warn(`${email} already exists`, { email });
    throw new AppError("Email already exists", 409);
  }

  if (role && !allowedRole.includes(role.toLowerCase())) {
    console.log(role);
    serviceLogs.warn("Invalid role");
    throw new AppError("Invalid role selected", 400);
  }

  // HIBP password check
  const sha1Hash = crypto
    .createHash("sha1")
    .update(password)
    .digest("hex")
    .toUpperCase();
  const prefix = sha1Hash.slice(0, 5);
  const suffix = sha1Hash.slice(5);

  const res = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
  const hashes = res.data.split("\n");
  const matched = hashes.find((line) => line.split(":")[0] === suffix);

  if (matched) {
    serviceLogs.warn("Password has been breached before", { email });
    throw new AppError(
      "Password has been compromised in previous data breach",
      400,
    );
  }

  const hashedPassword = hashPassword(password);

  console.log(password);

  console.log(hashedPassword);

  // email verification
  const rawEmailToken = crypto.randomBytes(32).toString("hex");
  const hashedEmailToken = crypto
    .createHash("sha256")
    .update(rawEmailToken)
    .digest("hex");

  const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    emailVerificationToken: hashedEmailToken,
    emailVerificationExpires,
  });

  serviceLogs.info("User registration successful", { email, role });

  const sendEmail = async () => {
    try {
      await sendVerificationEmail(user.email, rawEmailToken);
      emailSenderLogs.info(`Verifcation email sent to ${email}`);
    } catch (err) {
      emailSenderLogs.error(`Error sending verification mail to ${email}`);
    }
  };
  sendEmail();

  return {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
    message:
      "Registration successful! please check email to verify your account",
  };
};

export const verifyEmail = async (token) => {
  const serviceLogs = Loggers.SERVICE;
  if (!token) throw new AppError("Verification token is required", 400);

  //   Must hash the raw token to match what's stored in DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) throw new AppError("Invalid or expired verification token", 400);
  if (user.isVerified) throw new AppError("Email is already verified", 400);

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  serviceLogs.info(`Email verified successfully for ${user.email}`, {
    email: user.email,
  });
  return { message: "Email verified successfully", user };
};

export const userLogin = async (userData) => {
  const lockTime = 15 * 60 * 1000;
  const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
  const MAX_SESSIONS = 3;

  const serviceLogs = Loggers.SERVICE;
  const { email, password } = userData;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    serviceLogs.warn("Invalid email or password", { email });
    throw new AppError("Invalid email or password", 400);
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    serviceLogs.warn("Account locked. Try again later", { email });
    throw new AppError("Account locked. Try again later", 403);
  }

  if (!user.isVerified)
    throw new AppError("Please verify your email before logging in", 403);

  if (!password || !user.password) {
    user.loginAttempts = user.loginAttempts + 1;
    console.log("User password from DB:", user.password);
    console.log("Password from input:", password);

    if (user.loginAttempts >= config.max_attempts) {
      user.lockUntil = Date.now() + lockTime;
      serviceLogs.warn("Account locked due to max login attempts", { email });
    }

    await user.save();
    serviceLogs.warn("Invalid email or password", { email });
    throw new AppError("Invalid email or password", 400);
  }

  try {
    const isPasswordMatch = await comparePassword(password, user.password);

    console.log("password match?", isPasswordMatch);

    if (!isPasswordMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= config.max_attempts) {
        user.lockUntil = Date.now() + lockTime;
        serviceLogs.warn("Account locked due to max login attempts", { email });
      }

      await user.save();
      serviceLogs.warn("Invalid email or password", { email });
      throw new AppError("Invalid email or password", 400);
    }
  } catch (err) {
    console.error("Error comparing password:", err);
    throw err;
  }

  // reset timeer to 0
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  // create token
  const accessToken = createAccessToken(user);
  const { refreshToken, hashedToken } = createRefreshToken();

  user.refreshTokens = hashedToken;
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const now = new Date();
  const activeSessions = user.refreshTokens.filter((t) => t.expiresAt > now);

  // drop oldest
  if (activeSessions.length >= MAX_SESSIONS) activeSessions.shift();

  user.refreshTokens = [
    ...activeSessions,
    { token: hashedToken, expiresAt: refreshTokenExpiresAt },
  ];
  await user.save();

  serviceLogs.info("User login successful", {
    email: user.email,
    role: user.role,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      email: user.email,
      role: user.role,
    },
  };
};

export const forgotPassword = async (email) => {
  const serviceLogs = Loggers.SERVICE;
  if (!email) {
    throw new AppError("Email is required", 400);
  }
  const user = await User.findOne({ email });

  if (!user) {
    return { message: "We'll send a reset link if that account exists" };
  }
  // generate reset token
  const rawResetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(rawResetToken)
    .digest("hex");

  const resetPasswordExpires = Date.now() + 1 * 15 * 60 * 1000;

  user.resetPasswordToken = hashedResetToken;
  user.resetPasswordExpires = resetPasswordExpires;
  await user.save();

  // sending raw token in email

  await sendResetPasswordEmail(user.email, rawResetToken);

  serviceLogs.info(`Password reset email sent to ${email}`, { email });
  return { message: "If that email exists, a reset link has been sent" };
};

export const resetPassword = async (token, newPassword) => {
  if (!token) throw new AppError("Reset token is required", 400);

  // Hash incoming token to match DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Invalid or expired reset token", 400);
  // Update password and clear reset token
  user.password = hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  serviceLogs.info(`Password reset successful for ${user.email}`, {
    email: user.email,
  });
  return {
    message: "Password reset successful, please login with your new password",
  };
};

export const getGoogleAuthUrl = () => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = new URLSearchParams({
    client_id: config.google_client_id,
    redirect_uri: config.redirect_uri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  return `${rootUrl}?${options.toString()}`;
};

// exchange code for token and decode user info
export const getGoogleUserInfo = async (code) => {
  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: config.google_client_id,
        client_secret: config.google_client_secret,
        redirect_uri: config.redirect_uri,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    const { id_token } = tokenResponse.data;

    // contains email, name ,profile
    return jwt.decode(id_token);
  } catch (err) {
    serviceLogs.error("Failed to exchange Google code for token", {
      error: err.message,
    });
    throw new AppError("Failed to login with Google", 500);
  }
};

// create/find user & generate app tokens
export const googleLoginFlow = async (googleUserInfo) => {
  const { email, name, sub } = googleUserInfo;
  let user = await User.findOne({ email });

  // existing user logins normally
  if (user) {
    const accessToken = createAccessToken(user);
    const { refreshToken, hashedToken } = createRefreshToken();
    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_MS,
    );
    user.refreshTokens = [
      ...(user.refreshTokens || []),
      { token: hashedToken, expiresAt: refreshTokenExpiresAt },
    ];
    await user.save();

    serviceLogs.info("User logged in via Google", { email: user.email });
    const displayName = user.firstName || user.name || user.email;

    return { isNewUser: false, user, accessToken, refreshToken, displayName };
  }

  serviceLogs.info("New Google user detected, profile completion required", {
    email,
  });
  return {
    isNewUser: true,
    googleProfile: { email, name, googleId: sub },
  };
};

export const completeGoogleProfileFlow = async (profileData) => {
  const { email, googleId, firstName, lastName, phone } = profileData;

  // Safety check — prevent duplicate accounts
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const user = await User.create({
    email,
    googleId,
    firstName,
    lastName,
    phone,
    role: "user",
  });

  const accessToken = createAccessToken(user);
  const { refreshToken, hashedToken } = createRefreshToken();
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  user.refreshTokens = [
    ...(user.refreshTokens || []),
    { token: hashedToken, expiresAt: refreshTokenExpiresAt },
  ];
  await user.save();

  serviceLogs.info("New Google user profile completed", { email: user.email });

  return { user, accessToken, refreshToken };
};

export const logout = async (refreshToken) => {
  if (!refreshToken) return;

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const user = await User.findOne({
    "refreshTokens.token": hashedToken,
  });

  if (!user) return;

  const now = new Date()

  user.refreshTokens = user.refreshTokens.filter(
    // removes expired token
    (t) => t.token !== hashedToken && t.expiresAt > now,
  );

  await user.save();
};
