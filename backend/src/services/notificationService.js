import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipient,
  sender = null,
  type = "general",
  title,
  message,
  task = null,
  project = null,
  comment = null,
  invitation = null,
}) => {
  try {
    if (!recipient || !title || !message) {
      return null;
    }

    if (sender && recipient.toString() === sender.toString()) {
      return null;
    }

console.log("========== CREATE NOTIFICATION ==========");
console.log("Type:", type);
console.log("Recipient:", recipient);
console.log("Project:", project);
console.log("Invitation:", invitation);
console.log("=========================================");


    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      task,
      project,
      comment,
      invitation,
    });

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);

    return null;
  }
};