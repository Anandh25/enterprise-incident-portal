import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  incident: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  message: string;
}

const commentSchema = new Schema<IComment>(
  {
    incident: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
