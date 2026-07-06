const { getBot } = require("../services/te");

const initializeTelegramBot = () => {
    const bot = getBot();

    // Start polling
    bot.startPolling();

    console.log("🤖 Telegram Bot is running...");
};

module.exports = {
    initializeTelegramBot,
};