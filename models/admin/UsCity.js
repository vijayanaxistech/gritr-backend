"use strict";
const mongoose = require("mongoose");

const UsCitySchema = new mongoose.Schema(
  {
    geo_area_id: { type: Number, unique: true, index: true },
    city: { type: String, required: true, index: true },
    city_ascii: { type: String, required: true },
    state_id: { type: String, required: true, index: true }, // Abbreviation (e.g., "CA")
    state_name: { type: String, required: true },
    county_fips: { type: String }, // Keeping it as String for flexibility
    county_name: { type: String },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    population: { type: Number, default: 0 },
    density: { type: Number },
    source: { type: String },
    military: { type: Boolean, default: false },
    incorporated: { type: Boolean, default: true },
    timezone: { type: String },
    ranking: { type: Number },
    zips: [{ type: String }], // Storing ZIP codes as an array instead of a single string
    lat_rad: { type: Number },
    lng_rad: { type: Number },
    greater_city_area: { type: String },
  },
  { timestamps: true }
);

// Create indexes for faster queries
UsCitySchema.index({ state_id: 1 });
UsCitySchema.index({ city: 1 });
UsCitySchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model("UsCity", UsCitySchema);
