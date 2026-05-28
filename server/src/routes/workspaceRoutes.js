const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createWorkspace } = require("../controllers/workspaceController");

const router = express.Router();

router.post("/", authMiddleware, createWorkspace);

module.exports = router;