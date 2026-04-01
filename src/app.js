import express from "express";
import helmet from "helmet";
import userRouter from "./user/user.route.js";
import { globalErrorHandler } from "./errorHandlers/globalErrorHandler.js";
import { notFoundHandler } from "./errorHandlers/notFound.js";

const app = express();
app.use(helmet());

app.use(express.json());

app.use("/api/v1/users", userRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
