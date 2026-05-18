const express = require("express");
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require("../controllers/taskController");

router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;