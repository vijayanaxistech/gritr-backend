const mongoose = require("mongoose");
let Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2"); // Require mongoose-paginate-v2

const userSchema = new mongoose.Schema(
  {
    fullName: {
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
    image: {
      type: String,
      required: false,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    roleType: {
      type: Number,
      required: false,
    },
    whitelabel_url: {
      type: String,
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
    days: {
      type: Number,
      default: true,
    },
     remark: {
      type: String,
      required: false,
    },
    accountType: { 
      type: String, 
      enum: ['demo', 'regular','1Month','2Month','3Month'],
    }
  },
  { timestamps: true }
);
userSchema.plugin(mongoosePaginate);

userSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
