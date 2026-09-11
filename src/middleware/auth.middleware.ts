import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId?: string;

  user?: {
    id: string;
  };
}

interface JwtPayload {
  userId?: string;
  id?: string;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token ||
      token.trim().length === 0
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing from environment variables");

      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured",
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const authenticatedUserId = decoded.userId || decoded.id;

    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    /**
     * Support both authentication styles used
     * throughout the ConnectAS backend.
     */
    req.userId = authenticatedUserId;

    req.user = {
      id: authenticatedUserId,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}