import mongoose, { Document, Schema } from "mongoose";

export interface IIncident extends Document {
  title: string;
  description: string;
  category: "hardware" | "software" | "network" | "access" | "other";
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "pending" | "resolved" | "closed";
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  dueDate?: Date;
}

const incidentSchema = new Schema<IIncident>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["hardware", "software", "network", "access", "other"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "pending", "resolved", "closed"],
      default: "open",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Incident = mongoose.model<IIncident>("Incident", incidentSchema);

export default Incident;
