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

      // Fetch business locations and total records in parallel, applying the search filter
      const [businessLocations, totalRecords] = await Promise.all([
        BusinessLocation.find(searchFilter)
          .sort({ _id: 1 }) // Sort by _id in ascending order for pagination
          .skip(skip) // Skip records for the previous pages
          .limit(pageSize), // Limit the number of records fetched
        BusinessLocation.estimatedDocumentCount(searchFilter), // Count the filtered documents
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


// module.exports = {
//   getBusinessLocations: async (req, res) => {
//     try {
//       const { page, limit, search } = req.query;

//       // Ensure the page and limit are numbers and greater than zero
//       const pageNumber = Math.max(1, Number(page) || 1); // Default to page 1
//       const pageSize = Math.max(1, Number(limit) || 10); // Default to limit of 10

//       // Calculate the number of records to skip based on the page number
//       const skip = (pageNumber - 1) * pageSize;

//       // Build the search filter (case-sensitive exact match)
//       const searchFilter = search
//         ? { g_business_name: { $eq: search } } // Use $eq for exact match
//         : {};


        
// const search1 = "Coffee";
// const searchFilter1 = { g_business_name: { $eq: search1 } };

// const results1 = await BusinessLocation.find(searchFilter1)
//   .sort({ _id: 1 })
//   .limit(10);

// console.log("Results:", results1);

//       // Check the total count of documents that match the search filter
//       const totalRecords = await BusinessLocation.estimatedDocumentCount(searchFilter);

//       console.log('totalRecords:', totalRecords);

//       // If no records are found, return a "No records found" message
//       if (totalRecords === 0) {
//         return helper.success(res, "No records found.", {
//           data: [],
//           lastId: null,
//           totalRecords: 0,
//           limit: pageSize,
//         });
//       }

//       // Fetch business locations with search filter, if applicable
//       const businessLocations = await BusinessLocation.find(searchFilter)
//         .sort({ _id: 1 }) // Sort by _id in ascending order for pagination
//         .skip(skip) // Skip records for the previous pages
//         .limit(pageSize); // Limit the number of records fetched

//       // Get the last fetched id to be used as `lastId` for the next page
//       const lastFetchedId = businessLocations[businessLocations.length - 1]?._id;

//       return helper.success(res, "Listing Successfully.", {
//         data: businessLocations,
//         lastId: lastFetchedId, // To fetch the next page based on this ID
//         totalRecords, // Total record count
//         limit: pageSize,
//       });
//     } catch (error) {
//       console.error("Error fetching business locations:", error);
//       return helper.error(res, "Error fetching business locations. Please try again.");
//     }
//   },
// };

