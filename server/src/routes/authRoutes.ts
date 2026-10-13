import express from "express";
import { getMe, login, register } from "../controllers/authController";
import protect from "../middleware/authMiddleware";
import allowRoles from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/employee-test", protect, allowRoles("employee"), getMe);
router.get("/admin-test", protect, allowRoles("admin"), getMe);

export default router;
