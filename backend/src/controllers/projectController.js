import Project from "../models/Project.js";
import User from "../models/User.js";

import { createNotification } from "../services/notificationService.js";
import { createActivity } from "../services/activityService.js";
import ProjectInvitation from "../models/ProjectInvitation.js";





const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }

  return value.toString();
};


const getUserId = (user) => {
  return user?._id ? user._id.toString() : "";
};


const isProjectMember = (project, userId) => {
  if (!project || !userId) {
    return false;
  }

  const userIdString = userId.toString();

  if (getId(project.owner) === userIdString) {
    return true;
  }

  return (
    Array.isArray(project.members) &&
    project.members.some((member) => getId(member) === userIdString)
  );
};


export const createProject = async (req, res) => {
  try {
    const { name, description, color } = req.body || {};


    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }


    const project = await Project.create({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      color: color || "#6366f1",
      owner: req.user._id,
      members: [req.user._id],
    });


    await createActivity({
      project: project._id,
      user: req.user._id,
      type: "project_created",
      message: `${req.user.name} created project "${project.name}".`,
    });


    const populatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatar role")
      .populate("members", "name email avatar role");

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate("owner", "name email avatar role")
      .populate("members", "name email avatar role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email avatar role")
      .populate("members", "name email avatar role");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const userId = getUserId(req.user);

    if (!isProjectMember(project, userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const updateProject = async (req, res) => {
  try {
    const { name, description, color, status } = req.body || {};


    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const userId = getUserId(req.user);


    if (getId(project.owner) !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can update it",
      });
    }


    const oldProject = {
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
    };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Project name cannot be empty",
        });
      }

      project.name = name.trim();
    }


    if (description !== undefined) {
      project.description =
        typeof description === "string" ? description.trim() : "";
    }

    if (color !== undefined) {
      project.color = color;
    }

    if (status !== undefined) {
      const validStatuses = ["active", "completed", "archived"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project status",
        });
      }

      project.status = status;
    }


    const projectChanged =
      oldProject.name !== project.name ||
      oldProject.description !== project.description ||
      oldProject.color !== project.color ||
      oldProject.status !== project.status;


    if (!projectChanged) {
      const unchangedProject = await Project.findById(project._id)
        .populate("owner", "name email avatar role")
        .populate("members", "name email avatar role");

      return res.status(200).json({
        success: true,
        message: "No project changes detected",
        project: unchangedProject,
      });
    }

    await project.save();

    await createActivity({
      project: project._id,
      user: req.user._id,
      type: "project_updated",
      message: `${req.user.name} updated project "${project.name}".`,
      oldValue: oldProject,
      newValue: {
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
      },
    });


    if (Array.isArray(project.members) && project.members.length > 0) {
      await Promise.all(
        project.members
          .filter((memberId) => getId(memberId) !== userId)
          .map((memberId) =>
            createNotification({
              recipient: memberId,
              sender: req.user._id,
              type: "project_updated",
              title: "Project updated",
              message: `${req.user.name} updated the project "${project.name}".`,
              project: project._id,
            }),
          ),
      );
    }


    const updatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatar role")
      .populate("members", "name email avatar role");

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const userId = getUserId(req.user);

    if (getId(project.owner) !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can delete it",
      });
    }

    const projectName = project.name;


    await createActivity({
      project: project._id,
      user: req.user._id,
      type: "project_deleted",
      message: `${req.user.name} deleted project "${projectName}".`,
    });


    if (Array.isArray(project.members) && project.members.length > 0) {
      await Promise.all(
        project.members
          .filter((memberId) => getId(memberId) !== userId)
          .map((memberId) =>
            createNotification({
              recipient: memberId,
              sender: req.user._id,
              type: "project_updated",
              title: "Project deleted",
              message: `The project "${projectName}" was deleted.`,
              project: project._id,
            }),
          ),
      );
    }

    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body || {};

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Member email is required",
      });
    }


    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const ownerId = getUserId(req.user);

    if (getId(project.owner) !== ownerId) {
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

    const targetUserId = getId(user._id);


    if (getId(project.owner) === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Project owner is already a member",
      });
    }


    const alreadyMember =
      Array.isArray(project.members) &&
      project.members.some(
        (member) => getId(member) === targetUserId,
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
        message: "A project invitation is already pending for this user.",
      });
    }


    const invitation = await ProjectInvitation.create({
      project: project._id,
      inviter: req.user._id,
      invitee: user._id,
      status: "pending",
    });


    await createActivity({
      project: project._id,
      user: req.user._id,
      type: "invitation_sent",
      message: `${req.user.name} invited ${user.name} to join project "${project.name}".`,
      oldValue: null,
      newValue: {
        user: user._id.toString(),
        name: user.name,
        email: user.email,
        invitation: invitation._id.toString(),
      },
    });


    await createNotification({
      recipient: user._id,
      sender: req.user._id,
      type: "project_invitation",
      title: "Project invitation",
      message: `${req.user.name} invited you to join the project "${project.name}".`,
      project: project._id,
      invitation: invitation._id,
    });


    return res.status(201).json({
      success: true,
      message: "Project invitation sent successfully",
      invitation,
    });
  } catch (error) {
    console.error("Send project invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("owner", "name email avatar role")
      .populate("members", "name email avatar role");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const userId = getUserId(req.user);

    if (!isProjectMember(project, userId)) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project",
      });
    }

    return res.status(200).json({
      success: true,
      owner: project.owner,
      members: project.members,
    });
  } catch (error) {
    console.error("Get project members error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const removeProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const ownerId = getUserId(req.user);


    if (getId(project.owner) !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can remove members",
      });
    }

    if (getId(project.owner) === userId) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot be removed",
      });
    }

    const memberExists =
      Array.isArray(project.members) &&
      project.members.some((member) => getId(member) === userId);

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "Member is not part of this project",
      });
    }

    const removedUser = await User.findById(userId);


    project.members = project.members.filter(
      (member) => getId(member) !== userId,
    );

    await project.save();

    await createActivity({
      project: project._id,
      user: req.user._id,
      type: "member_removed",
      message: `${req.user.name} removed ${
        removedUser?.name || "a member"
      } from project "${project.name}".`,
      oldValue: {
        user: userId,
        name: removedUser?.name || null,
        email: removedUser?.email || null,
      },
      newValue: null,
    });


    await createNotification({
      recipient: userId,
      sender: req.user._id,
      type: "project_updated",
      title: "Removed from project",
      message: `You were removed from the project "${project.name}".`,
      project: project._id,
  
    });

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove project member error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
