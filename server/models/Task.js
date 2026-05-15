const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: true,
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
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Task", taskSchema);

// Setup backend API