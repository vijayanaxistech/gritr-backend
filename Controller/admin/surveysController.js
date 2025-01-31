const Survey = require("../../models/admin/survey");
const { Validator } = require("node-input-validator");
const helper = require("../../helpers/helper");

module.exports = {
  /**
   * @desc    Create a new survey
   * @route   POST /surveys/create
   * @access  Protected (Admin)
   */
  create: async (req, res) => {
    try {
      // Validate request body to ensure required fields are present
      const v = new Validator(req.body, {
        surveyName: "required",
        surveyType: "required",
        region: "required",
      });

      const errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      // Check if the survey name already exists in the database
      const checkSurveyName = await Survey.findOne({ surveyName: v.inputs.surveyName });
      if (checkSurveyName) {
        return helper.error(res, "This survey name is already in use");
      }

      // Create a new survey document with request data
      const survey = new Survey({
        ...req.body,
        createdBy: req.user.id, // Store the ID of the logged-in user as creator
      });

      // Save the new survey to the database
      await survey.save();
      return helper.success(res, "Survey Created Successfully.", survey);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  /**
   * @desc    Edit an existing survey
   * @route   PUT /surveys/edit/:id
   * @access  Protected (Admin)
   */
  editSurvey: async (req, res) => {
    try {
      // Extract the survey ID from URL params
      const surveyId = req.params.id;

      // Validate incoming data for survey update
      const v = new Validator(req.body, {
        surveyName: "required",
        surveyType: "required|in:Product,Customer Experience", // Ensure valid survey type
        region: "required",
      });

      const errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors); // Return validation errors
      }

      // Find the survey by ID
      let survey = await Survey.findById(surveyId);
      if (!survey) {
        return helper.error(res, "Survey not found");
      }

      // Update the survey with provided data
      survey.surveyName = req.body.surveyName || survey.surveyName;
      survey.surveyType = req.body.surveyType || survey.surveyType;
      survey.description = req.body.description || survey.description; // Optional
      survey.region = req.body.region || survey.region;
      survey.updatedBy = req.user._id; // Store the ID of the logged-in user as updater

      // Save the updated survey to the database
      await survey.save();

      // Return success response with updated survey data
      return helper.success(res, "Survey updated successfully.", survey);
    } catch (error) {
      return helper.error(res, error.message); // Return error message if something goes wrong
    }
  },

  /**
   * @desc    Get all surveys with pagination, sorting, and filtering
   * @route   GET /surveys
   * @access  Protected (Admin)
   */
  getAllSurveys: async (req, res) => {
    try {
      let { surveyType, region, page, limit, sortBy, order } = req.query;

      // Initialize filter to exclude deleted surveys
      let filter = { isDeleted: false };

      // Apply filters for surveyType and region if present
      if (surveyType) filter.surveyType = surveyType;
      if (region) filter.region = region;

      // Parse pagination parameters
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;

      // Sorting options based on provided query params
      let sortOptions = {};
      if (sortBy) {
        sortOptions[sortBy] = order === "desc" ? -1 : 1;
      } else {
        sortOptions.createdAt = -1; // Default sort by creation date descending
      }

      // Fetch surveys based on filters, pagination, and sorting
      const surveys = await Survey.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

      // Count total surveys for pagination
      const totalSurveys = await Survey.countDocuments(filter);

      return helper.success(res, "Surveys fetched successfully", {
        surveys,
        pagination: {
          totalSurveys,
          currentPage: page,
          totalPages: Math.ceil(totalSurveys / limit),
        },
      });
    } catch (error) {
      return helper.error(res, error.message); // Handle errors
    }
  },

  /**
   * @desc    Get a survey by its ID
   * @route   GET /surveys/:id
   * @access  Protected (Admin)
   */
  getSurveyById: async (req, res) => {
    try {
      const surveyId = req.params.id;

      // Validate MongoDB ObjectId format
      if (!surveyId.match(/^[0-9a-fA-F]{24}$/)) {
        return helper.error(res, "Invalid survey ID format");
      }

      // Find the survey by ID
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        return helper.error(res, "Survey not found");
      }

      return helper.success(res, "Survey retrieved successfully", survey);
    } catch (error) {
      return helper.error(res, error.message); // Handle errors
    }
  },

  /**
   * @desc    Soft delete a survey (mark as deleted)
   * @route   DELETE /surveys/:id
   * @access  Protected (Admin)
   */
  deleteSurvey: async (req, res) => {
    try {
      const surveyId = req.params.id;

      // Validate MongoDB ObjectId format
      if (!surveyId) {
        return helper.error(res, "Invalid survey ID format");
      }

      // Find the survey by ID
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        return helper.error(res, "Survey not found");
      }

      // Check if the survey is already deleted
      if (survey.isDeleted) {
        return helper.error(res, "Survey is already deleted");
      }

      // Mark the survey as deleted (soft delete)
      survey.isDeleted = true;
      await survey.save();

      return helper.success(res, "Survey deleted successfully", { surveyId });
    } catch (error) {
      return helper.error(res, error.message); // Handle errors
    }
  },

  /**
   * @desc    Flag a survey with a specific category
   * @route   PUT /surveys/:id/flag
   * @access  Protected (Admin)
   */
  flagSurvey: async (req, res) => {
    try {
      const surveyId = req.params.id;
      const { flag } = req.body;

      // Validate MongoDB ObjectId format
      if (!surveyId) {
        return helper.error(res, "Invalid survey ID format");
      }

      // Ensure the flag value is valid
      const validFlags = ["Product", "Customer Experience"];
      if (!validFlags.includes(flag)) {
        return helper.error(res, "Invalid flag. Allowed values: 'Product', 'Customer Experience'");
      }

      // Find the survey by ID
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        return helper.error(res, "Survey not found");
      }

      // Ensure the survey is not deleted
      if (survey.isDeleted) {
        return helper.error(res, "Cannot flag a deleted survey");
      }

      // Set the flag for the survey
      survey.flag = flag;
      await survey.save();

      return helper.success(res, "Survey flagged successfully", { surveyId, flag });
    } catch (error) {
      return helper.error(res, error.message); // Handle errors
    }
  },

  /**
   * @desc    Approve a survey and auto-approve similar surveys in different regions
   * @route   PUT /surveys/:id/approve-similar
   * @access  Protected (Admin)
   */
  approveSimilarSurveys: async (req, res) => {
    try {
      const surveyId = req.params.id;

      // Validate MongoDB ObjectId format
      if (!surveyId) {
        return helper.error(res, "Invalid survey ID format");
      }

      // Find the survey by ID
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        return helper.error(res, "Survey not found");
      }

      // Ensure the survey is not deleted
      if (survey.isDeleted) {
        return helper.error(res, "Cannot approve a deleted survey");
      }

      // Approve the current survey
      survey.isApproved = true;
      await survey.save();

      // Auto-approve similar surveys in different regions
      const similarSurveys = await Survey.updateMany(
        {
          surveyName: survey.surveyName,
          surveyType: survey.surveyType,
          region: { $ne: survey.region }, // Different region
          isDeleted: false,
        },
        { $set: { isApproved: true } }
      );

      return helper.success(res, "Similar surveys approved successfully", {
        surveyId,
        similarSurveysUpdated: similarSurveys.modifiedCount,
      });
    } catch (error) {
      return helper.error(res, error.message); // Handle errors
    }
  },
};
