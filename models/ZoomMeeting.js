"use strict";
const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let ZoomMeeting = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Admin_User",
      autopopulate: true,
    },
    topic: {
      type: String,
      required: true,
    },
    uuid: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    host_id: {
      type: String,
      required: false,
    },
    host_email: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    start_time: {
      type: String,
      required: false,
    },
    duration: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    join_url: {
      type: String,
      required: true,
    },
    start_url: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ZoomMeeting", ZoomMeeting);
