"use strict";
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2"); // Require mongoose-paginate-v2

let Schema = mongoose.Schema;

let userLoggedFormation = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    deviceId:{
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
userLoggedFormation.plugin(mongoosePaginate);

module.exports = mongoose.model("userLoggedFormation", userLoggedFormation);
