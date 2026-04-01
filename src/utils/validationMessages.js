export const validationMessages = {
  firstname: {
    "any.required": "Please enter firstname",
    "string.empty": "Firstname cannot be empty",
    "string.min": "Firstname must be at least 3 characters long",
    "string.max": "Firstname cannot exceed 50 characters",
  },
  lastname: {
    "any.required": "Please enter lastname",
    "string.empty": "lastname cannot be empty",
    "string.min": "lastname must be at least 3 characters long",
    "string.max": "lastname cannot exceed 50 characters",
  },
  email: {
    "any.required": "Please enter email",
    "string.empty": "Email cannot be empty",
    "string.email": "Please enter a valid email address",
  },
  password: {
    "any.required": "Please enter a password",
    "string.empty": "Password cannot be empty",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password cannot exceed 30 characters",
    "string.pattern.base":
      "Password must include uppercase, lowercase, number, and special character",
  },
  role: {
    "any.required": "Please select a role",
    "string.empty": "Role cannot be empty",
    "any.only": "Selected role is invalid",
  },
  newpassword:{
     "string.min": "Password must be at least 8 characters",
    "string.pattern.base": "Password must contain at least one uppercase, lowercase, number and special character",
    "any.required": "New password is required"
  },
  confirmpassword:{
    "any.only": "Passwords do not match",
    "any.required": "Confirm password is required"
  },
  currentpassword:{
     "any.required": "Current password is required"
  }
};
