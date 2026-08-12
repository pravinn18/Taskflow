
import express from "express";

import {
  createTask,
  getProjectTasks,
  getKanbanBoard,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getMyTasks,
} from "../controllers/taskController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect);


router.get("/my-tasks", getMyTasks);


router.get(
  "/project/:projectId",
  getProjectTasks
);


router.get(
  "/project/:projectId/board",
  getKanbanBoard
);


router.get(
  "/:id",
  getTask
);


router.post(
  "/",
  createTask
);


router.put(
  "/:id",
  updateTask
);

router.delete(
  "/:id",
  deleteTask
);

router.patch(
  "/:id/status",
  updateTaskStatus
);

export default router;
