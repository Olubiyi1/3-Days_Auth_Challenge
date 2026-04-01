import { validationMessages } from "../utils/validationMessages.js";
import Joi from "joi";

export const registerUserValidationSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages(validationMessages.firstname),

  lastName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages(validationMessages.lastname),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages(validationMessages.email),

  password: Joi.string()
    .trim()
    .min(8)
    .max(30)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$",
      ),
    )
    .required()
    .messages(validationMessages.password),

  role: Joi.string()
    .valid("user", "admin")
    .required()
    .messages(validationMessages.role),
});
export const loginUserValidationSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages(validationMessages.email),

  password: Joi.string()
    .trim()
    .min(8)
    .max(30)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$",
      ),
    )
    .required()
    .messages(validationMessages.password),
});
export const forgotPasswordValidationSchema = Joi.object({
  email: Joi.string().email().required().messages(validationMessages.email),
});
export const resetPasswordValidationSchema = Joi.object({
  newPassword: Joi.string()
    .min(8)
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
    .messages(validationMessages.newpassword),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages(validationMessages.confirmpassword),
});
export const resendVerificationValidationSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages(validationMessages.email),
});
export const changePasswordValidationSchema = Joi.object({
  currentPassword: Joi.string().required().messages(validationMessages.currentpassword),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
    .required()
    .messages(validationMessages.newpassword),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages(validationMessages.confirmpassword),
});


