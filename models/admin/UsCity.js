"use strict";
const mongoose = require('mongoose');

const UsCitySchema = new mongoose.Schema({
    city: { type: String, required: true },
    city_ascii: { type: String, required: true },
    state_id: { type: String, required: true },
    state_name: { type: String, required: true },
    county_fips: { type: Number, required: true },
    county_name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    population: { type: Number },
    density: { type: Number },
    source: { type: String },
    military: { type: Boolean },
    incorporated: { type: Boolean },
    timezone: { type: String },
    ranking: { type: Number },
    zips: { type: String },
    id: { type: Number, unique: true },
    lat_rad: { type: Number },
    lng_rad: { type: Number },
    greater_city_area: { type: String },

},
{ timestamps: true }
);

module.exports = mongoose.model('UsCity', UsCitySchema);
