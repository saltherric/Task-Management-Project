const router = require("express").Router();
const {authMiddleware} = require("../middleware/authMiddleware");
const { getComments, createComment } = require("../controllers/commentController");

router.get("/tasks/:taskId/comments", authMiddleware, getComments);
router.post("/tasks/:taskId/comments", authMiddleware, createComment);

module.exports = router;