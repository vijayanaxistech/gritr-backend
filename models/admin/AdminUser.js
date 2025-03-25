import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

let Schema = mongoose.Schema;

const adminUserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    userName: { type: String, required: true },
    password: { type: String, required: true, select: false },
    sidebarIds: [],
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
    roleType: { type: Number },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

adminUserSchema.plugin(mongoosePaginate);

adminUserSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// ✅ Use ES Module export
export default mongoose.model("Admin_User", adminUserSchema);
