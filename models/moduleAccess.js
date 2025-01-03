'use strict';

let mongoose = require('mongoose');

const ModuleAccess = new mongoose.Schema({
    moduleName: {
        type: String,
        required: true
    },
    alias: {
        type: String,
        required: true
    },
    createAccess: {
        type: Boolean,
        required: false,
        default: false
    },
    updateAccess: {
        type: Boolean,
        required: false,
        default: false
    },
    viewAccess: {
        type: Boolean,
        required: false,
        default: false
    },    
    message: {
        type: Boolean,
        required: false,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

module.exports = mongoose.model('ModuleAccess', ModuleAccess);