const TelegramBot = require("node-telegram-bot-api").default;

let bot = null;

const getBot = () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }

    if (!bot) {
        bot = new TelegramBot(token, {
            polling: false,
        });
    }

    return bot;
};

const escapeHTML = (text) => {
    if (!text) return "";
    return text.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
};

const getTelegramHeaderEmoji = (type) => {
    if (type === "TASK_ASSIGNED" || type === "TASK_UNASSIGNED") {
        return "👤";
    }
    if (type === "TASK_COMPLETED") {
        return "✅";
    }
    if (type === "TASK_MOVED") {
        return "🔄";
    }
    if (type === "MENTION" || type === "COMMENT_ADDED" || type === "COMMENT_REPLY") {
        return "💬";
    }
    if (type === "WORKSPACE_ROLE_CHANGED") {
        return "👑";
    }
    if (type === "TASK_DUE_SOON" || type === "TASK_OVERDUE") {
        return "⏰";
    }
    return "🔔";
};

const getTelegramHeader = (type) => {
    if (type === "TASK_ASSIGNED" || type === "TASK_UNASSIGNED") {
        return "Task Assignee Updated";
    }
    if (type === "TASK_UPDATED") {
        return "Task Updated";
    }
    if (type === "TASK_COMPLETED") {
        return "Task Completed";
    }
    if (type === "TASK_MOVED") {
        return "Task Moved";
    }
    if (type === "MENTION") {
        return "You Were Mentioned";
    }
    if (type === "WORKSPACE_ROLE_CHANGED") {
        return "Role Updated";
    }
    if (type === "TASK_DUE_SOON") {
        return "Task Due Soon";
    }
    if (type === "TASK_OVERDUE") {
        return "Task Overdue";
    }
    if (type === "COMMENT_ADDED" || type === "COMMENT_REPLY") {
        return "New Comment Added";
    }
    return null;
};

