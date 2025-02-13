const Survey = require("../../models/admin/survey");
const { Validator } = require("node-input-validator");
const helper = require("../../helpers/helper");
const BusinessLocation = require('../../models/admin/businessLocation');
const UsCity = require('../../models/admin/UsCity');

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
      
      console.log(req.body);      

      const errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      // Check if the survey name already exists in the database
      const checkSurveyName = await Survey.findOne({ surveyName: v.inputs.surveyName });
      if (checkSurveyName) {
        await Survey.updateOne(
          { surveyName: v.inputs.surveyName },
          { $set: { isDuplicate: true } }
        );             
      }

      // Create a new survey document with request data
      const survey = new Survey({
        ...req.body,
        createdBy: req.user.userId, // Store the ID of the logged-in user as creator
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
        let { surveyType, region, page, limit, sortBy, order, search } = req.query;

        // Initialize filter to exclude deleted surveys
        let filter = { isDeleted: false };

        // Apply filters for surveyType and region if present
        if (surveyType) filter.surveyType = surveyType;
        if (region) filter.region = region;

        // Apply search filter if provided
        if (search) {
            filter.surveyName = { $regex: search, $options: "i" }; // Case-insensitive search
        }

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

   /**
   * Updates the active status of a user.
   * Validates `isActive` and updates it along with the `updatedAt` timestamp.
   */
   updateSurveyStatus: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        isApproved: "required|boolean",
      });

      let errors = v.errors;
      if (errors && errors.length > 0) {
        return helper.error(res, errors);
      }

      req.body.updatedAt = new Date();

      const updatedRole = await Survey.findOneAndUpdate(
        { _id: req.params.id },
        { isApproved: v.inputs.isApproved, updatedAt: req.body.updatedAt },
        { new: true }
      );

      if (!updatedRole) {
        return helper.error(res, "Survey not found");
      }

      return helper.success(res, "Survey status updated successfully.", updatedRole);
    } catch (error) {
      return helper.error(res, error.message);
    }
  },

  getCitySurvey1: async (req, res) => {
      try {
          const { page, limit, search } = req.body;
  
          // Ensure valid pagination parameters
          const pageNumber = Math.max(1, Number(page) || 1);
          const pageSize = Math.max(1, Number(limit) || 10);
          const skip = (pageNumber - 1) * pageSize;
  
          let searchFilter = {}; 
      
          if (search) {     
              // Exact match for Greater City Area (case-insensitive)
              const greaterCityMatch = await UsCity.findOne({ 
                  greater_city_area: { $regex: `^${search}$`, $options: 'i' } 
              });
  

              if (greaterCityMatch) {
                  // If a Greater City Area is found, fetch all cities in that area
                  searchFilter = { greater_city_area: greaterCityMatch.greater_city_area };
              } else {
                  // Otherwise, search for the city name
                  searchFilter = { city: { $regex: search, $options: 'i' } };
              }
          }
  
          // Define a timeout for query execution
          const timeoutDuration = 2000;
          const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout')), timeoutDuration)
          );
  
          // Query to fetch city data and the total count
          const cityQuery = UsCity.find(searchFilter)
              .select('city greater_city_area state_name county_fips') // Fetch only relevant fields
              .sort({ city: 1 }) // Sort alphabetically by city
              .skip(skip)
              .limit(pageSize);
  
          const totalRecordsPromise = UsCity.countDocuments(searchFilter);
  
          // Execute the queries with a race condition for timeout
          const [cities, totalRecords] = await Promise.race([
              Promise.all([cityQuery, totalRecordsPromise]),
              timeoutPromise,
          ]);
  
          // Check if any results were found
          if (cities.length === 0) {
              return helper.success(res, "No records found for the given search criteria.", [], totalRecords, pageSize);
          }
  
          // Fetch the ID of the last city in the results
          const lastFetchedCity = cities[cities.length - 1]?.city || null;
  
          // Return formatted results using the helper.success method
          return helper.success(res, "Listing Successfully.", cities, totalRecords, pageSize, lastFetchedCity);
  
      } catch (error) {
          if (error.message === 'Query timeout') {
              return helper.error(res, "The query took too long to execute. Please try again later.", 408);
          }
  
          console.error("Error fetching cities:", error);
          return helper.error(res, "Error fetching cities. Please try again.");
      }
  },

  getCitySurvey: async (req, res) => {
    try {
        const { page, limit, search } = req.body;

        // Ensure valid pagination parameters
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.max(1, Number(limit) || 10);
        const skip = (pageNumber - 1) * pageSize;

        let searchFilter = {};
        let notificationMessage = null;

        if (search) {
            const searchRegex = new RegExp(search, "i");

            // Check if search contains "Greater" (for Metropolitan Area search)
            if (/Greater\s+/i.test(search)) {
                const cityName = search.replace(/Greater\s+/i, "").trim();

                // Find the first matching Greater City Area
                const greaterCityMatch = await UsCity.findOne({ 
                    greater_city_area: { $regex: searchRegex } 
                });

                if (greaterCityMatch) {
                    // Fetch all cities in that Greater City Area
                    searchFilter = { greater_city_area: greaterCityMatch.greater_city_area };
                    const cityCount = await UsCity.countDocuments(searchFilter);
                    notificationMessage = `You have selected ${greaterCityMatch.greater_city_area}, which includes ${cityCount} cities.`;
                } else {
                    // Fallback: If no Greater City Area found, search normally
                    searchFilter = { city: searchRegex };
                }
            } else {
                // Normal city search
                const cityMatch = await UsCity.findOne({ city: searchRegex });

                if (cityMatch && cityMatch.greater_city_area) {
                    // If the city belongs to a Greater City Area, fetch all cities in that area
                    searchFilter = { greater_city_area: cityMatch.greater_city_area };
                    const cityCount = await UsCity.countDocuments(searchFilter);
                    notificationMessage = `You have selected ${cityMatch.greater_city_area}, which includes ${cityCount} cities.`;
                } else {
                    // If no Greater City Area exists, return just the city
                    searchFilter = { city: searchRegex };
                }
            }
        }

        // Define a timeout for query execution
        const timeoutDuration = 2000;
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Query timeout")), timeoutDuration)
        );

        // Query to fetch city data and the total count
        const cityQuery = UsCity.find(searchFilter)
            .select("city greater_city_area state_name county_fips")
            .sort({ city: 1 })  // Sort alphabetically by city
            .skip(skip)
            .limit(pageSize);

        const totalRecordsPromise = UsCity.countDocuments(searchFilter);

        // Execute the queries with a race condition for timeout
        const [cities, totalRecords] = await Promise.race([
            Promise.all([cityQuery, totalRecordsPromise]),
            timeoutPromise,
        ]);

        // Check if any results were found
        if (cities.length === 0) {
            return helper.success(res, "No records found for the given search criteria.", [], totalRecords, pageSize);
        }

        // Fetch the last fetched city's name
        const lastFetchedCity = cities[cities.length - 1]?.city || null;

        // Return formatted results
        return helper.success(res, "Listing Successfully.", cities, totalRecords, pageSize, lastFetchedCity, notificationMessage);

    } catch (error) {
        if (error.message === "Query timeout") {
            return helper.error(res, "The query took too long to execute. Please try again later.", 408);
        }

        console.error("Error fetching cities:", error);
        return helper.error(res, "Error fetching cities. Please try again.");
    }
  },


  


};
