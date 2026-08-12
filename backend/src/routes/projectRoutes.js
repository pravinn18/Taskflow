import express from "express";

import {
  createProject,
  getProjects,
  getProject,
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import {
  getMyProjectInvitations,
  acceptProjectInvitation,
  rejectProjectInvitation,
} from "../controllers/projectInvitationController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createProject);

router.post(
  "/invitations/:invitationId/accept",
  protect,
  acceptProjectInvitation,
);

router.post(
  "/invitations/:invitationId/reject",
  protect,
  rejectProjectInvitation,
);

router.get("/", getProjects);

router.get("/invitations", protect, getMyProjectInvitations);

router.get("/:id", getProject);

router.post("/:projectId/members", addProjectMember);

router.get("/:projectId/members", getProjectMembers);

router.delete("/:projectId/members/:userId", removeProjectMember);

router.put("/:id", updateProject);

router.delete("/:id", deleteProject);

export default router;
