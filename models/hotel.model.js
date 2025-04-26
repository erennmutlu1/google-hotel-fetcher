const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true },
});

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  place_id: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  rating: { type: Number },
  hotel_photos: [String],
  reviews: [reviewSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hotel', hotelSchema);
