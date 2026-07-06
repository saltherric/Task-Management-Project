const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createWorkspace, getWorkspaces, createTag, getTags, getWorkspaceMembers, getAvailableMembers, invitesMember, updateMemberRole} = require("../controllers/workspaceController");
const router = express.Router();

router.post("/", authMiddleware, createWorkspace);
router.get("/", authMiddleware, getWorkspaces);
router.post("/:workspaceId/tags", authMiddleware, createTag);
router.get("/:workspaceId/tags", authMiddleware, getTags);
router.get("/:workspaceId/members", authMiddleware, getWorkspaceMembers);
router.get("/:workspaceId/availableMembers", authMiddleware, getAvailableMembers);
router.post("/:workspaceId/invite", authMiddleware, invitesMember)
router.patch("/:workspaceId/members/:memberId/role", authMiddleware, updateMemberRole);
module.exports = router;