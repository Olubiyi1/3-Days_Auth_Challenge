import { logger } from "./logger.js";

export const createLabel = (labelName) => {
  return {
    info: (msg, meta) => logger.info(msg, { label: labelName, ...meta }),
    error: (msg, meta) => logger.error(msg, { label: labelName, ...meta }),
    warn: (msg, meta) => logger.warn(msg, { label: labelName, ...meta }),
    debug: (msg, meta) => logger.debug(msg, { label: labelName, ...meta }),
  };
};

export const Loggers ={
    DB:createLabel("DB"),
    SERVICE:createLabel("SERVICE"),
    CONTROLLER:createLabel("CONTROLLER"),
    APP:createLabel("APP"),
    SERVER:createLabel("SERVER")
}