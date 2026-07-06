const express = require("express");
const {createInviteLinkController, validateInviteLinkController, joinWorkspaceController} = require("../controllers/inviteLinkController.js");
const {authMiddleware} = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/:workspaceId/invite-link", authMiddleware, createInviteLinkController);
router.get("/:token", validateInviteLinkController);
router.post("/:token/join", authMiddleware, joinWorkspaceController);

module.exports = router;