const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema for the Survey model
const SurveySchema = new Schema(
  {
    // Name of the survey (required)
    surveyName: {
      type: String,
      required: true,
    },

    // Type of survey (Product or Customer Experience)
    surveyType: {
      type: String,
      required: false,
      enum: ["Product", "Customer Experience", ""],
    },

    // Description of the survey (optional)
    description: {
      type: String,
      default: "",
    },

    // Geo area ID (Unique and Indexed)
    geo_area_id: {
      type: Number,
      unique: true,
      index: true,
    },

    // Region(s) where the survey is applicable (supports multiple cities)
    regions: {
      type: [String],
      required: true,
    },

    // Duplicate survey reference
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOf: {
      type: Schema.Types.ObjectId,
      ref: "Survey", // Reference to original survey if this is a duplicate
      default: null,
    },

    // Survey approval tracking
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser", // Admin who approved the survey
    },
    approvedAt: {
      type: Date,
    },

    // Status of the survey (includes 'archived' for soft deletes)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived"],
      default: "pending",
    },

    // Reason for rejection (if applicable)
    rejectionReason: {
      type: String,
      default: null,
    },

    // Survey creator details
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // List of questions in the survey
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        questionType: {
          type: String,
          enum: ["text", "multiple_choice", "rating"],
          required: true,
        },
        options: [String],
      },
    ],

    // Survey approval details for different regions
    approvals: [
      {
        region: String,
        approvalStatus: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        approvedBy: {
          type: Schema.Types.ObjectId,
          ref: "AdminUser",
        },
        approvedAt: {
          type: Date,
        },
      },
    ],

    // Flags for categorization
    flags: {
      type: [String],
      enum: ["Product", "Customer Experience"],
    },

    // Soft delete flag (controlled via `status: "archived"`)
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Export the Survey model
module.exports = mongoose.model("Survey", SurveySchema);
