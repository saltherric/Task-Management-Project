const { default: mongoose } = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        description: String,

        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        sprintEndDate: Date,
    },
    {
    timestamps: true,
    }
);

module.exports = mongoose.model("Project", projectSchema);