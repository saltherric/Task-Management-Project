const express = require("express");
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require("../controllers/taskController");
const { authMiddleware } = require('../middleware/authMiddleware');
const { taskMiddleware } = require("../middleware/taskMiddleware");

router.get("/", authMiddleware, getTasks);
router.get("/:id", authMiddleware, getTaskById);
router.post("/", authMiddleware, taskMiddleware, createTask);
router.put("/:id", authMiddleware, updateTask);
router.delete("/:id", authMiddleware, deleteTask);

module.exports = router;