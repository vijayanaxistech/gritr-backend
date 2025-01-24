const mongoose = require('mongoose');

const advertiseSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  hyperlink: { type: String, required: true },
  category: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  active: { type: Boolean, default: true },
},
{ timestamps: true }
);

const Advertise = mongoose.model('Advertise', advertiseSchema);

module.exports = Advertise;
