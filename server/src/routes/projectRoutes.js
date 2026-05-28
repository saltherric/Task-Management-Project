const express = require ("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createProject } = require("../controllers/projectController");
const router = express.Router();

router.post("/", authMiddleware, createProject);

module.exports = router;