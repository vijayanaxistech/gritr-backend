const mongoose = require('mongoose');
const { Schema } = mongoose;

const SurveySchema = new Schema(
  {
    surveyName: {
      type: String,
      required: true,
      unique: true,  // Ensure that the name of the survey is unique
    },
    surveyType: {
      type: String,
      required: true,
      enum: ['Product', 'Customer Experience'],  // Valid survey types
    },
    description: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default:false,
    },    
    isApproved: { 
      type: Boolean, 
      default: false 
    }, 
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',  // Default status when the survey is first created
    },
    region: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',  // Link to the admin user who created the survey
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',  // Link to the admin user who last updated the survey
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        questionType: {
          type: String,
          enum: ['text', 'multiple_choice', 'rating'],  // Different question types
          required: true,
        },
        options: [String],  // Options for multiple choice questions
      },
    ],
    flags: {
      type: [String],  // e.g., ['Product', 'Customer Experience']
      enum: ['Product', 'Customer Experience'],
    },
    approvals: [
      {
        region: String,
        approvalStatus: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        approvedBy: {
          type: Schema.Types.ObjectId,
          ref: 'AdminUser',
        },
        approvedAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,  // Automatically add createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Survey', SurveySchema);
