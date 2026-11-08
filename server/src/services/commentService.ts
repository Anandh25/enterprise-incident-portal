import mongoose from "mongoose";
import Comment from "../models/Comment";
import Incident from "../models/Incident";
import { createAuditLog } from "./auditLogService";

const createComment = async (
  incidentId: string,
  authorId: string,
  message: string,
) => {
  const incident = await Incident.findById(incidentId);

  if (!incident) {
    throw new Error("Incident not found");
  }

  const comment = await Comment.create({
    incident: incidentId,
    author: authorId,
    message,
    originalMessage: message,
  });

  await createAuditLog(
    incidentId,
    authorId,
    "comment_added",
    "A comment was added to the incident",
  );

  return comment;
};

const editComment = async (
  incidentId: string,
  commentId: string,
  userId: string,
  message: string,
) => {
  const comment = await Comment.findOne({
    _id: commentId,
    incident: incidentId,
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Users can edit only their own comments.
  if (comment.author.toString() !== userId) {
    throw new Error("You can only edit your own comments");
  }

  const updatedMessage = message.trim();

  if (comment.message === updatedMessage) {
    throw new Error("No changes detected");
  }

  // Preserve the original comment.
  if (!comment.originalMessage) {
    comment.originalMessage = comment.message;
  }

  // Record the new edited version.
  comment.editHistory.push({
    message: updatedMessage,
    editedBy: new mongoose.Types.ObjectId(userId),
    editedAt: new Date(),
  });

  // Update the current comment.
  comment.message = updatedMessage;

  await comment.save();

  await createAuditLog(
    incidentId,
    userId,
    "comment_edited",
    "A comment was edited",
  );

  return comment;
};

const getCommentsByIncident = async (incidentId: string) => {
  const comments = await Comment.find({ incident: incidentId })
    .populate("author", "name email role")
    .populate("editHistory.editedBy", "name email role")
    .sort({ createdAt: 1 });

  return comments;
};

export { createComment, editComment, getCommentsByIncident };
