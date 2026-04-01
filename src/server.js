import app from "./app.js";
import connectDb from "./config/db.js";
import config from "./config/config.js";
import { Loggers } from "./utils/label.js";

const startServer = async () => {
  const dbLogger = Loggers.DB;
  const appLogger = Loggers.APP;
  try {
    
    await connectDb();
    dbLogger.info("database connection successful");

    app.listen(config.port, () => {
      appLogger.info(`App listening on http://localhost:${config.port}`);
    });
  } catch (err) {
    dbLogger.error("error connecting to database");

    process.exit(1);
  }
};

startServer();
