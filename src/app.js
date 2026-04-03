import express from "express";
import helmet from "helmet";
import userRouter from "./user/user.route.js";
import { globalErrorHandler } from "./errorHandlers/globalErrorHandler.js";
import { notFoundHandler } from "./errorHandlers/notFound.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(helmet());

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
