import express from "express";

import {
  createInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
} from "../controllers/invitationController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Invitation routes are working",
  });
});


router.post("/projects/:projectId", protect, createInvitation);



router.get("/", protect, getMyInvitations);



router.put("/:invitationId/accept", protect, acceptInvitation);


router.put("/:invitationId/reject", protect, rejectInvitation);

export default router;
