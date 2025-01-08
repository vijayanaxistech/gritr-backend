"use strict";
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: true,
    },
    roleType: {
      type: Number,
    },
    description: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
   },
  { timestamps: true }
);

module.exports = mongoose.model("Admin_Role", roleSchema);
