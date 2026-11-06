import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

interface JwtPayload {
  userId: string;
  role: "admin" | "support_agent" | "employee";
}

const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;
  console.log(
    "Middleware JWT fingerprint:",
    crypto
      .createHash("sha256")
      .update(jwtSecret || "")
      .digest("hex")
      .slice(0, 8),
  );

  if (!jwtSecret) {
    return res.status(500).json({
      success: false,
      message: "JWT_SECRET is not defined",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    res.locals.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default protect;
