const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
	getNotifications,
	markAllAsRead,
	markAsRead,
	removeNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.patch("/:notificationId/read", authMiddleware, markAsRead);
router.delete("/:notificationId", authMiddleware, removeNotification);

module.exports = router;
