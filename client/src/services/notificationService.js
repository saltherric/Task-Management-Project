import API from "./api";

const getNotifications = async (limit = 20) => {
	const response = await API.get("/notifications", {
		params: { limit },
		t: Date.now()
	});

	return response.data;
};

const markAllNotificationsAsRead = async () => {
	const response = await API.patch("/notifications/read-all");
	return response.data;
};

const markNotificationAsRead = async (notificationId) => {
	const response = await API.patch(`/notifications/${notificationId}/read`);
	return response.data;
};

const deleteNotification = async (notificationId) => {
	const response = await API.delete(`/notifications/${notificationId}`);
	return response.data;
};

export {
	getNotifications,
	markAllNotificationsAsRead,
	markNotificationAsRead,
	deleteNotification,
};
