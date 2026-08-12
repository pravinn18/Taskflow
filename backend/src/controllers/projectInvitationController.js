import ProjectInvitation from "../models/ProjectInvitation.js";
import Project from "../models/Project.js";

import { createNotification } from "../services/notificationService.js";
import { createActivity } from "../services/activityService.js";


export const getMyProjectInvitations = async (req, res) => {
  try {
    const invitations = await ProjectInvitation.find({
      invitee: req.user._id,
      status: "pending",
    })
      .populate("project", "name description color owner members")
      .populate("inviter", "name email avatar role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error("Get project invitations error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const acceptProjectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await ProjectInvitation.findOne({
      _id: invitationId,
      invitee: req.user._id,
      status: "pending",
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Pending invitation not found.",
      });
    }

    const project = await Project.findById(invitation.project);

    if (!project) {
      invitation.status = "rejected";
      invitation.respondedAt = new Date();

      await invitation.save();

      return res.status(404).json({
        success: false,
        message: "Project no longer exists.",
      });
    }


    const alreadyMember = project.members.some(
      (member) => member.toString() === req.user._id.toString(),
    );

    if (!alreadyMember) {
      project.members.push(req.user._id);
      await project.save();
    }


    invitation.status = "accepted";
    invitation.respondedAt = new Date();

    await invitation.save();

    await createActivity({
      project: project._id,
      user: req.user._id,
     type: "invitation_accepted",
      message: `${req.user.name} joined the project "${project.name}".`,
    });

    if (project.owner && project.owner.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: project.owner,
        sender: req.user._id,
        type: "project_updated",
        title: "Project invitation accepted",
        message: `${req.user.name} accepted the invitation to join "${project.name}".`,
        project: project._id,
       
      });
    }

    const updatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatar role")
      .populate("members", "name email avatar role");

    return res.status(200).json({
      success: true,
      message: "Project invitation accepted.",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Accept project invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const rejectProjectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await ProjectInvitation.findOne({
      _id: invitationId,
      invitee: req.user._id,
      status: "pending",
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Pending invitation not found.",
      });
    }

    const project = await Project.findById(invitation.project);

    invitation.status = "rejected";
    invitation.respondedAt = new Date();

    await invitation.save();

    if (
      project?.owner &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      await createNotification({
        recipient: project.owner,
        sender: req.user._id,
        type: "project_updated",
        title: "Project invitation rejected",
        message: `${req.user.name} rejected the invitation to join "${project.name}".`,
        project: project._id,
     
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project invitation rejected.",
    });
  } catch (error) {
    console.error("Reject project invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
