const mongoose = require("mongoose");

const telegramConnectionTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        token: {
            type: String,
            required: true,
            unique: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Automatically remove expired tokens
telegramConnectionTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    "TelegramConnectionToken",
    telegramConnectionTokenSchema
);