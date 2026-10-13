import express from "express";
import {
  create,
  getAll,
  updateStatus,
  assign,
  getOverdue,
  getDashboard,
} from "../controllers/incidentController";
import protect from "../middleware/authMiddleware";
import allowRoles from "../middleware/roleMiddleware";
import { addComment, getComments } from "../controllers/commentController";
import { getAuditLogs } from "../controllers/auditLogController";

const router = express.Router();

router.post("/", protect, create);
router.get("/", protect, getAll);

router.patch(
  "/:id",
  protect,
  allowRoles("admin", "support_agent"),
  updateStatus,
);

router.patch(
  "/:id/assign",
  protect,
  allowRoles("admin", "support_agent"),
  assign,
);

router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);
router.get(
  "/:id/audit-logs",
  protect,
  allowRoles("admin", "support_agent"),
  getAuditLogs,
);

router.get(
  "/overdue",
  protect,
  allowRoles("admin", "support_agent"),
  getOverdue,
);

router.get(
  "/dashboard/summary",
  protect,
  allowRoles("admin", "support_agent"),
  getDashboard,
);
export default router;
