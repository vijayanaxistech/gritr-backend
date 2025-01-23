"use strict";
const mongoose = require("mongoose");

const SidebarSchema = new mongoose.Schema(
  {
    sidebar_name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    routeName:{
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    links: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        icon: {
          type: String, // Icon for sidebar link
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Exporting the Sidebar model
module.exports = mongoose.model("Sidebar", SidebarSchema);
