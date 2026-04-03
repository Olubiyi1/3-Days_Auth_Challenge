import {
  registerUser,
  userLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "./user.service.js";
import {
  loginUserValidationSchema,
  registerUserValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
} from "./user.validation.js";
import AppError from "../errorHandlers/appError.js";
import responseHandler from "../utils/responseHandler.js";
import { Loggers } from "../utils/label.js";

const controllerLogs = Loggers.DB;
export const registerUserController = async (req, res, next) => {
  try {
    const { error, value } = registerUserValidationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      controllerLogs.warn("User registration validation failed", {
        email: req.body.email,
        errors: messages,
      });
      return next(new AppError(messages.join(", "), 400));
    }

    const result = await registerUser(value);
    controllerLogs.info("User registration Successful", {
      email: result.user.email,
      role: result.user.role,
    });
    return responseHandler.success(
      res,
      result.message,
      { user: result.user },
      201,
    );
  } catch (err) {
    if (err.isOperational) return next(err);
    controllerLogs.error("Unexpected error during user registration", {
      email: req.body.email,
      error: err,
    });
    return next(new AppError("Something went wrong during registration", 500));
  }
};

export const verifyUserController = async (req, res, next) => {
  try {
    const { token } = req.query;
    await verifyEmail(token);

    return res.send(`
      <h1> Email Verified!</h1>
      <p>Your email has been verified successfully. You can now log in.</p>
      <a>Go to Login</a>
    `);
  } catch (err) {
    if (err.isOperational && err.message.includes("already verified")) {
      return res.send(`
        <h1>⚠️ Already Verified</h1>
        <p>Your email was already verified. You can log in.</p>
        <a>Go to Login</a>
      `);
    }
    return res.send(`
      <h1>❌ Verification Failed</h1>
      <p>The link is invalid or has expired. Please request a new one.</p>
    `);
  }
};

export const userLoginController = async (req, res, next) => {
  try {
    const { error, value } = loginUserValidationSchema.validate(req.body);

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      controllerLogs.warn("User login validation failed", {
        email: req.body.email,
        error: messages,
      });
      return next(new AppError(messages.join(", "), 400));
    }

    const result = await userLogin(value);
    controllerLogs.info("User login successful", {
      email: result.user.email,
      role: result.user.role,
    });

    return responseHandler.ok(res, "Login Successful", {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (err) {
    console.log(err);

    controllerLogs.error("Unexpected Error during login", {
      error: err.message,
      stack: err.stack,
    });
    return next(err);
  }
};

export const forgotPasswordContoller = async (req, res, next) => {
  try {
    const { error, value } = forgotPasswordValidationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return next(new AppError(messages.join(", "), 400));
    }

    const result = await forgotPassword(value.email);
    return responseHandler.success(
      res,
      "If that email exists, a reset link has been sent",
    );
  } catch (err) {
    if (err.isOperational) return next(err);
    controllerLogs.error("Forgot password failed", { error: err });
    console.log(err);
    
    return next(new AppError("Something went wrong", 500));
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { error, value } = resetPasswordValidationSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return next(new AppError(messages.join(", "), 400));
    }

    const { token } = req.query;

    const result = await resetPassword(token, value.newPassword);
    return responseHandler.success(res, result.message);
  } catch (err) {
    if (err.isOperational) return next(err);
    controllerLog.error("Reset password failed", { error: err });
    return next(new AppError("Something went wrong", 500));
  }
};
