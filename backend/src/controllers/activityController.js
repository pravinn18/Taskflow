import Activity from "../models/Activity.js";
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


const canAccessTask = (user, project) => {
  const userId = getUserId(user);

  if (!userId || !project) {
    return false;
  }

  return isAdmin(user) || isDeveloper(user) || isProjectMember(project, userId);
};


export const getTaskActivities = async (req, res) => {
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



    const activities = await Activity.find({
      task: taskId,
    })
      .populate("user", "name email avatar role")
      .sort({
        createdAt: -1,
      });


    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get task activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading task activity.",
    });
  }
};



export const getProjectActivities = async (req, res) => {
  try {
    const { projectId } = req.params;

    

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }


    const userId = getUserId(req.user);

    const hasAccess =
      isAdmin(req.user) ||
      isDeveloper(req.user) ||
      isProjectMember(project, userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project.",
      });
    }


    const activities = await Activity.find({
      project: projectId,
    })
      .populate("user", "name email avatar role")
      .populate("task", "title status priority")
      .sort({
        createdAt: -1,
      });

  
    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get project activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading project activity.",
    });
  }
};
