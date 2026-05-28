const { default: mongoose } = require("mongoose");

const attachmentSchema = new mongoose.Schema(
{
   task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
   },

   fileName: {
      type: String,
      required: true,
   },

   fileUrl: {
      type: String,
      required: true,
   },

   uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
},
{
   timestamps: true,
}
);

module.exports = mongoose.model("Attachment", attachmentSchema)