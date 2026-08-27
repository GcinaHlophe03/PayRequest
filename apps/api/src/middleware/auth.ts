import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "@payrequest/database";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  clerkUserId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    let user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          fullName: "PayRequest User",
          email: `clerk-${userId}@payrequest.local`,
        },
      });
    }

    req.userId = user.id;
    req.clerkUserId = userId;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      error: "Authentication failed",
    });
  }
}