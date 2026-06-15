const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createWorkspace, getWorkspaces } = require("../controllers/workspaceController");

const router = express.Router();

router.post("/", authMiddleware, createWorkspace);
router.get("/", authMiddleware, getWorkspaces);

module.exports = router;