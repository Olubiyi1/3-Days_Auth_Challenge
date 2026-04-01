import AppError from "./appError.js";

export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl}`, 404);
  next(err);
};