import Incident from "../models/Incident";
import User from "../models/User";
import { createAuditLog } from "./auditLogService";
import { calculateDueDate } from "../utils/sla";

const createIncident = async (
  title: string,
  description: string,
  category: "hardware" | "software" | "network" | "access" | "other",
  priority: "critical" | "high" | "medium" | "low",
  createdBy: string,
) => {
  const incident = await Incident.create({
    title,
    description,
    category,
    priority,
    createdBy,
    dueDate: calculateDueDate(priority),
  });

  await createAuditLog(
    incident._id.toString(),
    createdBy,
    "created",
    `Incident created: ${title}`,
  );

  return incident;
};

const getIncidents = async (
  userId: string,
  role: "admin" | "support_agent" | "employee",
  options: {
    search: string;
    status: string;
    priority: string;
    page: number;
    limit: number;
  },
) => {
  const { search, status, priority, page, limit } = options;

  const filter: Record<string, unknown> = {};

  if (role === "employee") {
    filter.createdBy = userId;
  }

  if (search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  const total = await Incident.countDocuments(filter);

  const incidents = await Incident.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { incidents, total };
};

const updateIncidentStatus = async (
  incidentId: string,
  status: "open" | "in_progress" | "pending" | "resolved" | "closed",
  performedBy: string,
) => {
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    { status },
    { new: true, runValidators: true },
  );

  if (!incident) return null;

  await createAuditLog(
    incidentId,
    performedBy,
    "status_updated",
    `Incident status changed to: ${status}`,
  );

  return incident;
};

const assignIncident = async (
  incidentId: string,
  assignedTo: string,
  performedBy: string,
) => {
  const agent = await User.findOne({
    _id: assignedTo,
    role: "support_agent",
    isActive: true,
  });

  if (!agent) {
    throw new Error("Active support agent not found");
  }

  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    { assignedTo: agent._id },
    { new: true, runValidators: true },
  );

  if (!incident) return null;

  await createAuditLog(
    incidentId,
    performedBy,
    "assigned",
    `Incident assigned to support agent: ${agent.name}`,
  );

  return incident;
};

const getOverdueIncidents = async () => {
  const now = new Date();

  const incidents = await Incident.find({
    dueDate: { $lt: now },
    status: { $nin: ["resolved", "closed"] },
  }).sort({ dueDate: 1 });

  return incidents;
};

const getDashboardSummary = async () => {
  const now = new Date();

  const [total, open, inProgress, resolved, overdue] = await Promise.all([
    Incident.countDocuments(),
    Incident.countDocuments({ status: "open" }),
    Incident.countDocuments({ status: "in_progress" }),
    Incident.countDocuments({ status: "resolved" }),
    Incident.countDocuments({
      dueDate: { $lt: now },
      status: { $nin: ["resolved", "closed"] },
    }),
  ]);

  return {
    total,
    open,
    inProgress,
    resolved,
    overdue,
  };
};

export {
  createIncident,
  getIncidents,
  updateIncidentStatus,
  assignIncident,
  getOverdueIncidents,
  getDashboardSummary,
};
