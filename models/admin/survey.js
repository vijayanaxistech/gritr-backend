const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema for the Survey model
const SurveySchema = new Schema(
  {
    // Name of the survey (unique and required)
    surveyName: {
      type: String,
      required: true,
      unique: false, // Ensure survey name is unique across all surveys
    },

    // Type of survey (Product or Customer Experience)
    surveyType: {
      type: String,
      required: true,
      enum: ["Product", "Customer Experience"], // Valid survey types
    },

    // Description of the survey (optional)
    description: {
      type: String,
      default: "", // Default to empty string if not provided
    },

    // Soft delete flag (marks the survey as deleted)
    isDeleted: {
      type: Boolean,
      default: false, // Default to not deleted
    },

    isDuplicate: {
      type: Boolean,
      default: false,
    },

    // Approval status of the survey
    isApproved: {
      type: Boolean,
      default: false, // Default to false (not approved yet)
    },

    // Current status of the survey (pending, approved, rejected)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"], // Valid status values
      default: "pending", // Default to 'pending' when created
    },

    // Region where the survey is applicable (required)
    region: {
      type: String,
      required: true,
    },

    // Reason for rejection (if applicable)
    rejectionReason: {
      type: String,
      default: null, // Default to null if no rejection reason is provided
    },

    // Admin user who created the survey (required)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to the admin user who created the survey
      required: true,
    },

    // Admin user who last updated the survey (optional)
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to the admin user who last updated the survey
    },

    // List of questions in the survey
    questions: [
      {
        questionText: {
          type: String,
          required: true, // Question text is required
        },
        questionType: {
          type: String,
          enum: ["text", "multiple_choice", "rating"], // Valid question types
          required: true, // Question type is required
        },
        options: [String], // Options for multiple choice questions
      },
    ],

    // Flags for categorizing the survey (e.g., Product, Customer Experience)
    flags: {
      type: [String], // Array of flags
      enum: ["Product", "Customer Experience"], // Valid flags
    },

    // Survey approval details for different regions
    approvals: [
      {
        region: String, // Region for approval
        approvalStatus: {
          type: String,
          enum: ["pending", "approved", "rejected"], // Approval status for the region
          default: "pending", // Default to 'pending' when added
        },
        approvedBy: {
          type: Schema.Types.ObjectId,
          ref: "AdminUser", // Reference to the admin user who approved the survey
        },
        approvedAt: {
          type: Date, // Date when the survey was approved
        },
      },
    ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Export the Survey model
module.exports = mongoose.model("Survey", SurveySchema);
