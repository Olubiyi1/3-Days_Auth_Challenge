import {
  registerUser,
  userLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getGoogleAuthUrl,
  getGoogleUserInfo,
  googleLoginFlow,
  completeGoogleProfileFlow,
  logout
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
    controllerLogs.error("Reset password failed", { error: err });
    return next(new AppError("Something went wrong", 500));
  }
};

export const getGoogleAuthUrlController = (req, res, next) => {
  try {
    const url = getGoogleAuthUrl();
    return responseHandler.ok(res, "Google OAuth URL", { url });
  } catch (err) {
    return next(err);
  }
};

export const googleCallbackController = async (req, res, next) => {
  const code = req.query.code;

  if (!code) {
    return next(new AppError("No code provided", 400));
  }

  try {
    const googleUserInfo = await getGoogleUserInfo(code);
    const result = await googleLoginFlow(googleUserInfo);

    // New user — prompt frontend to complete profile
    if (result.isNewUser) {
      // frontend uses this to prefill the form
      return responseHandler.ok(res, "Complete your profile to continue", {
        isNewUser: true,
        googleProfile: result.googleProfile,
      });
    }

    // Existing user — normal login response
    const { user, accessToken, refreshToken, displayName } = result;
    return responseHandler.ok(res, `Login Successful! Welcome ${displayName}`, {
      isNewUser: false,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    controllerLogs.error("Error during Google login");
    console.log(err);
    return next(new AppError("Failed to login with Google", 500));
  }
};



export const completeGoogleProfileController = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await completeGoogleProfileFlow(req.body);

    return responseHandler.success(res, `Welcome ${user.firstName}!`, {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.firstName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    controllerLogs.error("Error completing Google profile", { error: err.message });
    return next(err);
  }
};

export const logoutUserController = async (req,res,next)=>{
  try{
    const refreshToken = req.cookies.refreshToken;

     await logout(refreshToken);

     
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return responseHandler.success(res, "Logged out successfully", null, 200);
  }
  catch (err) {
    controllerLogs.error("Unexpected error during logout", {
      userId: req.user?.id,
      error: err,
    });
    return next(err);
  }
}
