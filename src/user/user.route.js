import { registerUserController,verifyUserController } from "./user.controller.js";
import express from "express"

const userRouter = express.Router()
userRouter.post("/register",registerUserController)
userRouter.get("/verify-email",verifyUserController)

export default userRouter;