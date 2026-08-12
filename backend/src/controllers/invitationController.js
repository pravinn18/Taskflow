import ProjectInvitation from "../models/ProjectInvitation.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

import { createNotification } from "../services/notificationService.js";
import { createActivity } from "../services/activityService.js";


export const createInvitation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body || {};


    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }


    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can invite members",
      });
    }


    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email was not found",
      });
    }


    if (user._id.toString() === project.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot be invited",
      });
    }


    const alreadyMember = project.members.some(
      (member) => member.toString() === user._id.toString(),
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a project member",
      });
    }


    const existingInvitation = await ProjectInvitation.findOne({
      project: project._id,
      invitee: user._id,
      status: "pending",
    });

    if (existingInvitation) {
      return res.status(409).json({
        success: false,
        message: "A pending invitation already exists for this user",
      });
    }


    const invitation = await ProjectInvitation.create({
      project: project._id,
      inviter: req.user._id,
      invitee: user._id,
      status: "pending",
    });

    console.log("Created invitation:", invitation._id.toString());


    const notification = await createNotification({
      recipient: user._id,
      sender: req.user._id,
      type: "project_invitation",
      title: "Project invitation",
      message: `${req.user.name} invited you to join the project "${project.name}".`,
      project: project._id,
      invitation: invitation._id,
    });

    console.log(
      "Created invitation notification:",
      notification?._id?.toString(),
    );

    console.log(
      "Notification invitation:",
      notification?.invitation?.toString(),
    );


    await createActivity({
      project: project._id,
      user: req.user._id,
      type: "invitation_sent",
      message: `${req.user.name} invited ${user.name} to the project "${project.name}".`,
      metadata: {
        invitation: invitation._id,
        invitee: user._id,
      },
    });

    const populatedInvitation = await ProjectInvitation.findById(invitation._id)
      .populate("project", "name description color status")
      .populate("inviter", "name email avatar role")
      .populate("invitee", "name email avatar role");

    return res.status(201).json({
      success: true,
      message: "Project invitation sent successfully",
      invitation: populatedInvitation,
    });
  } catch (error) {
    console.error("Create invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getMyInvitations = async (req, res) => {
  try {
    const invitations = await ProjectInvitation.find({
      invitee: req.user._id,
      status: "pending",
    })
      .populate("project", "name description color status")
      .populate("inviter", "name email avatar role")
      .populate("invitee", "name email avatar role")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error("Get invitations error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;


    const invitation = await ProjectInvitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }


    if (invitation.invitee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot accept this invitation",
      });
    }


    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`,
      });
    }


    const project = await Project.findById(invitation.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project no longer exists",
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

    await invitation.save();


    await createActivity({
      project: project._id,
      user: req.user._id,
      type: "invitation_accepted",
      message: `${req.user.name} accepted the invitation to join "${project.name}".`,
      metadata: {
        invitation: invitation._id,
      },
    });

    if (project.owner && project.owner.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: project.owner,
        sender: req.user._id,
        type: "project_updated",
        title: "Invitation accepted",
        message: `${req.user.name} accepted the invitation to join "${project.name}".`,
        project: project._id,
      });
    }

    const updatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatar role")
      .populate("members", "name email avatar role");

    return res.status(200).json({
      success: true,
      message: "Project invitation accepted",
      project: updatedProject,
      invitation,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;


    const invitation = await ProjectInvitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }


    if (invitation.invitee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot reject this invitation",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`,
      });
    }

    const project = await Project.findById(invitation.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project no longer exists",
      });
    }

    invitation.status = "rejected";

    await invitation.save();


    await createActivity({
      project: project._id,
      user: req.user._id,
      type: "invitation_rejected",
      message: `${req.user.name} rejected the invitation to join "${project.name}".`,
      metadata: {
        invitation: invitation._id,
      },
    });


    if (project.owner && project.owner.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: project.owner,
        sender: req.user._id,
        type: "project_updated",
        title: "Invitation rejected",
        message: `${req.user.name} rejected the invitation to join "${project.name}".`,
        project: project._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project invitation rejected",
      invitation,
    });
  } catch (error) {
    console.error("Reject invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
