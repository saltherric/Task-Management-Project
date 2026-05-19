const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Low",
        },

        status: {
            type: String,
            enum: ["Pending", "In Progress", "Completed"],
            default: "Pending"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            dd: true
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Task", taskSchema);

// Setup backend API