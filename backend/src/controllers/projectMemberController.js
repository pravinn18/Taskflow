import User from "../models/User.js";
import Project from "../models/Project.js";

export const getAvailableUsers = async (req, res) => {
  try {
    const users = await User.find({
      isActive: true,
    }).select("name email avatar role");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get available users error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate(
      "members",
      "name email avatar role",
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isMember =
      project.owner.toString() === req.user._id.toString() ||
      project.members.some(
        (member) => member._id.toString() === req.user._id.toString(),
      );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project",
      });
    }

    res.status(200).json({
      success: true,
      members: project.members,
    });
  } catch (error) {
    console.error("Get project members error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body || {};
    

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
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
        message: "Only the project owner can add members",
      });
    }

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    
    if (project.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Project owner is already part of the project",
      });
    }

    
    const alreadyMember = project.members.some(
      (member) => member.toString() === userId.toString(),
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a project member",
      });
    }

    project.members.push(userId);

    await project.save();

    const updatedProject = await Project.findById(projectId).populate(
      "members",
      "name email avatar role",
    );

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Add project member error:", error);

    res.status(500).json({
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


    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can remove members",
      });
    }

    const memberExists = project.members.some(
      (member) => member.toString() === userId.toString(),
    );

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "User is not a project member",
      });
    }

    project.members = project.members.filter(
      (member) => member.toString() !== userId.toString(),
    );

    await project.save();

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove project member error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
