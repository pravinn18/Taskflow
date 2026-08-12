import Task from "../models/Task.js";
import Project from "../models/Project.js";

import { createNotification } from "../services/notificationService.js";
import { createActivity } from "../services/activityService.js";

const VALID_STATUSES = ["backlog", "todo", "in-progress", "done"];

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];


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
  return getUserRole(user) === "developer";
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


const isAssignedEmployee = (task, userId) => {
  if (!task || !userId) {
    return false;
  }

  return getId(task.assignee) === userId.toString();
};

const validateAssignee = (project, assignee) => {
  if (!assignee) {
    return true;
  }

  const assigneeId = getId(assignee);

  if (getId(project.owner) === assigneeId) {
    return true;
  }

  return (
    Array.isArray(project.members) &&
    project.members.some((member) => getId(member) === assigneeId)
  );
};


const canManageTask = (user, project) => {
  const userId = getUserId(user);

  if (!userId) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (isDeveloper(user)) {
    return true;
  }

  if (isProjectOwner(project, userId)) {
    return true;
  }

  return false;
};


const populateTask = async (taskId) => {
  return await Task.findById(taskId)
    .populate("creator", "name email avatar role")
    .populate("assignee", "name email avatar role")
    .populate("project", "name color owner members");
};


const notifyTaskCompleted = async ({ task, project, actor }) => {
  try {
    if (!task || !project || !actor) {
      return;
    }

    const recipients = new Set();


    const creatorId = getId(task.creator);

    if (creatorId) {
      recipients.add(creatorId);
    }

    const ownerId = getId(project.owner);

    if (ownerId) {
      recipients.add(ownerId);
    }


    const actorId = getUserId(actor);

    if (actorId) {
      recipients.delete(actorId);
    }


    await Promise.all(
      [...recipients].filter(Boolean).map((recipient) =>
        createNotification({
          recipient,
          sender: actor._id,
          type: "task_completed",
          title: "Task completed",
          message: `${actor.name} completed the task "${task.title}".`,
          task: task._id,
          project: project._id,
        }),
      ),
    );
  } catch (error) {
    console.error("Notify task completed error:", error);
  }
};


export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assignee,
      priority,
      dueDate,
      labels,
      status,
    } = req.body || {};

    if (!title?.trim() || !projectId) {
      return res.status(400).json({
        success: false,
        message: "Title and project are required.",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }


    if (!canManageTask(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create tasks in this project.",
      });
    }


    if (assignee && !validateAssignee(project, assignee)) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be a member of this project.",
      });
    }

    const finalPriority = priority || "medium";

    if (!VALID_PRIORITIES.includes(finalPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority.",
      });
    }


    const finalStatus = status || "todo";

    if (!VALID_STATUSES.includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status.",
      });
    }
    const task = await Task.create({
      title: title.trim(),

      description: typeof description === "string" ? description.trim() : "",

      project: projectId,

      creator: req.user._id,

      assignee: assignee || null,

      priority: finalPriority,

      dueDate: dueDate || null,

      labels: Array.isArray(labels) ? labels : [],

      status: finalStatus,
    });

    await createActivity({
      task: task._id,
      project: project._id,
      user: req.user._id,
      type: "created",
      message: `${req.user.name} created task "${task.title}".`,
    });

    

    if (task.assignee) {
      await createNotification({
        recipient: task.assignee,
        sender: req.user._id,
        type: "task_assigned",
        title: "New task assigned",
        message: `${req.user.name} assigned you the task "${task.title}".`,
        task: task._id,
        project: project._id,
        
      });
    }

   

    const populatedTask = await populateTask(task._id);

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating task.",
    });
  }
};



export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const hasAccess =
      isProjectMember(project, req.user._id) ||
      isAdmin(req.user) ||
      isDeveloper(req.user);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project.",
      });
    }

    const tasks = await Task.find({
      project: projectId,
    })
      .populate("creator", "name email avatar role")
      .populate("assignee", "name email avatar role")
      .populate("project", "name color owner members")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get project tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading tasks.",
    });
  }
};


