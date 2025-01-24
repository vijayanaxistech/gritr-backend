const Advertise = require('../models/Advertise');
const helper = require('../helpers/helper'); 

module.exports = {
    createAd : async (req, res) => {
    try {
        const { imageUrl, hyperlink, category, city, state, startTime, endTime } = req.body;
          const newAd = new Advertise({
            imageUrl,
            hyperlink,
            category,
            city,
            state,
            startTime,
            endTime,
            createdBy: req.user.id,
          });
      
          await newAd.save();
          return helper.success(res, 'Ad created successfully', newAd);
        } catch (error) {
          console.error(error);
          return helper.error(res, 'Error creating ad', error.message);
        }
    },
      
    getAds : async (req, res) => {
        const { category, city, state } = req.query;
      
        try {
          const ads = await Advertise.find({
            active: true,
            startTime: { $lte: new Date() }, // Ad has started
            endTime: { $gte: new Date() }, // Ad has not ended yet
            category: category || { $exists: true },
            city: city || { $exists: true },
            state: state || { $exists: true },
          });
      
          return helper.success(res, 'Ads fetched successfully', ads); // Success response with data
        } catch (error) {
          console.error(error);
          return helper.error(res, 'Error fetching ads', error.message); // Error response with message
        }
    },

    updateAd : async (req, res) => {
        const { adId } = req.params;
        const { active, startTime, endTime } = req.body;
      
        try {
          const ad = await Advertise.findById(adId);
      
          if (!ad) {
            return helper.error(res, 'Ad not found', null, 404); // Ad not found, return 404
          }
      
          ad.active = active || ad.active;
          ad.startTime = startTime || ad.startTime;
          ad.endTime = endTime || ad.endTime;
      
          await ad.save();
          return helper.success(res, 'Ad updated successfully', ad); // Success response with updated ad
        } catch (error) {
          console.error(error);
          return helper.error(res, 'Error updating ad', error.message); // Error response
        }
    },

    deactivateAd : async (req, res) => {
        const { adId } = req.params;
      
        try {
          const ad = await Advertise.findById(adId);
      
          if (!ad) {
            return helper.error(res, 'Ad not found', null, 404); // Ad not found
          }
      
          ad.active = false; // Deactivate the ad
          await ad.save();
          return helper.success(res, 'Ad deactivated successfully', ad); // Success response with deactivated ad
        } catch (error) {
          console.error(error);
          return helper.error(res, 'Error deactivating ad', error.message); // Error response
        }
    },

}