const router = require("express").Router();
const {authMiddleware} = require("../middleware/authMiddleware");
const { createInvitationController, getMyInvitationsController, acceptInvitationController, declineInvitationController, cancelInvitationController, getWorkspaceInvitationsController} = require("../controllers/workspaceInvitationController");

router.post("/:workspaceId/invitations", authMiddleware, createInvitationController);

router.get("/invitations", authMiddleware, getMyInvitationsController);

router.patch("/invitations/:invitationId/accept", authMiddleware, acceptInvitationController);

router.patch("/invitations/:invitationId/decline", authMiddleware, declineInvitationController);

router.delete("/invitations/:invitationId", authMiddleware, cancelInvitationController);

router.get("/:workspaceId/invitations", authMiddleware, getWorkspaceInvitationsController);

module.exports = router;