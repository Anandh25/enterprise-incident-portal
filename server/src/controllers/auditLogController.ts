import { Request, Response } from "express";
import { getAuditLogsByIncident } from "../services/auditLogService";

const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const incidentId = String(req.params.id);
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
