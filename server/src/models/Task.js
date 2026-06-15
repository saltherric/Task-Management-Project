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

   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      },
   ],

   position: {
      type: Number,
      required: true,
   },

   completedAt: {
      type: Date,
      default: null,
   },

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