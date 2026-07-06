const {
	getNotificationsForUser,
	getUnreadNotificationCount,
	markAllNotificationsAsRead,
	markNotificationAsRead,
	deleteNotification,
} = require("../services/notificationService");

const getNotifications = async (req, res, next) => {
	try {
		const limit = Number(req.query.limit) || 20;
		const [notifications, unreadCount] = await Promise.all([
			getNotificationsForUser({ userId: req.user._id, limit }),
			getUnreadNotificationCount({ userId: req.user._id }),
		]);

		res.status(200).json({
			success: true,
			notifications,
			unreadCount,
		});
	} catch (error) {
		next(error);
	}
};

const markAllAsRead = async (req, res, next) => {
	try {
		await markAllNotificationsAsRead({ userId: req.user._id });

		res.status(200).json({
			success: true,
		});
	} catch (error) {
		next(error);
	}
};

const markAsRead = async (req, res, next) => {
	try {
		const notification = await markNotificationAsRead({
			notificationId: req.params.notificationId,
			userId: req.user._id,
		});

		res.status(200).json({
			success: true,
			notification,
		});
	} catch (error) {
		next(error);
	}
};

const removeNotification = async (req, res, next) => {
	try {
		const notification = await deleteNotification({
			notificationId: req.params.notificationId,
			userId: req.user._id,
		});

		res.status(200).json({
			success: true,
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getNotifications,
	markAllAsRead,
	markAsRead,
	removeNotification,
};
