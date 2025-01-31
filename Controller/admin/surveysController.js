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
      // Validate request body
      const v = new Validator(req.body, {
        surveyName: "required",
        surveyType: "required",
        region: "required",
      });

      const errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      // Check if the survey name already exists
      const checkSurveyName = await Survey.findOne({ surveyName: v.inputs.surveyName });

      if (checkSurveyName) {
        return helper.error(res, "This survey name is already in use");
      }

      // Create a new survey
      const survey = new Survey({
        ...req.body,
        createdBy: req.user.id,  // Assuming `req.user` contains logged-in user info
      });

      await survey.save();
      return helper.success(res, "Survey Created Successfully.", survey);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  editSurvey: async (req, res) => {
    try {
      // Extract the survey ID from the URL params
      const surveyId = req.params.id;

      // Validate the incoming data
      const v = new Validator(req.body, {
        surveyName: "required",
        surveyType: "required|in:Product,Customer Experience", // ensure it's either Product or Customer Experience
        region: "required",
      });

      const errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors); // Return validation errors
      }

      // Find the survey by ID
      let survey = await Survey.findById(surveyId);
      if (!survey) {
        return helper.error(res, "Survey not found"); // Return error if survey is not found
      }

      // Update the survey fields
      survey.surveyName = req.body.surveyName || survey.surveyName;
      survey.surveyType = req.body.surveyType || survey.surveyType;
      survey.description = req.body.description || survey.description; // Optional field
      survey.region = req.body.region || survey.region;
      survey.updatedBy = req.user._id; // Assuming req.user contains the logged-in admin's info

      // Save the updated survey
      await survey.save();

      // Return success response
      return helper.success(res, "Survey updated successfully.", survey);
    } catch (error) {
      // Handle any unexpected errors
      return helper.error(res, error.message);
    }
  },


  getAllSurveys: async (req, res) => {
    try {
      let { surveyType, region, page, limit, sortBy, order } = req.query;

      let filter = { isDeleted: false }; // Only fetch non-deleted surveys

      if (surveyType) filter.surveyType = surveyType;
      if (region) filter.region = region;

      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;

      let sortOptions = {};
      if (sortBy) {
        sortOptions[sortBy] = order === "desc" ? -1 : 1;
      } else {
        sortOptions.createdAt = -1;
      }

      const surveys = await Survey.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

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
      return helper.error(res, error.message);
    }
  },


  getSurveyById: async (req, res) => {
    try {
     
      const surveyId = req.params.id;     
      if (!surveyId.match(/^[0-9a-fA-F]{24}$/)) {
        return helper.error(res, "Invalid survey ID format");
      }
      const survey = await Survey.findById(surveyId);   
      if (!survey) {
        return helper.error(res, "Survey not found");
      }  
      return helper.success(res, "Survey retrieved successfully", survey);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },


  deleteSurvey: async (req, res) => {
      try {
        const surveyId = req.params.id;
  
        // Validate MongoDB ObjectId format
        if (!surveyId) {
          return helper.error(res, "Invalid survey ID format");
        }
  
        // Find the survey
        const survey = await Survey.findById(surveyId);
  
        if (!survey) {
          return helper.error(res, "Survey not found");
        }
  
        // Check if the survey is already deleted
        if (survey.isDeleted) {
          return helper.error(res, "Survey is already deleted");
        }
  
        // Soft delete the survey (update isDeleted to true)
        survey.isDeleted = true;
        await survey.save();
  
        return helper.success(res, "Survey deleted successfully", { surveyId });
      } catch (error) {
        return helper.error(res, error.message);
      }
  },  

  flagSurvey: async (req, res) => {
    try {
      const surveyId = req.params.id;
      const { flag } = req.body;

      // Validate MongoDB ObjectId format
      if (!surveyId) {
        return helper.error(res, "Invalid survey ID format");
      }

      // Validate flag value
      const validFlags = ["Product", "Customer Experience"];
      if (!validFlags.includes(flag)) {
        return helper.error(res, "Invalid flag. Allowed values: 'Product', 'Customer Experience'");
      }

      // Find the survey
      const survey = await Survey.findById(surveyId);

      if (!survey) {
        return helper.error(res, "Survey not found");
      }

      // Ensure the survey is not deleted
      if (survey.isDeleted) {
        return helper.error(res, "Cannot flag a deleted survey");
      }

      // Update the survey flag
      survey.flag = flag;
      await survey.save();

      return helper.success(res, "Survey flagged successfully", { surveyId, flag });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  approveSurvey: async (req, res) => {
    try {
      const surveyId = req.params.id;

      // Validate MongoDB ObjectId format
      if (!surveyId) {
        return helper.error(res, "Invalid survey ID format");
      }

      // Find the survey
      const survey = await Survey.findById(surveyId);

      if (!survey) {
        return helper.error(res, "Survey not found");
      }

      // Ensure the survey is not deleted
      if (survey.isDeleted) {
        return helper.error(res, "Cannot approve a deleted survey");
      }

      // Check if already approved
      if (survey.isApproved) {
        return helper.error(res, "Survey is already approved");
      }

      // Approve the survey
      survey.isApproved = true;
      await survey.save();

      // Auto-approve similar surveys in different regions
      await Survey.updateMany(
        { surveyName: survey.surveyName, surveyType: survey.surveyType, isDeleted: false },
        { $set: { isApproved: true } }
      );

      return helper.success(res, "Survey approved successfully", { surveyId, isApproved: true });
    } catch (error) {
      return helper.error(res, error.message);
    }
  },




};
