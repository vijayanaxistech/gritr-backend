import Advertise from "../../models/admin/Advertise.js";
import helper from "../../helpers/helper.js";

const adsController = {
  createAd: async (req, res) => {
    try {
      const { imageUrl, hyperlink, category, city, state, startTime, endTime } =
        req.body;
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
      return helper.success(res, "Ad created successfully", newAd);
    } catch (error) {
      console.error(error);
      return helper.error(res, "Error creating ad", error.message);
    }
  },

  getAdById: async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await Advertise.findById(id);

      if (!ad) {
        return helper.error(res, "Ad not found", null, 404);
      }

      return helper.success(res, "Ad fetched successfully", { ad });
    } catch (err) {
      console.error(err);
      return helper.error(res, "Server error, please try again.", err, 500);
    }
  },

  updateAdById: async (req, res) => {
    const adId = req.params.id;
    const { active } = req.body;
    try {
      const ad = await Advertise.findById(adId);
      if (!ad) {
        return helper.error(res, "Ad not found", null, 404);
      }
      ad.active = active !== undefined ? active : ad.active;
      await ad.save();
      return helper.success(res, "Ad updated successfully", ad);
    } catch (error) {
      console.error("Error updating ad:", error);
      return helper.error(res, "Error updating ad", error.message);
    }
  },

  deactivateAd: async (req, res) => {
    const { id: adId } = req.params; // Fixing incorrect destructuring

    try {
      const ad = await Advertise.findById(adId);

      if (!ad) {
        return helper.error(res, "Ad not found", null, 404);
      }

      ad.active = false;
      await ad.save();
      return helper.success(res, "Ad deactivated successfully", ad);
    } catch (error) {
      console.error(error);
      return helper.error(res, "Error deactivating ad", error.message);
    }
  },
};

export default adsController; // ✅ Use ES module export
