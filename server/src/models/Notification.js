const { default: mongoose } = require("mongoose");

const notificationSchema = new mongoose.Schema(
{
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },

   task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
   },

   type: {
      type: String,
      enum: [
         'task_assigned',
         'deadline_reminder',
         'task_completed',
         'overdue',
      ],
   },

   message: {
      type: String,
      required: true,
   },

   isRead: {
      type: Boolean,
      default: false,
   },

   sentToTelegram: {
      type: Boolean,
      default: false,
   },
},
{
   timestamps: true,
}
);

module.exports = mongoose.model("Notification", notificationSchema);