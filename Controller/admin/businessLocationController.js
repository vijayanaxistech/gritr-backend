const helper = require("../../helpers/helper");
const BusinessLocation = require('../../models/admin/businessLocation');

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
};
