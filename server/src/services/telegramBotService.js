const TelegramConnectionToken = require("../models/TelegramConnectionToken");
const User = require("../models/User");
const { getBot } = require("./telegramService");

let isInitialized = false;

const sendSafeMessage = async (bot, chatId, text) => {
    try {
        await bot.sendMessage(chatId, text);
    } catch (error) {
        console.error("Failed to send Telegram bot reply:", error.message);
    }
};

const connectTelegramAccount = async (bot, msg, token) => {
    const chatId = String(msg.chat.id);

    if (!token) {
        await sendSafeMessage(
            bot,
            chatId,
            "Open the connection link from the app to finish linking your account."
        );
        return;
    }

    const connectionToken = await TelegramConnectionToken.findOne({ token });

    if (!connectionToken) {
        await sendSafeMessage(
            bot,
            chatId,
            "That connection link is invalid or has expired. Please generate a new one from the app."
        );
        return;
    }

    if (connectionToken.expiresAt < new Date()) {
        await TelegramConnectionToken.deleteOne({ _id: connectionToken._id });

        await sendSafeMessage(
            bot,
            chatId,
            "That connection link has expired. Please generate a new one from the app."
        );
        return;
    }

    const user = await User.findById(connectionToken.user);

    if (!user) {
        await TelegramConnectionToken.deleteOne({ _id: connectionToken._id });

        await sendSafeMessage(
            bot,
            chatId,
            "We could not find the matching account. Please request a new connection link from the app."
        );
        return;
    }

    user.telegram.chatId = chatId;
    user.telegram.username = msg.from?.username || null;
    user.telegram.connected = true;
    await user.save();

    await TelegramConnectionToken.deleteOne({ _id: connectionToken._id });

    await sendSafeMessage(
        bot,
        chatId,
        "Telegram connected successfully!"
    );

    await sendSafeMessage(
        bot,
        chatId,
        "Send /test to verify notifications."
    );
};

const handleTelegramTest = async (bot, msg) => {
    const chatId = String(msg.chat.id);
    const user = await User.findOne({
        "telegram.chatId": chatId,
        "telegram.connected": true,
    });

    if (!user) {
        await sendSafeMessage(
            bot,
            chatId,
            "No connected account was found for this chat. Use the app to generate a new connection link first."
        );
        return;
    }

    await sendSafeMessage(
        bot,
        chatId,
        "Test message received. Telegram delivery is working."
    );
};

const initializeTelegramBot = async () => {
    if (isInitialized) {
        return;
    }

    let bot;

    try {
        bot = getBot();
        console.log("BOT CREATED SUCCESSFULLY");
        bot.on("message", (msg) => {
            console.log("🔥 RAW MESSAGE:", msg.text, msg.chat.id);
        });
    } catch (error) {
        console.warn("Telegram bot not initialized:", error.message);
        return;
    }

    bot.onText(/^\/start(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
        try {
            const token = match?.[1]?.trim();

            if (token) {
                console.log("Received token:", token);
            }

            await connectTelegramAccount(bot, msg, token);
        } catch (error) {
            console.error("Telegram connection failed:", error);
            await sendSafeMessage(
                bot,
                String(msg.chat.id),
                "We could not complete the connection. Please try again from the app."
            );
        }
    });

    bot.onText(/^\/test(?:@\w+)?(?:\s+.*)?$/, async (msg) => {
        try {
            await handleTelegramTest(bot, msg);
        } catch (error) {
            console.error("Telegram test failed:", error);
            await sendSafeMessage(
                bot,
                String(msg.chat.id),
                "We could not send the test message right now. Please try again."
            );
        }
    });

    bot.on("polling_error", (error) => {
        console.error("Telegram polling error:", error.message);
    });

    try {
        await bot.startPolling();
    } catch (error) {
        console.warn("Telegram polling could not start:", error.message);
        return;
    }

    isInitialized = true;
    console.log("Telegram bot initialized and polling.");
};

module.exports = {
    initializeTelegramBot,
};
