const User = require("../../models/front/User");
const { Validator } = require("node-input-validator");
const helper = require("../../helpers/helper");
const BusinessLocation = require("../../models/admin/businessLocation");
const UsCity = require("../../models/admin/UsCity");
const Survey = require("../../models/admin/survey");

const cleanQuestion = (text, regions) => {
  if (!text) return ""; // Handle empty or undefined input
  if (!Array.isArray(regions)) return text; // Ensure regions is an array

  // Create a regex pattern from the regions array
  const regex = new RegExp(
    `\\b(in|at|near)\\s+(${regions.join("|")})\\b`,
    "gi"
  );

  return text.replace(regex, "").trim(); // Remove location phrases
};

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
        surveyName: "required|string",
        surveyType: "string",
        regions: "required|array",
        questions: "array",
        geo_area_id: "required",
        greater_city_area: "string",
        isGreaterCity: "boolean",
      });

      console.log(req.body);

      const errors = v.errors;
      if (errors && Object.keys(errors).length > 0) {
        return helper.error(res, errors);
      }

      // Ensure `regions` is always an array
      const regionsArray = Array.isArray(v.inputs.regions)
        ? v.inputs.regions
        : [v.inputs.regions];

      // Extract city and state from the first region string
      let city = null;
      let state = null;

      if (regionsArray.length > 0) {
        const regionParts = regionsArray[0]
          .split(",")
          .map((part) => part.trim()); // Split by comma and trim spaces

        let potentialCity = regionParts[0] || null; // First part as city
        state = regionParts[1] || null; // Second part as state

        // Ensure city does not start with "Greater" (case insensitive)
        if (potentialCity && !/^greater\s/i.test(potentialCity)) {
          city = potentialCity;
        } else {
          city = state; // Assign state to city if the first part is "Greater something"
          state = regionParts[2] || null; // Move the state to the next part if available
        }
      }

      // Clean surveyName using dynamic regions
      v.inputs.surveyName = cleanQuestion(v.inputs.surveyName, regionsArray);

      // Clean questions using dynamic regions
      if (Array.isArray(v.inputs.questions)) {
        v.inputs.questions = v.inputs.questions.map((q) =>
          cleanQuestion(q, regionsArray)
        );
      }

      // Use `greater_city_area` and `isGreaterCity` directly from request body
      const manage = {
        isGreaterCity: v.inputs.isGreaterCity || false,
        greaterCityName: v.inputs.greater_city_area || null,
      };

      // Ensure greaterCityName is provided if `isGreaterCity` is true
      if (manage.isGreaterCity && !manage.greaterCityName) {
        return helper.error(res, "Greater City Name is required.");
      }

      // Check if a similar survey already exists
      const existingSurvey = await Survey.findOne({
        surveyName: v.inputs.surveyName,
      });

      // Create a new survey with isDuplicate: true if a duplicate is found
      const survey = new Survey({
        ...req.body,
        createdBy: req.user.userId,
        isApproved: false,
        city: city, // Extracted first part as city
        state: state, // Extracted second part as state
        status: "pending",
        isDuplicate: !!existingSurvey,
        ...manage, // Dynamically insert greater city info
      });

      // Save the new survey to the database
      await survey.save();

      // Respond accordingly
      return helper.success(
        res,
        existingSurvey
          ? "Duplicate survey found and saved."
          : "Survey Created Successfully.",
        survey
      );
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
  getAllSurveys1: async (req, res) => {
    try {
      let { surveyType, region, page, limit, sortBy, order, search } =
        req.query;

      // Initialize filter to exclude deleted surveys
      let matchStage = { isDeleted: false };

      // Apply filters
      if (surveyType) matchStage.surveyType = surveyType;
      if (region) matchStage.region = region;
      if (search) matchStage.surveyName = { $regex: search, $options: "i" };

      // Aggregation to get distinct surveys by surveyName
      const surveys = await Survey.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$surveyName",
            doc: { $first: "$$ROOT" }, // Get the first document for each distinct surveyName
          },
        },
        { $replaceRoot: { newRoot: "$doc" } }, // Replace root to return full document
        { $sort: { createdAt: -1 } }, // Default sorting
      ]);

      return helper.success(res, "Distinct surveys fetched successfully", {
        surveys,
      });
    } catch (error) {
      return helper.error(res, error.message); // Handle errors
    }
  },

  getAllSurveys: async (req, res) => {
    try {
      let { surveyType, region, page, limit, sortBy, order, search } =
        req.query;

      // Initialize filter to exclude deleted surveys
      let matchStage = { isDeleted: false };

      // Apply filters
      if (surveyType) matchStage.surveyType = surveyType;
      if (region) matchStage.region = region;
      if (search) matchStage.surveyName = { $regex: search, $options: "i" };

      // Sorting configuration
      let sortStage = {};
      if (sortBy) {
        sortStage[sortBy] = order === "desc" ? -1 : 1;
      } else {
        sortStage.createdAt = -1; // Default sorting
      }

      // Pagination
      const pageNumber = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * pageSize;

      // Query to get all surveys
      const surveys = await Survey.find(matchStage)
        .sort(sortStage)
        .skip(skip)
        .limit(pageSize);

      return helper.success(res, "Surveys fetched successfully", { surveys });
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
        return helper.error(
          res,
          "Invalid flag. Allowed values: 'Product', 'Customer Experience'"
        );
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

      return helper.success(res, "Survey flagged successfully", {
        surveyId,
        flag,
      });
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

  /**
   * Updates the active status of a user.
   * Validates `isActive` and updates it along with the `updatedAt` timestamp.
   */

  updateSurveyStatus: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        status: "required|string|in:pending,approved,rejected",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      req.body.updatedAt = new Date();

      const updatedSurvey = await Survey.findOneAndUpdate(
        { _id: req.params.id },
        { status: v.inputs.status, updatedAt: req.body.updatedAt },
        { new: true }
      );

      if (!updatedSurvey) {
        return helper.error(res, "Survey not found");
      }

      return helper.success(
        res,
        "Survey status updated successfully.",
        updatedSurvey
      );
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  updateTagStatus: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        tags: "required|string|in:none,product,customerExperience", // Validate "tags" instead of "flags"
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      req.body.updatedAt = new Date();

      const updatedSurvey = await Survey.findOneAndUpdate(
        { _id: req.params.id },
        {
          flags: v.inputs.tags, // Update "flags" field using "tags" from request body
          updatedAt: req.body.updatedAt,
        },
        { new: true }
      );

      if (!updatedSurvey) {
        return helper.error(res, "Survey not found");
      }

      console.log(updatedSurvey);

      return helper.success(
        res,
        "Survey tag (flags) updated successfully.",
        updatedSurvey
      );
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  getCitySurvey: async (req, res) => {
    try {
      const { search } = req.body;

      if (!search) {
        return helper.success(res, "Please enter a search term.", []);
      }

      let searchFilter = {};
      let notificationMessage = null;

      // Ensure search starts with user input (strict match for city)
      const searchStartRegex = new RegExp(`^${search}`, "i");

      if (/Greater\s+/i.test(search)) {
        // If searching for a "Greater" city area, find exact match first
        const greaterCityMatch = await UsCity.findOne({
          greater_city_area: { $regex: searchStartRegex },
        });

        if (greaterCityMatch) {
          // Fetch all cities in that Greater City Area
          searchFilter = {
            greater_city_area: greaterCityMatch.greater_city_area,
          };
          const cityCount = await UsCity.countDocuments(searchFilter);
          notificationMessage = `You selected ${greaterCityMatch.greater_city_area}, which includes ${cityCount} cities.`;
        } else {
          return helper.success(res, "No Greater City Area found.", []);
        }
      } else {
        // General city search: Strictly match cities that start with input
        searchFilter = {
          city: { $regex: searchStartRegex },
        };
      }

      // Set timeout for query execution
      const timeoutDuration = 2000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), timeoutDuration)
      );

      // Fetch matching cities, limit results for better performance
      const cityQuery = UsCity.find(searchFilter)
        .select("city greater_city_area state_name county_fips geo_area_id")
        .sort({ city: 1 }) // Sort alphabetically
        .limit(20);

      const cities = await Promise.race([cityQuery, timeoutPromise]);

      if (!cities.length) {
        return helper.success(res, "No records found.", []);
      }

      return helper.success(
        res,
        "Listing Successfully.",
        cities,
        null,
        null,
        null,
        notificationMessage
      );
    } catch (error) {
      if (error.message === "Query timeout") {
        return helper.error(
          res,
          "Query took too long to execute. Try again later.",
          408
        );
      }

      console.error("Error fetching cities:", error);
      return helper.error(res, "Error fetching cities. Please try again.");
    }
  },

  getChildCitySurvey: async (req, res) => {
    try {
      const { search } = req.body;

      if (!search) {
        return helper.success(res, "Please enter a search term.", []);
      }

      let searchFilter = {};
      let notificationMessage = null;

      // Ensure search starts with user input (strict match for city)
      const searchStartRegex = new RegExp(`^${search}`, "i");

      if (/Greater\s+/i.test(search)) {
        // If searching for a "Greater" city area, find exact match first
        const greaterCityMatch = await UsCity.findOne({
          greater_city_area: { $regex: searchStartRegex },
        });

        if (greaterCityMatch) {
          // Fetch all cities in that Greater City Area
          searchFilter = {
            greater_city_area: greaterCityMatch.greater_city_area,
          };
          const cityCount = await UsCity.countDocuments(searchFilter);
          notificationMessage = `You selected ${greaterCityMatch.greater_city_area}, which includes ${cityCount} cities.`;
        } else {
          return helper.success(res, "No Greater City Area found.", []);
        }
      } else {
        // General city search: Strictly match cities that start with input
        searchFilter = {
          city: { $regex: searchStartRegex },
        };
      }

      // Set timeout for query execution
      const timeoutDuration = 2000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), timeoutDuration)
      );

      // Fetch matching cities, limit results for better performance
      const cityQuery = UsCity.find(searchFilter)
        .select("city greater_city_area state_name county_fips geo_area_id")
        .sort({ city: 1 }); // Sort alphabetically

      const cities = await Promise.race([cityQuery, timeoutPromise]);

      if (!cities.length) {
        return helper.success(res, "No records found.", []);
      }

      return helper.success(
        res,
        "Listing Successfully.",
        cities,
        null,
        null,
        null,
        notificationMessage
      );
    } catch (error) {
      if (error.message === "Query timeout") {
        return helper.error(
          res,
          "Query took too long to execute. Try again later.",
          408
        );
      }

      console.error("Error fetching cities:", error);
      return helper.error(res, "Error fetching cities. Please try again.");
    }
  },

  getFrontUserById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return helper.error(res, "User ID is required.");
      }

      const user = await User.findById(id);
      if (!user) {
        return helper.error(res, "User not found.");
      }

      return helper.success(res, "User fetched successfully.", user);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  markDuplicate: async (req, res) => {
    try {
      const { id: surveyId, isDuplicate } = req.body; // ✅ Corrected destructuring

      // Find the survey
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        return helper.error(res, "Survey not found.");
      }

      // Update isDuplicate flag
      survey.isDuplicate = isDuplicate;
      await survey.save();

      return helper.success(
        res,
        `Survey marked as ${isDuplicate ? "Duplicate" : "Not Duplicate"}.`,
        survey
      );
    } catch (error) {
      return helper.error(res, error.message);
    }
  },
};
