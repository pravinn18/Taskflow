import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";


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


const getUserRole = (user) => {
  return user?.role ? user.role.toString().toLowerCase() : "";
};


const isAdmin = (user) => {
  return getUserRole(user) === "admin";
};

const isDeveloper = (user) => {
  const role = getUserRole(user);

  return role === "developer" || role === "employee";
};


const isProjectOwner = (project, userId) => {
  if (!project || !userId) {
    return false;
  }

  return getId(project.owner) === userId.toString();
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


const getTaskAndProject = async (taskId) => {
  const task = await Task.findById(taskId);

  if (!task) {
    return {
      task: null,
      project: null,
    };
  }

  const project = await Project.findById(task.project);

  return {
    task,
    project,
  };
};

const canAccessTask = (user, project) => {
  const userId = getUserId(user);

  if (!userId || !project) {
    return false;
  }

  return isAdmin(user) || isDeveloper(user) || isProjectMember(project, userId);
};

export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body || {};


    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty.",
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 2000 characters.",
      });
    }

    const { task, project } = await getTaskAndProject(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

   

    if (!canAccessTask(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to comment on this task.",
      });
    }


    const comment = await Comment.create({
      task: task._id,
      project: project._id,
      author: req.user._id,
      content: content.trim(),
    });


    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name email avatar role",
    );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Create comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating comment.",
    });
  }
};

export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;


    const { task, project } = await getTaskAndProject(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }


    if (!canAccessTask(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this task.",
      });
    }

    const comments = await Comment.find({
      task: taskId,
    })
      .populate("author", "name email avatar role")
      .sort({
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get task comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading comments.",
    });
  }
};


export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body || {};

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty.",
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 2000 characters.",
      });
    }


    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }


    const userId = getUserId(req.user);

    const isAuthor = getId(comment.author) === userId;

    if (!isAuthor && !isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments.",
      });
    }


    comment.content = content.trim();

    await comment.save();

    const updatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name email avatar role",
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Update comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating comment.",
    });
  }
};


export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;


    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }


    const userId = getUserId(req.user);

    const isAuthor = getId(comment.author) === userId;

    if (!isAuthor && !isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments.",
      });
    }


    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting comment.",
    });
  }
};
