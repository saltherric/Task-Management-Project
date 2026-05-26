const express = require("express");
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require("../controllers/taskController");
const { protect } = require('../middleware/authMiddleware');
const { validateProjectAndColumn } = require("../middleware/projectMiddleware");

router.get("/", protect, getTasks);
router.get("/:id", protect, getTaskById);
router.post("/", protect, validateProjectAndColumn, createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

module.exports = router;