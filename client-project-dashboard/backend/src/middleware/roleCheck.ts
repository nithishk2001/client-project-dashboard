import { Request, Response, NextFunction } from "express";

// Usage: requireRole("ADMIN") or requireRole("ADMIN", "PROJECT_MANAGER")
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do this" });
    }

    next();
  };
}
