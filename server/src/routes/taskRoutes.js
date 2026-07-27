const express = require("express");
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask, moveTask, searchTasks } = require("../controllers/taskController");
const { authMiddleware } = require('../middleware/authMiddleware');
const { taskMiddleware } = require("../middleware/taskMiddleware");
const { getAvailableAssignees, assignUser, removeAssignee } = require("../controllers/assignedToController");
const { archiveTask, unarchiveTask, getArchivedTasks } = require("../controllers/archiveTask");
const { connectTelegramController } = require("../controllers/TelegramController");

router.get("/projects/:projectId", authMiddleware, getTasks);
router.get("/search", authMiddleware, searchTasks);
router.get("/:id", authMiddleware, getTaskById);
router.post("/", authMiddleware, taskMiddleware, createTask);
router.patch("/:taskId", authMiddleware,updateTask);
router.delete("/:taskId", authMiddleware, deleteTask);
router.get("/:taskId/available-assignees", authMiddleware, getAvailableAssignees);
router.put("/:taskId/assignees", authMiddleware, assignUser);
router.delete("/:taskId/assignees/:userId", authMiddleware, removeAssignee);
router.patch("/:taskId/move", authMiddleware, moveTask);
router.patch("/:id/archive", authMiddleware, archiveTask);
router.patch("/:id/unarchive", authMiddleware, unarchiveTask);
router.get("/project/:projectId/archived", authMiddleware, getArchivedTasks);
router.post("/connect-telegram", authMiddleware, connectTelegramController);

module.exports = router;