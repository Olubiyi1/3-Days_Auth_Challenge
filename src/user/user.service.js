import User from "./user.model.js";
import { Loggers } from "../utils/label.js";
import axios from "axios";
import crypto from "crypto";
import { hashPassword} from "../guards/guards.js";
import AppError from "../errorHandlers/appError.js";
import { sendVerificationEmail } from "../helpers/email.js";
// import config from "../config/config.js";

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
