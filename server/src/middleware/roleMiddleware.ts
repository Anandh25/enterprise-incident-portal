import { Request, Response, NextFunction } from "express";

type Role = "admin" | "support_agent" | "employee";

const allowRoles = (...allowedRoles: Role[]) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};

export default allowRoles;
