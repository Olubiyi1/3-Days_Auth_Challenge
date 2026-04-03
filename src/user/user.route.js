import {
  registerUserController,
  userLoginController,
  verifyUserController,
  forgotPasswordContoller,
  resetPasswordController,
  googleCallbackController,
  getGoogleAuthUrlController,
  completeGoogleProfileController,
  logoutUserController
} from "./user.controller.js";
import express from "express";

const userRouter = express.Router();
userRouter.post("/register", registerUserController);
userRouter.get("/verify-email", verifyUserController);
userRouter.post("/login", userLoginController);
userRouter.post("/forgot-password", forgotPasswordContoller);
userRouter.post("/reset-password", resetPasswordController);
userRouter.post("logout",logoutUserController)
// oauth rutes
userRouter.get("/google/url", getGoogleAuthUrlController);
userRouter.get("/google/callback", googleCallbackController);
userRouter.post("/google/complete-profile",completeGoogleProfileController)

export default userRouter;
