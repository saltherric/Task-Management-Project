const { createTelegramConnectionLink } = require("../services/telegramConnectionService");

const connectTelegramController = async (req, res, next) => {
    try {

        const url = await createTelegramConnectionLink(req.user._id);

        res.json({
            success: true,
            url,
        });

    } catch (err) {
        next(err);
    }
};

module.exports = {
    connectTelegramController,
};