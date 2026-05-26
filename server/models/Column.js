const { mongo, default: mongoose } = require("mongoose");

const columnSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },

        position: {
            type: Number,
            required: true,
        },

        color: String,
    },
    {
    timestamps: true,
    }
);

module.exports = mongoose.model("Column", columnSchema);