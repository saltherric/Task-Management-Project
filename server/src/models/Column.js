const { mongo, default: mongoose } = require("mongoose");

const columnSchema = new mongoose.Schema(
{
   project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
   },

   name: {
      type: String,
      required: true,
   },

   position: {
      type: Number,
      required: true,
   },

   color: {
      type: String,
      default: '#ffffff',
   },
},
{
   timestamps: true,
}
);

module.exports = mongoose.model("Column", columnSchema);