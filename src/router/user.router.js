import { Router } from "express";
import { getme, login, register } from "../controller/user.controller.js";
import { loginSchema, registerSchema } from "../schemas/user.schema.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/me", requireAuth, getme);

export default router;
