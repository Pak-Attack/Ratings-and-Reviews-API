const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  id: Number,
  product_id: Number,
  rating: Number,
  summary: String,
  recommend: Boolean,
  response: String,
  body: String,
  date: Date,
  reviewer_name: String,
  reviewer_email: String,
  helpfulness: Number,
  reported: Boolean,
  photos: [
    {
      id: Number,
      review_id: Number,
      url: String
    }
  ]
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = { Review };