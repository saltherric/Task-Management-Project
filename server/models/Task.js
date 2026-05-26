const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            default: '',
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },

        column: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Column',
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        assignedTo: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],

        status: {
            type: String,
            enum: [
                'todo',
                'inprogress',
                'review',
                'done',
            ],
            default: 'todo',
        },

        priority: {
            type: String,
            enum: [
                'low',
                'medium',
                'high',
            ],
            default: 'medium',
        },

        smartPriorityScore: {
            type: Number,
            default: 0,
        },

        tags: [String],

        dueDate: Date,

        position: {
            type: Number,
            required: true,
        },

        completedAt: Date,

        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
    timestamps: true,
    }
);

module.exports = mongoose.model("Task", taskSchema);