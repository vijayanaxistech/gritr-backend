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
      
    getAdById: async (req, res) => {
        try {
          const { id } = req.params;         
          const ad = await Advertise.findById(id);     
          
          if (!ad) {
            return helper.error(res, 'Ad not found', null, 404);
          }

          return helper.success(res, 'Ad fetched successfully', {
            ad,
          });

        } catch (err) {
          console.error(err);
          return helper.error(res, 'Server error, please try again.', err, 500);
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