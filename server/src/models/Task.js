const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
   {
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

      title: {
         type: String,
         required: true,
         trim: true,
      },

      description: {
         type: String,
         default: '',
      },

      assignedTo: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
         },
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

      commentCount: {
         type: Number,
         default: 0,
      },

      attachmentCount: {
         type: Number,
         default: 0,
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

      dueDate: {
         type: Date,
         default: null
      },

      tags: [
         {
            type: String,
            trim: true,
         },
      ],

      position: {
         type: Number,
         // required: true,
      },

      completedAt: {
         type: Date,
         default: null,
      },

      isArchived: {
         type: Boolean,
         default: false,
      },

      archivedAt: {
         type: Date,
         default: null
      },

      archivedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null
      },

      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },

      completedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null,
      },

      startedAt: {
         type: Date,
         default: null,
      },

      updatedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null,
      },

      lastMovedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null,
      },
   },
   {
      timestamps: true,
   }
);
module.exports = mongoose.model("Task", taskSchema);