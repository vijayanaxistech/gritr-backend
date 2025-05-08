"use strict";
import mongoose from "mongoose";

const businessLocationSchema = new mongoose.Schema(
  {
    g_business_name: { type: String, required: true },
    g_categories: { type: String, required: true },
    g_phone: { type: String, required: true },
    g_full_address: { type: String, required: true },
    g_street_address: { type: String },
    g_city: { type: String },
    g_state: { type: String },
    g_zipcode: { type: String },
    g_country: { type: String },
    g_latitude: { type: Number },
    g_longitude: { type: Number },
    g_star_rating: { type: Number },
    g_review_count: { type: Number },
    g_hours_of_operation: { type: String },
    g_website: { type: String },
    g_closed_status: { type: Boolean },
    google_maps_url: { type: String },
  },
  { timestamps: true }
);

// const BusinessLocation = mongoose.model('BusinessLocation', businessLocationSchema);

// module.exports = BusinessLocation;

export default mongoose.model("BusinessLocation", businessLocationSchema);
