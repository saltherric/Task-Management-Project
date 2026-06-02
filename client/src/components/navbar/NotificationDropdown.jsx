import React from 'react'

function NotificationDropdown({
    notifications,
    unreadCount,
    isDark,
    markAllAsRead,
    removeNotification,
    getNotificationIcon,
}) {
  return (
    <div
        className = {`absolute right-0 mt-3.5 w-80 origin-top-right rounded-2xl shadow-xl ring-opacity-5 focus:outline-none z-50 ${
            isDark 
                ? "bg-slate-950"
                : "bg-white"
        }`}
    >
        <div
            className={`flex items-center justify-between border-b px-3 py-2.5 ${
                isDark ? "border-slate-900" : "border-slate-100"
            }`}
        >
            <span
                className={`text-sm font-semibold ${
                    isDark ? "text-white" : "text-slate-900"
                }`}
            >
                Notifications
            </span>

            {unreadCount > 0 && (
            <button
                className={`text-xs font-medium ${
                    isDark
                    ? 'text-indigo-400 hover:text-indigo-300'
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}
                onClick={markAllAsRead}
            >
                Mark all as read
            </button>
            )}
        </div>

        <div className="notif-scrollbar max-h-80 overflow-y-auto mt-1.5 space-y-1">
            {notifications.length === 0 ? (
            <div
                className={`py-8 text-center text-sm ${
                isDark ? "text-slate-500" : "text-slate-400"
                }`}
            >
                No notifications
            </div>
            ) : (
            notifications.map((notif) => (
                <div
                    key={notif.id}
                    className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150${
                        isDark
                        ? "hover:bg-slate-900/60"
                        : "hover:bg-slate-50"
                    }`}
                >
                <div className="mt-0.5">
                    {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1">
                    <p className={`text-xs leading-normal ${
                        notif.read
                        ? isDark
                            ? "text-slate-400"
                            : "text-slate-500"
                        : isDark
                            ? "text-slate-200 font-semibold"
                            : "text-slate-700 font-semibold"
                        }`}
                    >
                    {notif.text}
                    </p>        

                    <span
                    className={`text-[10px] ${
                        isDark
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                    >
                    {notif.time}
                    </span>
                </div>

                <button
                    onClick={(e) =>
                    removeNotification(notif.id, e)
                    }
                >
                    ✕
                </button>
                </div>
            ))
            )}
        </div>
    </div>
  )
}

export { NotificationDropdown }