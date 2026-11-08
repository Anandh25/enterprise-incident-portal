import express from "express";
import {
  create,
  getAll,
  getById,
  updateStatus,
  assign,
  getMyAssignments,
  getOverdue,
  getDashboard,
} from "../controllers/incidentController";
import protect from "../middleware/authMiddleware";
import allowRoles from "../middleware/roleMiddleware";
import {
  addComment,
  editComment,
  getComments,
} from "../controllers/commentController";
import { getAuditLogs } from "../controllers/auditLogController";

const router = express.Router();

// Create and list incidents
router.post("/", protect, create);
router.get("/", protect, getAll);

// Specific GET routes must come before /:id
router.get(
  "/my-assignments",
  protect,
  allowRoles("admin", "support_agent"),
  getMyAssignments,
);

router.get("/overdue", protect, getOverdue);

router.get("/dashboard/summary", protect, getDashboard);

// Fetch a single incident
router.get("/:id", protect, getById);

// Update incident status
router.patch(
  "/:id",
  protect,
  allowRoles("admin", "support_agent"),
  updateStatus,
);

// Assign incident
router.patch("/:id/assign", protect, allowRoles("admin"), assign);

// Comments
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);
router.patch("/:id/comments/:commentId", protect, editComment);

// Audit logs
router.get("/:id/audit-logs", protect, getAuditLogs);

export default router;
