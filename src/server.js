import app from "./app.js";
import connectDb from "./config/db.js";
import config from "./config/config.js";
import { Loggers } from "./utils/label.js";

const dbLogger = Loggers.DB;
const appLogger = Loggers.APP;
let server;
const startServer = async () => {
  try {
    await connectDb();
    dbLogger.info("database connection successful");

    server = app.listen(config.port, () => {
      appLogger.info("App up and running");
    });
  } catch (err) {
    dbLogger.error("failed to start server",err)
    console.error(err);
    
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = () => {
  dbLogger.info("Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close();
    dbLogger.info("Shutdown complete");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("uncaughtException", (error) => {
  dbLogger.error("Uncaught Exception:", error);
  shutdown();
});
process.on("unhandledRejection", (reason) => {
 dbLogger.error("Unhandled Rejection:", reason);
  shutdown();
});

startServer();
