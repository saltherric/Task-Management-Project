const { default: mongoose } = require("mongoose");

const projectSchema = new mongoose.Schema(
{
   workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
   },

   name: {
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

   visibility: {
      type: String,
      enum: ['private', 'workspace'],
      default: 'workspace',
   },

   sprintEndDate: {
      type: Date,
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

module.exports = mongoose.model("Project", projectSchema);