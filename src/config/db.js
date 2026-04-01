import mongoose from "mongoose";
import config from "./config.js";
import { Loggers } from "../utils/label.js";

const connectDb = async () => {
  const dbLogger = Loggers.DB;
  try {
    await mongoose.connect(config.mongo_url);
    dbLogger.info("Connection to database successful");

    mongoose.connection.on("error", (err) => {
      dbLogger.error("MongoDb connection error", {
        error: err.message,
      });
    });

    mongoose.connection.on("disconnected", () => {
      dbLogger.warn("mongoDb disconnected");
    });
  } catch (err) {
    dbLogger.error("Failed to connect to database");
    process.exit(1);
  }
};
export default connectDb;
