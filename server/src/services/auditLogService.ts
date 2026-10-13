import AuditLog from "../models/AuditLog";

const createAuditLog = async (
  incidentId: string,
  performedBy: string,
  action: "created" | "status_updated" | "assigned" | "comment_added",
  details: string,
) => {
  const auditLog = await AuditLog.create({
    incident: incidentId,
    performedBy,
    action,
    details,
  });

  return auditLog;
};

const getAuditLogsByIncident = async (incidentId: string) => {
  const auditLogs = await AuditLog.find({ incident: incidentId })
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 });

  return auditLogs;
};

export { createAuditLog, getAuditLogsByIncident };
