"use strict";
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    role_name: {
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
    modules: [
      {
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        moduleName: {
          type: String,
          required: true,
        },
        isDeleted: {
          type: Boolean,
          default: false,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        deleteAccess: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
