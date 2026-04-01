import { registerUser, verifyEmail } from "./user.service.js";
import { registerUserValidationSchema } from "./user.validation.js";
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

// export const verifyUserController = async (req, res, next) => {
//   try {
//     const { token } = req.query;
//     await verifyEmail(token);

//     return responseHandler.ok(res, {
//       message: "Email verified successfully",
//     });
//   } catch (err) {
//     if (err.isOperational && err.message.includes("already verified")) {
//       return responseHandler.ok(res, { message: "Email was already verified" });
//     }

//     // other operational errors (400s) from true server errors
//     if (err.isOperational) {
//       return responseHandler.badRequest(res, { message: err.message });
//     }

//     controllerLogs.error("Error verifying email", { message: err.message });
//     return responseHandler.serverError(res, { message: err.message });
//   }
// };

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