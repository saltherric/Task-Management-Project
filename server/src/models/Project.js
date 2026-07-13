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

   // These users are the only workspace members, besides the creator, who can
   // open a private project. Workspace-visible projects ignore this list.
   members: [
      {
         user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
         },
         invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
         },
         joinedAt: {
            type: Date,
            default: Date.now,
         },
      },
   ],

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
