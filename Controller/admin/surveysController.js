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
};
