import Activity from "../models/Activity.js";

export const createActivity = async ({
  task,
  project,
  user,
  type,
  message,
  oldValue = null,
  newValue = null,
  metadata = null,
}) => {
  try {
    if (!task || !project || !user || !type || !message) {
      return null;
    }

    const activity = await Activity.create({
      task,
      project,
      user,
      type,
      message,
      oldValue,
      newValue,
      metadata,
    });

    return activity;
  } catch (error) {
    console.error("Create activity error:", error);

    return null;
  }
};
