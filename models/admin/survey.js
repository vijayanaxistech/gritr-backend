import mongoose from "mongoose"; // Use `import` instead of `require`
const { Schema } = mongoose;

// Define the schema for the Survey model
const SurveySchema = new Schema(
  {
    surveyName: { type: String, required: true },
    surveyType: {
      type: String,
      enum: ["Product", "Customer Experience", ""],
      required: false,
    },
    description: { type: String, default: "" },
    geo_area_id: { type: Number },
    regions: { type: [String], required: true },
    state: {
      type: String,
    },
    city: {
      type: String,
    },

    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: Schema.Types.ObjectId, ref: "Survey", default: null },

    isGreaterCity: { type: Boolean, default: false },
    greaterCityName: { type: String, default: null }, // Stores the name of the Greater City if applicable

    isApproved: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    approvedAt: { type: Date },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived"],
      default: "pending",
    },
    rejectionReason: { type: String, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: "User" },

    questions: [
      {
        questionText: { type: String, required: true },
        questionType: {
          type: String,
          enum: ["text", "multiple_choice", "rating"],
          required: true,
        },
        options: [String],
      },
    ],

    approvals: [
      {
        region: String,
        approvalStatus: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        approvedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
        approvedAt: { type: Date },
      },
    ],

    flags: { type: [String], enum: ["Product", "Customer Experience"] },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Export the Survey model
export default mongoose.model("Survey", SurveySchema);
