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
  });

  await createAuditLog(
    incidentId,
    authorId,
    "comment_added",
    "A comment was added to the incident",
  );

  return comment;
};

const getCommentsByIncident = async (incidentId: string) => {
  const comments = await Comment.find({ incident: incidentId })
    .populate("author", "name email role")
    .sort({ createdAt: 1 });

  return comments;
};

export { createComment, getCommentsByIncident };
