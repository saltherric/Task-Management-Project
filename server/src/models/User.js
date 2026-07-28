const mongoose = require("mongoose");

const authProviderSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            enum: ["google", "github"],
            required: true,
        },
        providerId: {
            type: String,
            required: true, 
        },
    },
    { _id: false }
);

const refreshTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
        },

        password: {
            type: String,
            select: false,
        },

        authProviders: {
            type: [authProviderSchema],
            default: [],
        },

        avatar: {
            type: String,
            default: null,
        },

        notificationSettings: {
            taskAssigned: {
                type: Boolean,
                default: true,
            },
            commentsMentions: {
                type: Boolean,
                default: true,
            },
            dueReminders: {
                type: Boolean,
                default: true,
            },
            smartPriority: {
                type: Boolean,
                default: false,
            },
        },

        telegram: {
            chatId: {
                type: String,
                default: null,
            },
            username: {
                type: String,
                default: null,
            },
            connected: {
                type: Boolean,
                default: false,
            },
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        verificationToken: {
            type: String,
            default: null,
        },

        verificationTokenExpires: {
            type: Date,
            default: null,
        },

        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },

        refreshTokens: {
            type: [refreshTokenSchema],
            default: [],
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },

        lastPasswordChangedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate OAuth accounts
userSchema.index(
    {
        "authProviders.provider": 1,
        "authProviders.providerId": 1,
    },
    {
        unique: true,
        sparse: true,
    }
);

module.exports = mongoose.model("User", userSchema);
