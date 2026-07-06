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

const formatTelegramMessage = ({ title, message, actionUrl }) => {
    const parts = [];

    if (title) parts.push(`🔔 ${title}`);

    if (message) parts.push(message);

    if (actionUrl) {
        parts.push(`${process.env.CLIENT_URL}${actionUrl}`);
    }

    return parts.join("\n\n");
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
        await getBot().sendMessage(chatId, message);
    } catch (err) {
        console.error(err);
        throw err;
    }
};

module.exports = {
    getBot,
    sendTelegramMessage,
};
