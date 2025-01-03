'use strict';

const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let welcomeMessage = new Schema({
    massage: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {timestamps: true});

module.exports = mongoose.model('welcomeMessage', welcomeMessage);