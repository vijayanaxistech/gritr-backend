const helper = require("../helpers/helper");
const BusinessLocation = require('../models/businessLocation');

module.exports = {
  getBusinessLocations: async (req, res) => {
    try {
      const { page, limit } = req.query;

      // Ensure the page and limit are numbers and greater than zero
      const pageNumber = Math.max(1, Number(page) || 1); // Default to page 1
      const pageSize = Math.max(1, Number(limit) || 10); // Default to limit of 10

      // Calculate the number of records to skip based on the page number
      const skip = (pageNumber - 1) * pageSize;

      // Fetch business locations and total records in parallel
      const [businessLocations, totalRecords] = await Promise.all([
        BusinessLocation.find()
          .sort({ _id: 1 }) // Sort by _id in ascending order for pagination
          .skip(skip) // Skip records for the previous pages
          .limit(pageSize), // Limit the number of records fetched
        BusinessLocation.estimatedDocumentCount(), // Faster, approximate count
      ]);

      // Get the last fetched id to be used as `lastId` for the next page
      const lastFetchedId = businessLocations[businessLocations.length - 1]?._id;

      return helper.success(res, "Listing Successfully.", {
        data: businessLocations,
        lastId: lastFetchedId, // To fetch the next page based on this ID
        totalRecords, // Approximate total record count
        limit: pageSize,
      });
    } catch (error) {
      console.error("Error fetching business locations:", error);
      return helper.error(res, "Error fetching business locations. Please try again.");
    }
  },
};