export const getKanbanBoard = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const hasAccess =
      isProjectMember(project, req.user._id) ||
      isAdmin(req.user) ||
      isDeveloper(req.user);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project.",
      });
    }

    const tasks = await Task.find({
      project: projectId,
    })
      .populate("creator", "name email avatar role")
      .populate("assignee", "name email avatar role")
      .populate("project", "name color owner members")
      .sort({
        createdAt: -1,
      });

    const board = {
      backlog: [],
      todo: [],
      inProgress: [],
      done: [],
    };

    tasks.forEach((task) => {
      if (task.status === "backlog") {
        board.backlog.push(task);
      } else if (task.status === "todo") {
        board.todo.push(task);
      } else if (task.status === "in-progress") {
        board.inProgress.push(task);
      } else if (task.status === "done") {
        board.done.push(task);
      }
    });

    return res.status(200).json({
      success: true,
      board,
    });
  } catch (error) {
    console.error("Get Kanban board error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading Kanban board.",
    });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("creator", "name email avatar role")
      .populate("assignee", "name email avatar role")
      .populate("project", "name color owner members");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const project = await Project.findById(getId(task.project));

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const hasAccess =
      isProjectMember(project, req.user._id) ||
      isAdmin(req.user) ||
      isDeveloper(req.user);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this task.",
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading task.",
    });
  }
};


export const updateTask = async (req, res) => {
  try {
    const { title, description, assignee, priority, dueDate, labels, status } =
      req.body || {};

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }


    if (!canManageTask(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this task.",
      });
    }


    const oldStatus = task.status;

    const oldAssignee = task.assignee ? task.assignee.toString() : null;

    const oldTask = {
      title: task.title,
      description: task.description,
      assignee: oldAssignee,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      labels: Array.isArray(task.labels) ? [...task.labels] : [],
      status: oldStatus,
    };


    if (
      assignee !== undefined &&
      assignee &&
      !validateAssignee(project, assignee)
    ) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be a member of this project.",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty.",
        });
      }

      task.title = title.trim();
    }


    if (description !== undefined) {
      task.description =
        typeof description === "string" ? description.trim() : "";
    }


    if (assignee !== undefined) {
      task.assignee = assignee || null;
    }


    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority.",
        });
      }

      task.priority = priority;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
    }


    if (labels !== undefined) {
      task.labels = Array.isArray(labels) ? labels : [];
    }


    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status.",
        });
      }

      task.status = status;
    }


    const newStatus = task.status;

    const newAssignee = task.assignee ? task.assignee.toString() : null;


    const statusChanged = oldStatus !== newStatus;

    const assigneeChanged = oldAssignee !== newAssignee;

    const priorityChanged = oldTask.priority !== task.priority;

    const newDueDate = task.dueDate ? task.dueDate.toISOString() : null;

    const dueDateChanged = oldTask.dueDate !== newDueDate;

    const titleChanged = oldTask.title !== task.title;

    const descriptionChanged = oldTask.description !== task.description;

    const labelsChanged =
      JSON.stringify(oldTask.labels) !== JSON.stringify(task.labels);


    await task.save();


    if (statusChanged) {
      await createActivity({
        task: task._id,
        project: project._id,
        user: req.user._id,
        type: "status_changed",
        message: `${req.user.name} moved "${task.title}" from ${oldStatus} to ${newStatus}.`,
        oldValue: oldStatus,
        newValue: newStatus,
      });


      if (newStatus === "done") {
        await notifyTaskCompleted({
          task,
          project,
          actor: req.user,
        });
      }

      else {
        

        if (newAssignee && newAssignee !== getUserId(req.user)) {
          await createNotification({
            recipient: newAssignee,
            sender: req.user._id,
            type: "task_updated",
            title: "Task status updated",
            message: `${req.user.name} moved "${task.title}" to ${newStatus}.`,
            task: task._id,
            project: project._id,
          });
        }
      }
    }

    if (assigneeChanged) {

      if (newAssignee) {
        await createActivity({
          task: task._id,
          project: project._id,
          user: req.user._id,
          type: "assigned",
          message: `${req.user.name} assigned "${task.title}" to an employee.`,
          oldValue: oldAssignee,
          newValue: newAssignee,
        });

        
        await createNotification({
          recipient: newAssignee,
          sender: req.user._id,
          type: "task_assigned",
          title: oldAssignee
            ? "Task reassigned to you"
            : "Task assigned to you",
          message: oldAssignee
            ? `${req.user.name} reassigned the task "${task.title}" to you.`
            : `${req.user.name} assigned you the task "${task.title}".`,
          task: task._id,
          project: project._id,
        });
      }


      if (!newAssignee && oldAssignee) {
        await createActivity({
          task: task._id,
          project: project._id,
          user: req.user._id,
          type: "unassigned",
          message: `${req.user.name} removed the assignee from "${task.title}".`,
          oldValue: oldAssignee,
          newValue: null,
        });

        await createNotification({
          recipient: oldAssignee,
          sender: req.user._id,
          type: "task_updated",
          title: "Task unassigned",
          message: `You are no longer assigned to "${task.title}".`,
          task: task._id,
          project: project._id,
        });
      }


      if (oldAssignee && newAssignee && oldAssignee !== newAssignee) {
        await createNotification({
          recipient: oldAssignee,
          sender: req.user._id,
          type: "task_updated",
          title: "Task reassigned",
          message: `The task "${task.title}" has been reassigned to another employee.`,
          task: task._id,
          project: project._id,
        });
      }
    }

    if (priorityChanged) {
      await createActivity({
        task: task._id,
        project: project._id,
        user: req.user._id,
        type: "priority_changed",
        message: `${req.user.name} changed the priority of "${task.title}" from ${oldTask.priority} to ${task.priority}.`,
        oldValue: oldTask.priority,
        newValue: task.priority,
      });
    }


    if (dueDateChanged) {
      await createActivity({
        task: task._id,
        project: project._id,
        user: req.user._id,
        type: "due_date_changed",
        message: `${req.user.name} changed the due date of "${task.title}".`,
        oldValue: oldTask.dueDate,
        newValue: newDueDate,
      });
    }


    if (labelsChanged) {
      await createActivity({
        task: task._id,
        project: project._id,
        user: req.user._id,
        type: "label_changed",
        message: `${req.user.name} updated labels on "${task.title}".`,
        oldValue: oldTask.labels,
        newValue: task.labels,
      });
    }


    if (titleChanged || descriptionChanged) {
      await createActivity({
        task: task._id,
        project: project._id,
        user: req.user._id,
        type: "updated",
        message: `${req.user.name} updated task "${task.title}".`,
        oldValue: {
          title: oldTask.title,
          description: oldTask.description,
        },
        newValue: {
          title: task.title,
          description: task.description,
        },
      });

      
      if (newAssignee && newAssignee !== getUserId(req.user)) {
        await createNotification({
          recipient: newAssignee,
          sender: req.user._id,
          type: "task_updated",
          title: "Task updated",
          message: `${req.user.name} updated the task "${task.title}".`,
          task: task._id,
          project: project._id,
        });
      }
    }

    const updatedTask = await populateTask(task._id);

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating task.",
    });
  }
};


