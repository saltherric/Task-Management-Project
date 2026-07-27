const express = require ("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createProject, getProjects, inviteProjectMember, removeProjectMember, updateProject, copyProject, deleteProject} = require("../controllers/projectController");
const router = express.Router();

router.post("/", authMiddleware, createProject);
router.get("/workspace/:workspaceId", authMiddleware, getProjects);
router.post("/:projectId/members", authMiddleware, inviteProjectMember);
router.delete("/:projectId/members/:userId", authMiddleware, removeProjectMember);
router.put("/:projectId", authMiddleware, updateProject);
router.post("/:projectId/copy", authMiddleware, copyProject);
router.delete("/:projectId", authMiddleware, deleteProject);


module.exports = router;
