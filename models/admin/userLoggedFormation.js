"use strict";
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"; // Use import instead of require

let Schema = mongoose.Schema;

let userLoggedFormationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Admin_User",
    },
    channel: {
      type: String,
      default: "WEB",
      enum: ["WEB", "IOS", "ANDROID"],
      required: true,
    },
    ip: {
      type: String,
    },
    token: {
      type: String,
    },
    deviceId: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Apply pagination plugin
userLoggedFormationSchema.plugin(mongoosePaginate);

// Correct schema reference in the model export
export default mongoose.model("UserLoggedFormation", userLoggedFormationSchema);
