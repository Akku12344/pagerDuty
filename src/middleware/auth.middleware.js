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
