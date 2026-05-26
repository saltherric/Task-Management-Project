const { default: mongoose } = require("mongoose");

const attachmentSchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        },

        fileName: String,

        fileUrl: String,

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
    timestamps: true,
    }
);

module.exports = mongoose.model("Attachment", attachmentSchema)