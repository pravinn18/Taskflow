import express from "express";

import {
  getAvailableUsers,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from "../controllers/projectMemberController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/users", getAvailableUsers);

router.get("/:projectId/members", getProjectMembers);

router.post("/:projectId/members", addProjectMember);

router.delete("/:projectId/members/:userId", removeProjectMember);

export default router;
