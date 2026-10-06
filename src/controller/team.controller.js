import { prisma } from "../config/db.js";
import { AppError } from "../middleware/AppError.js";

export const createTeam = async (req, res, next) => {
  try {
    const { user } = req;

    const { name } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name,
        },
      });

      const membership = await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "team.created",
          entityType: "TEAM",
          entityId: team.id,
          metadata: {
            name: team.name,
            status: "created",
          },
        },
      });

      return team;
    });

    res.status(201).json({
      message: "team.created",
      status: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { user } = req;
    const { teamId } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    if (targetUser.id === user.id) {
      throw new AppError("You are already a member of this team", 409);
    }

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      throw new AppError("User is already a member of this team", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.teamMember.create({
        data: {
          teamId,
          userId: targetUser.id,
          role: "MEMBER",
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "member.added",
          entityType: "TEAM",
          entityId: team.id,
          metadata: {
            targetUserId: targetUser.id,
            targetEmail: targetUser.email,
            targetRole: membership.role,
          },
        },
      });

      return membership;
    });

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      member: {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: result.role,
        joinedAt: result.joinedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const { user } = req;
    const { teamId, userId } = req.params;
    const { role } = req.body;

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });

    if (!team) {
      throw new AppError("Team does not exist", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new AppError("Team member does not exist", 404);
      }

      const previousRole = membership.role;
      const requesterRole = req.membership.role;

      if (previousRole === "OWNER") {
        throw new AppError("Owner role cannot be changed", 403);
      }

      if (previousRole === role) {
        throw new AppError("User already has this role", 400);
      }

      if (requesterRole === "ADMIN") {
        if (previousRole === "ADMIN") {
          throw new AppError("Admin cannot modify another admin", 403);
        }

        if (!["MEMBER", "VIEWER"].includes(role)) {
          throw new AppError("Admin can only assign MEMBER or VIEWER", 403);
        }
      }

      if (requesterRole === "OWNER") {
        if (!["ADMIN", "MEMBER", "VIEWER"].includes(role)) {
          throw new AppError("Invalid role assignment", 400);
        }
      }

      const updateMembership = await tx.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
        data: {
          role,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "member.role_changed",
          entityType: "TEAM",
          entityId: team.id,
          metadata: {
            targetUserId: userId,
            fromRole: previousRole,
            toRole: role,
          },
        },
      });

      return updateMembership;
    });

    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      member: result,
    });
  } catch (error) {
    next(error);
  }
};
