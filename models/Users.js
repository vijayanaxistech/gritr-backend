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
    masterIds: [],
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    credit: {
      type: Number,
      required: false,
    },
    available_balance:{
      type: Number,
      required: false,
    },
    roleType: {
      type: Number,
      required: false,
    },
    whitelabel_url: {
      type: String,
      required: false,
    },
    active_channel_no: {
      type: Number,
      default: true,
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
    subscriptionType: {
      type: String,
      enum: ["Free", "Demo", "Unpaid", "Paid"],
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
