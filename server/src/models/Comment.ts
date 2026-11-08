import mongoose, { Document, Schema } from "mongoose";

interface ICommentHistory {
  message: string;
  editedBy: mongoose.Types.ObjectId;
  editedAt: Date;
}

export interface IComment extends Document {
  incident: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  message: string;
  originalMessage?: string;
  editHistory: ICommentHistory[];
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
    originalMessage: {
      type: String,
      trim: true,
    },
    editHistory: [
      {
        message: {
          type: String,
          required: true,
          trim: true,
        },
        editedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        editedAt: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
