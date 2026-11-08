import { Request, Response } from "express";
import {
  createComment,
  getCommentsByIncident,
  editComment as editCommentService,
} from "../services/commentService";
import { getIncidentById } from "../services/incidentService";

const addComment = async (req: Request, res: Response) => {
  try {
    const incidentId = String(req.params.id);
    const { message } = req.body;
    const { userId, role } = res.locals.user;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    const incident = await getIncidentById(incidentId, userId, role);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const comment = await createComment(incidentId, userId, message.trim());

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add comment";

    return res.status(errorMessage === "Incident not found" ? 404 : 500).json({
      success: false,
      message: errorMessage,
    });
  }
};

const editComment = async (req: Request, res: Response) => {
  try {
    const incidentId = String(req.params.id);
    const commentId = String(req.params.commentId);
    const { message } = req.body;
    const { userId, role } = res.locals.user;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    const incident = await getIncidentById(incidentId, userId, role);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const updatedComment = await editCommentService(
      incidentId,
      commentId,
      userId,
      message.trim(),
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to edit comment";

    if (errorMessage === "Comment not found") {
      return res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }

    if (errorMessage === "You can only edit your own comments") {
      return res.status(403).json({
        success: false,
        message: errorMessage,
      });
    }

    if (errorMessage === "No changes detected") {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

const getComments = async (req: Request, res: Response) => {
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

    const comments = await getCommentsByIncident(incidentId);

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
    });
  }
};

export { addComment, editComment, getComments };
