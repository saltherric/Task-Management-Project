const { v4: uuidv4 } = require("uuid");
const TelegramConnectionToken = require("../models/TelegramConnectionToken");

const createTelegramConnectionLink = async (userId) => {

    // Remove any previous token for this user
    await TelegramConnectionToken.deleteOne({
        user: userId,
    });

    const token = uuidv4();

    await TelegramConnectionToken.create({
        user: userId,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    return `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}`;
};

module.exports = {
    createTelegramConnectionLink,
};