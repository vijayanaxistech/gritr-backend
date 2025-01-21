const helper = require("../helpers/helper");
const BusinessLocation = require('../models/businessLocation');

module.exports = {
  getBusinessLocations: async (req, res) => {
    try {
      const { lastId, limit = 10 } = req.query;

      const query = lastId ? { _id: { $gt: lastId } } : {};

      // Fetch business locations and total records in parallel
      const [businessLocations, totalRecords] = await Promise.all([
        BusinessLocation.find(query)
          .sort({ _id: 1 }) // Sort by _id in ascending order for pagination
          .limit(Number(limit)), // Limit the number of records fetched
        BusinessLocation.estimatedDocumentCount(), // Faster, approximate count
      ]);

      const lastFetchedId = businessLocations[businessLocations.length - 1]?._id;

      return helper.success(res, "Listing Successfully.", {
        data: businessLocations,
        lastId: lastFetchedId, // To fetch the next page
        totalRecords, // Approximate total record count
        limit: Number(limit),
      });
    } catch (error) {
      console.error("Error fetching business locations:", error);
      return helper.error(res, "Error fetching business locations. Please try again.");
    }
  },
};
