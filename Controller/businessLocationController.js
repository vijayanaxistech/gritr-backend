const helper = require("../helpers/helper");
const BusinessLocation = require('../models/businessLocation');

module.exports = {
  getBusinessLocations: async (req, res) => {
    try {
      const { page, limit, search } = req.query;

      // Ensure the page and limit are numbers and greater than zero
      const pageNumber = Math.max(1, Number(page) || 1); // Default to page 1
      const pageSize = Math.max(1, Number(limit) || 10); // Default to limit of 10

      // Calculate the number of records to skip based on the page number
      const skip = (pageNumber - 1) * pageSize;

      // Build the search filter (case insensitive partial match)
      const searchFilter = search
        ? {
            g_business_name: { $regex: search, $options: 'i' }, // Assuming "name" is the field you want to search on
          }
        : {};

      console.log('Search Filter:', searchFilter);

      // Set a faster timeout for the query execution (e.g., 2 seconds timeout)
      const timeoutDuration = 2000; // 2 seconds timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeoutDuration)
      );

      // Fetch business locations in parallel, applying the search filter
      const businessLocationsPromise = BusinessLocation.find(searchFilter)
        .sort({ _id: 1 }) // Sort by _id in ascending order for pagination
        .skip(skip) // Skip records for the previous pages
        .limit(pageSize); // Limit the number of records fetched

      // Fetch the total count of business locations (without pagination)
      const totalRecordsPromise = BusinessLocation.estimatedDocumentCount(searchFilter);

      // Use Promise.race to handle the timeout and queries concurrently
      const [businessLocations, totalRecords] = await Promise.race([
        Promise.all([businessLocationsPromise, totalRecordsPromise]),
        timeoutPromise
      ]);

      console.log('Fetched business locations:', businessLocations.length);

      // If no records are found
      if (businessLocations.length === 0) {
        return helper.success(res, "No records found for the given search criteria.", {
          data: [],
          totalRecords,
          limit: pageSize,
        });
      }

      // Get the last fetched id to be used as `lastId` for the next page
      const lastFetchedId = businessLocations[businessLocations.length - 1]?._id;

      return helper.success(res, "Listing Successfully.", {
        data: businessLocations,
        lastId: lastFetchedId, // To fetch the next page based on this ID
        totalRecords, // Total record count
        limit: pageSize,
      });
    } catch (error) {
      // Handle query timeout error separately
      if (error.message === 'Query timeout') {
        return helper.error(res, "Your search is taking longer than expected. Please refine your search or try again later.");
      }

      console.error("Error fetching business locations:", error);
      return helper.error(res, "Error fetching business locations. Please try again.");
    }
  },
};
