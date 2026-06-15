const express = require("express");
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask, moveTask } = require("../controllers/taskController");
const { authMiddleware } = require('../middleware/authMiddleware');
const { taskMiddleware } = require("../middleware/taskMiddleware");
const { getAvailableAssignees, assignUser, removeAssignee } = require("../controllers/assignedToController");

router.get("/projects/:projectId", authMiddleware, getTasks);
router.get("/:id", authMiddleware, getTaskById);
router.post("/", authMiddleware, taskMiddleware, createTask);
router.patch("/:taskId", authMiddleware,updateTask);
router.delete("/:id", authMiddleware, deleteTask);
router.get("/:taskId/available-assignees", authMiddleware, getAvailableAssignees);
router.put("/:taskId/assignees", authMiddleware, assignUser);
router.delete("/:taskId/assignees/:userId", authMiddleware, removeAssignee);
router.patch("/:taskId/move", authMiddleware, moveTask);
module.exports = router;