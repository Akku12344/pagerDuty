import { Router } from "express";
import { authorizeRole, requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { emailSchema, teamSchema } from "../schemas/team.schema.js";
import {
  addMember,
  createTeam,
  updateMember,
} from "../controller/team.controller.js";

const router = Router();

router.post("/create", requireAuth, validate(teamSchema), createTeam);
router.post(
  "/:teamId/add/member",
  requireAuth,
  authorizeRole("ADMIN"),
  validate(emailSchema),
  addMember,
);
router.post(
  "/:teamId/update/member/:userId",
  requireAuth,
  authorizeRole("ADMIN"),
  updateMember,
);
router.post(
  "/:teamId/remove/member/:userId",
  requireAuth,
  authorizeRole("ADMIN"),
);

export default router;
