const mongoose = require("mongoose");

const metaSchema = new mongoose.Schema({
  id: Number,
  product_id: Number,
  name: String,
  values: [
    {
    id: Number,
    characteristic_id: Number,
    review_id: Number,
    value: Number
    }
  ]
})

const Meta = mongoose.model("Meta", metaSchema);

module.exports = { Meta };