import { Request, Response, NextFunction } from "express";

// Simple catch-all error handler. Controllers call next(err) or just
// throw inside an async wrapper, and it ends up here.
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  if (err.name === "ZodError") {
    return res.status(400).json({ message: "Validation failed", errors: err.errors });
  }

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong"
  });
}
