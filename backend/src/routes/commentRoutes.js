import express from "express";

import {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/task/:taskId", protect, getTaskComments);


router.post("/task/:taskId", protect, createComment);

router.put("/:commentId", protect, updateComment);

router.delete("/:commentId", protect, deleteComment);

export default router;
