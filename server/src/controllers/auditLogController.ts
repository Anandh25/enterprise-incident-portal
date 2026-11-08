import { Request, Response } from "express";
import { getAuditLogsByIncident } from "../services/auditLogService";
import { getIncidentById } from "../services/incidentService";

const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const incidentId = String(req.params.id);
    const { userId, role } = res.locals.user;

    const incident = await getIncidentById(incidentId, userId, role);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const isAdmin = role === "admin";
    const isEmployee =
      role === "employee" && incident.createdBy._id.toString() === userId;

    const isAssignedAgent =
      role === "support_agent" &&
      incident.assignedTo?._id.toString() === userId;

    if (!isAdmin && !isEmployee && !isAssignedAgent) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this incident's audit history",
      });
    }

    const auditLogs = await getAuditLogsByIncident(incidentId);

    return res.status(200).json({
      success: true,
      count: auditLogs.length,
      data: auditLogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

export { getAuditLogs };
