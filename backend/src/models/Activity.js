import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    //   required: true,
      index: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    type: {
      type: String,
      enum: [
        "created",
        "updated",
        "status_changed",
        "assigned",
        "unassigned",
        "priority_changed",
        "due_date_changed",
        "label_changed",
        "comment_added",
        "comment_updated",
        "comment_deleted",
        "deleted",
      ],
      required: true,
    },


    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },


    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },


    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },


    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);


activitySchema.index({
  task: 1,
  createdAt: 1,
});

activitySchema.index({
  project: 1,
  createdAt: -1,
});

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
