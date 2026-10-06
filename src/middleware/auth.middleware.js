import jwt from "jsonwebtoken";
import { AppError } from "./AppError.js";
import { prisma } from "../config/db.js";

export const requireAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AppError("Invalid or expired token", 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export const roleRank = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export const authorizeRole = (requiredRole, exact = false) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      const { teamId } = req.params;

      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        throw new AppError("you are not a member of this team", 400);
      }

      const hasPermission = exact
        ? membership.role === requiredRole
        : roleRank[membership.role] >= roleRank[requiredRole];

      if (!hasPermission) {
        throw new AppError("you dont have permission", 403);
      }

      req.membership = membership;

      next();
    } catch (error) {
      next(error);
    }
  };
};
