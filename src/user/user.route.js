import { registerUserController,userLoginController,verifyUserController,forgotPasswordContoller,resetPasswordController } from "./user.controller.js";
import express from "express"

const userRouter = express.Router()
userRouter.post("/register",registerUserController)
userRouter.get("/verify-email",verifyUserController)
userRouter.post("/login",userLoginController)
userRouter.post("/forgot-password",forgotPasswordContoller)
userRouter.post("/reset-password",resetPasswordController)

export default userRouter;