const formatPriority = (priority) => {
    if (!priority) return "None";
    return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatTaskAssignees = (assignees) => {
    if (!assignees || assignees.length === 0) return "Unassigned";
    return assignees.join(", ");
};

const formatTelegramMessage = (payload) => {
    const title = payload.title;
    const message = payload.message;
    const actionUrl = payload.actionUrl;
    const type = payload.type;
    const workspaceName = payload.workspaceName;
    const projectName = payload.projectName;
    const taskTitle = payload.taskTitle;
    const taskPriority = payload.taskPriority;
    const taskAssignees = payload.taskAssignees;
    const senderName = payload.senderName;
    const recipientName = payload.recipientName;
    const commentText = payload.commentText;
    const metadata = payload.metadata;

    const bodyParts = [];

    const escapedWorkspace = escapeHTML(workspaceName);
    const escapedProject = escapeHTML(projectName);
    const escapedTask = escapeHTML(taskTitle);
    const escapedSender = escapeHTML(senderName);
    const escapedRecipient = escapeHTML(recipientName);

    if (type === "TASK_MOVED") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        
        let toColumn = "";
        if (metadata && metadata.toColumn) {
            toColumn = metadata.toColumn;
        } else if (message) {
            const parts = message.split('to "');
            if (parts.length > 1) {
                toColumn = parts[1].split('"')[0];
            }
        }
        if (toColumn) {
            bodyParts.push(`📥 <b>New Column:</b> ${escapeHTML(toColumn)}`);
        }
        if (escapedSender) bodyParts.push(`✍️ <b>Moved By:</b> ${escapedSender}`);

    } else if (type === "TASK_ASSIGNED") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        if (escapedRecipient) bodyParts.push(`👷 <b>Assigned To:</b> ${escapedRecipient}`);
        if (escapedSender) bodyParts.push(`✍️ <b>Updated By:</b> ${escapedSender}`);

    } else if (type === "TASK_UPDATED") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        
        let updateDetail = "";
        if (message) {
            const parts = message.split("updated the ");
            if (parts.length > 1) {
                const afterUpdated = parts[1];
                const ofParts = afterUpdated.split(" of ");
                if (ofParts.length > 1) {
                    updateDetail = "Updated the " + ofParts[0];
                }
            }
        }
        
        if (updateDetail) {
            bodyParts.push(`📝 <b>Detail:</b> ${escapeHTML(updateDetail)}`);
        } else if (message) {
            let cleanMessage = escapeHTML(message);
            const quoteParts = cleanMessage.split('"');
            if (quoteParts.length > 2) {
                for (let i = 1; i < quoteParts.length; i += 2) {
                    quoteParts[i] = `<i>"${quoteParts[i]}"</i>`;
                }
                cleanMessage = quoteParts.join("");
                cleanMessage = cleanMessage.split('""').join('"');
            }
            bodyParts.push(cleanMessage);
        }
        
        if (escapedSender) bodyParts.push(`✍️ <b>Updated By:</b> ${escapedSender}`);

    } else if (type === "TASK_UNASSIGNED") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        if (escapedRecipient) bodyParts.push(`👷 <b>Removed:</b> ${escapedRecipient}`);
        if (escapedSender) bodyParts.push(`✍️ <b>Updated By:</b> ${escapedSender}`);

    } else if (type === "TASK_COMPLETED") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        if (escapedSender) bodyParts.push(`✍️ <b>Completed By:</b> ${escapedSender}`);

    } else if (type === "COMMENT_ADDED" || type === "COMMENT_REPLY") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        if (commentText) {
            bodyParts.push(`💬 <b>Comment:</b> <i>"${escapeHTML(commentText)}"</i>`);
        }
        if (escapedSender) bodyParts.push(`✍️ <b>Commented By:</b> ${escapedSender}`);

    } else if (type === "MENTION") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        if (escapedSender) bodyParts.push(`✍️ <b>Mentioned By:</b> ${escapedSender}`);

    } else if (type === "TASK_DUE_SOON" || type === "TASK_OVERDUE") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        bodyParts.push(`🚦 <b>Priority:</b> ${formatPriority(taskPriority)}`);
        bodyParts.push(`👤 <b>Assignee:</b> ${formatTaskAssignees(taskAssignees)}`);

    } else if (type === "WORKSPACE_ROLE_CHANGED") {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        let roleName = "Member";
        if (metadata && metadata.role) {
            roleName = metadata.role.charAt(0).toUpperCase() + metadata.role.slice(1);
        }
        bodyParts.push(`🔑 <b>New Role:</b> ${roleName}`);
        if (escapedSender) bodyParts.push(`✍️ <b>Changed By:</b> ${escapedSender}`);

    } else {
        if (escapedWorkspace) bodyParts.push(`🏢 <b>Workspace:</b> ${escapedWorkspace}`);
        if (escapedProject) bodyParts.push(`📁 <b>Project:</b> ${escapedProject}`);
        if (escapedTask) bodyParts.push(`📌 <b>Task:</b> ${escapedTask}`);
        if (message) bodyParts.push(escapeHTML(message));
    }

    if (actionUrl) {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const url = `${clientUrl}${actionUrl}`;
        bodyParts.push(`🔗 <a href="${url}">Open Task</a>`);
    }

    const headerEmoji = getTelegramHeaderEmoji(type);
    const headerText = getTelegramHeader(type) || title || "Notification";

    return `${headerEmoji} <b>${headerText}</b>\n\n${bodyParts.join("\n")}`;
};

const normalizeTelegramPayload = (chatIdOrPayload, maybeMessage) => {
    if (chatIdOrPayload && typeof chatIdOrPayload === "object") {
        return {
            chatId: chatIdOrPayload.chatId,
            message: formatTelegramMessage(chatIdOrPayload),
        };
    }

    return {
        chatId: chatIdOrPayload,
        message: maybeMessage,
    };
};

const sendTelegramMessage = async (chatIdOrPayload, maybeMessage) => {
    const { chatId, message } = normalizeTelegramPayload(chatIdOrPayload, maybeMessage);

    try {
        await getBot().sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
        console.error("Telegram API Error:", err.message);
        throw err;
    }
};

module.exports = {
    getBot,
    sendTelegramMessage,
};
