import express from "express";

import {
  getTaskActivities,
  getProjectActivities,
} from "../controllers/activityController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/task/:taskId", protect, getTaskActivities);

router.get("/project/:projectId", protect, getProjectActivities);





export default router;
