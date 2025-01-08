const mongoose = require("mongoose");
let Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2"); // Require mongoose-paginate-v2

const adminUserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    sidebarIds: [],
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    roleType: {
      type: Number,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Apply pagination plugin
adminUserSchema.plugin(mongoosePaginate);

// Override toJSON to remove sensitive data
adminUserSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Export the model with "Admin_User" name
module.exports = mongoose.model("Admin_User", adminUserSchema);
