const helper = require("../../helpers/helper");
const BusinessLocation = require('../../models/admin/businessLocation');
const UsCity = require('../../models/admin/UsCity');

module.exports = {
  getBusinessLocations: async (req, res) => {
    try {
      const { page, limit, search } = req.query;

      const pageNumber = Math.max(1, Number(page) || 1);
      const pageSize = Math.max(1, Number(limit) || 10);

      const skip = (pageNumber - 1) * pageSize;

      const searchFilter = search
        ? {
            g_business_name: { $regex: search, $options: 'i' },
          }
        : {};

      const timeoutDuration = 2000;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeoutDuration)
      );

      const businessLocationsPromise = BusinessLocation.find(searchFilter)
        .sort({ _id: 1 })
        .skip(skip)
        .limit(pageSize);

      const totalRecordsPromise = BusinessLocation.estimatedDocumentCount(searchFilter);

      const [businessLocations, totalRecords] = await Promise.race([
        Promise.all([businessLocationsPromise, totalRecordsPromise]),
        timeoutPromise
      ]);
      

      if (businessLocations.length === 0) {
        return helper.success(res, "No records found for the given search criteria.", {
          data: [],
          totalRecords,
          limit: pageSize,
        });
      }

      const lastFetchedId = businessLocations[businessLocations.length - 1]?._id;

      return helper.success(res, "Listing Successfully.", {
        data: businessLocations,
        lastId: lastFetchedId,
        totalRecords,
        limit: pageSize,
      });
    } catch (error) {
      if (error.message === 'Query timeout') {
        return helper.error(res, "No records found for the given search criteria.");
      }

      console.error("Error fetching business locations:", error);
      return helper.error(res, "Error fetching business locations. Please try again.");
    }
  },

  getCity: async (req, res) => {
    try {
        const { page, limit, search } = req.query;

        // Ensure valid pagination parameters
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.max(1, Number(limit) || 10);
        const skip = (pageNumber - 1) * pageSize;

        // Define search filter
        const searchFilter = search
            ? {
                  city: { $regex: search, $options: 'i' }, // Case-insensitive search for city names
              }
            : {};

        // Define a timeout for query execution
        const timeoutDuration = 2000;
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeoutDuration)
        );

        // Query to fetch cities and the total count
        const cityQuery = UsCity.find(searchFilter)
            .select('city') // Fetch only the city field
            .sort({ city: 1 }) // Sort alphabetically by city
            .skip(skip)
            .limit(pageSize);

        const totalRecordsPromise = UsCity.countDocuments(searchFilter);

        // Execute the queries with a race condition for timeout
        const [cities, totalRecords] = await Promise.race([
            Promise.all([cityQuery, totalRecordsPromise]),
            timeoutPromise,
        ]);

        // Check if cities are found
        if (cities.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No records found for the given search criteria.",
                data: [],
                totalRecords,
                limit: pageSize,
            });
        }

        // Remove duplicates from the list of cities (just in case)
        const uniqueCities = [...new Set(cities.map(city => city.city))];

        // Fetch the ID of the last city in the results
        const lastFetchedCity = uniqueCities[uniqueCities.length - 1];

        // Return the results
        return res.status(200).json({
            success: true,
            message: "Listing Successfully.",
            data: uniqueCities,
            lastId: lastFetchedCity,
            totalRecords,
            limit: pageSize,
        });
    } catch (error) {
        if (error.message === 'Query timeout') {
            return res.status(408).json({
                success: false,
                message: "The query took too long to execute. Please try again later.",
            });
        }

        console.error("Error fetching cities:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching cities. Please try again.",
        });
    }
  },


  


};
