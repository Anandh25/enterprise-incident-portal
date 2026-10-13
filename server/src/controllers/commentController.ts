import { Request, Response } from "express";
import {
  createComment,
  getCommentsByIncident,
} from "../services/commentService";

const addComment = async (req: Request, res: Response) => {
  try {
    const incidentId = String(req.params.id);
    const { message } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    const authorId = res.locals.user.userId;

    const comment = await createComment(incidentId, authorId, message.trim());

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add comment";

    return res.status(message === "Incident not found" ? 404 : 500).json({
      success: false,
      message,
    });
  }
};

const getComments = async (req: Request, res: Response) => {
  try {
    const incidentId = String(req.params.id);
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

export { addComment, getComments };
