const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { workspaceMiddleware } = require("../middleware/workspaceMiddleware");
const { getActivities } = require("../controllers/activityController");

const router = express.Router();

router.get("/workspace/:workspaceId", authMiddleware, workspaceMiddleware, getActivities);

module.exports = router;