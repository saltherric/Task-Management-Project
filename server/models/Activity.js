const { default: mongoose } = require("mongoose");
const { act } = require("react");

const activitySchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        action: {
            type: String,
            required: true,
        },

        details: String,
    },
    {
    timestamps: true,
    }
);

module.exports = mongoose.model("Activity", activitySchema);