export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body || {};

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status.",
      });
    }


    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }


    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    const userId = getUserId(req.user);


    const managementAccess = canManageTask(req.user, project);

    const assignedAccess = isAssignedEmployee(task, userId);

    const allowed = managementAccess || assignedAccess;

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You can only update tasks assigned to you.",
      });
    }


    const oldStatus = task.status;

    if (oldStatus === status) {
      const unchangedTask = await populateTask(task._id);

      return res.status(200).json({
        success: true,
        message: "Task status is already up to date.",
        task: unchangedTask,
      });
    }


    task.status = status;

    await task.save();


    await createActivity({
      task: task._id,
      project: project._id,
      user: req.user._id,
      type: "status_changed",
      message: `${req.user.name} moved "${task.title}" from ${oldStatus} to ${status}.`,
      oldValue: oldStatus,
      newValue: status,
    });

    if (status === "done") {
      await notifyTaskCompleted({
        task,
        project,
        actor: req.user,
      });
    }
    else {

      const assigneeId = getId(task.assignee);

      if (assigneeId && assigneeId !== userId) {
        await createNotification({
          recipient: assigneeId,
          sender: req.user._id,
          type: "task_updated",
          title: "Task status updated",
          message: `${req.user.name} moved "${task.title}" to ${status}.`,
          task: task._id,
          project: project._id,
        });
      }
    }


    const updatedTask = await populateTask(task._id);

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating task status.",
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!canManageTask(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this task.",
      });
    }


    await createActivity({
      task: task._id,
      project: project._id,
      user: req.user._id,
      type: "deleted",
      message: `${req.user.name} deleted task "${task.title}".`,
    });


    if (task.assignee && getId(task.assignee) !== getUserId(req.user)) {
      await createNotification({
        recipient: task.assignee,
        sender: req.user._id,
        type: "task_updated",
        title: "Task deleted",
        message: `The task "${task.title}" assigned to you was deleted.`,
        task: task._id,
        project: project._id,
      });
    }

    await Task.findByIdAndDelete(task._id);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting task.",
    });
  }
};


export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignee: req.user._id,
    })
      .populate("assignee", "name email avatar role")
      .populate("creator", "name email avatar role")
      .populate("project", "name color owner members")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get my tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load your tasks.",
    });
  }
};
