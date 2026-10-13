import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  incident: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  action: "created" | "status_updated" | "assigned" | "comment_added";
  details: string;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    incident: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["created", "status_updated", "assigned", "comment_added"],
      required: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
