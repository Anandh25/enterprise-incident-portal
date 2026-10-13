import { Request, Response } from "express";
import {
  createIncident,
  getIncidents,
  updateIncidentStatus,
  assignIncident,
  getOverdueIncidents,
  getDashboardSummary,
} from "../services/incidentService";

const create = async (req: Request, res: Response) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description and category are required",
      });
    }

    const createdBy = res.locals.user.userId;

    const incident = await createIncident(
      title,
      description,
      category,
      priority,
      createdBy,
    );

    return res.status(201).json({
      success: true,
      message: "Incident created successfully",
      data: incident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create incident",
    });
  }
};

const getAll = async (req: Request, res: Response) => {
  try {
    const { userId, role } = res.locals.user;

    const search = typeof req.query.search === "string" ? req.query.search : "";

    const status = typeof req.query.status === "string" ? req.query.status : "";

    const priority =
      typeof req.query.priority === "string" ? req.query.priority : "";

    const validStatuses = [
      "open",
      "in_progress",
      "pending",
      "resolved",
      "closed",
    ];

    const validPriorities = ["critical", "high", "medium", "low"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority value",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const result = await getIncidents(userId, role, {
      search,
      status,
      priority,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.incidents,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch incidents",
    });
  }
};

const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const validStatuses = [
      "open",
      "in_progress",
      "pending",
      "resolved",
      "closed",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid incident status",
      });
    }

    const performedBy = res.locals.user.userId;

    const incident = await updateIncidentStatus(id, status, performedBy);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Incident status updated successfully",
      data: incident,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update incident status",
    });
  }
};

const assign = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { assignedTo } = req.body;

    if (typeof assignedTo !== "string" || !assignedTo.trim()) {
      return res.status(400).json({
        success: false,
        message: "Support agent ID is required",
      });
    }

    const performedBy = res.locals.user.userId;

    const incident = await assignIncident(id, assignedTo, performedBy);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Incident assigned successfully",
      data: incident,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Assignment failed";

    return res
      .status(message === "Active support agent not found" ? 400 : 500)
      .json({
        success: false,
        message,
      });
  }
};

const getOverdue = async (req: Request, res: Response) => {
  try {
    const incidents = await getOverdueIncidents();

    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch overdue incidents",
    });
  }
};

const getDashboard = async (_req: Request, res: Response) => {
  try {
    const summary = await getDashboardSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
    });
  }
};

export { create, getAll, updateStatus, assign, getOverdue, getDashboard };
