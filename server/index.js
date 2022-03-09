const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const { Review } = require("../reviewSchema.js");
const { Meta } = require("../metaSchema.js");
const PORT = 3007;
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../fec-birch/public')));
const config = require("../fec-birch/config.js");

mongoose.connect("mongodb://localhost:27017/sdc");
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to mongodb"));

app.get("/reviews/:id", (req, res) => {
  let product_id = req.params.id;
  let sortMethod = req.query.sort || "relevant";
  let count = req.query.count || 500;

  if (sortMethod === "newest") {
    Review.find({ product_id: product_id })
      .sort("-date")
      .limit(count)
      .then((results) => {
        results.forEach((review) => {
          if (review.response === "null") {
            review.response = null;
          }
        });
        res
          .status(200)
          .send(results.slice().filter((review) => !review.reported));
      })
      .catch((err) => {
        res.sendStatus(404);
      });
  } else if (sortMethod === "helpful") {
    Review.find({ product_id: product_id })
      .sort("-helpfulness")
      .limit(count)
      .then((results) => {
        results.forEach((review) => {
          if (review.response === "null") {
            review.response = null;
          }
        });
        res
          .status(200)
          .send(results.slice().filter((review) => !review.reported));
      })
      .catch((err) => {
        res.sendStatus(404);
      });
  } else {
    Review.find({ product_id: product_id })
      .sort("-id")
      .limit(count)
      .then((results) => {
        results.forEach((review) => {
          if (review.response === "null") {
            review.response = null;
          }
        });
        res
          .status(200)
          .send(results.slice().filter((review) => !review.reported));
      })
      .catch((err) => {
        res.sendStatus(404);
      });
  }
});

app.get("/reviews/meta/:id", (req, res) => {
  let product_id = req.params.id;
  let metaObject;
  Review.find({ product_id: product_id })
    .then((reviewResult) => {
      Meta.find({ product_id: product_id })
        .lean()
        .then((metaResult) => {
          result = {
            product_id: product_id,
            ratings: {
              1: reviewResult.filter((item) => item.rating === 1).length,
              2: reviewResult.filter((item) => item.rating === 2).length,
              3: reviewResult.filter((item) => item.rating === 3).length,
              4: reviewResult.filter((item) => item.rating === 4).length,
              5: reviewResult.filter((item) => item.rating === 5).length,
            },
            recommended: {
              false: reviewResult.filter((item) => !item.recommend).length,
              true: reviewResult.filter((item) => item.recommend).length,
            },
            characteristics: {},
          };

          for (let i = 0; i < metaResult.length; i++) {
            if (metaResult[i].name === "Fit") {
              let fit = [];
              metaResult[i].values.map((obj) => fit.push(obj.value));
              let fitTotal = fit.reduce((a, b) => a + b);
              result.characteristics["Fit"] = {
                id: metaResult[i].id,
                value: fitTotal / fit.length,
              };
            }

            if (metaResult[i].name === "Size") {
              let size = [];
              metaResult[i].values.map((obj) => size.push(obj.value));
              let sizeTotal = size.reduce((a, b) => a + b);
              result.characteristics["Size"] = {
                id: metaResult[i].id,
                value: sizeTotal / size.length,
              };
            }

            if (metaResult[i].name === "Length") {
              let length = [];
              metaResult[i].values.map((obj) => length.push(obj.value));
              let lengthTotal = length.reduce((a, b) => a + b);
              result.characteristics["Length"] = {
                id: metaResult[i].id,
                value: lengthTotal / length.length,
              };
            }

            if (metaResult[i].name === "Width") {
              let width = [];
              metaResult[i].values.map((obj) => width.push(obj.value));
              let widthTotal = width.reduce((a, b) => a + b);
              result.characteristics["Width"] = {
                id: metaResult[i].id,
                value: widthTotal / width.length,
              };
            }

            if (metaResult[i].name === "Quality") {
              let quality = [];
              metaResult[i].values.map((obj) => quality.push(obj.value));
              let qualityTotal = quality.reduce((a, b) => a + b);
              result.characteristics["Quality"] = {
                id: metaResult[i].id,
                value: qualityTotal / quality.length,
              };
            }

            if (metaResult[i].name === "Comfort") {
              let comfort = [];
              metaResult[i].values.map((obj) => comfort.push(obj.value));
              let comfortTotal = comfort.reduce((a, b) => a + b);
              result.characteristics["Comfort"] = {
                id: metaResult[i].id,
                value: comfortTotal / comfort.length,
              };
            }
          }

          res.status(200).send(result);
        })
        .catch((err) => {
          res.sendStatus(404);
        });
    })
    .catch((err) => {
      res.sendStatus(404);
    });
});

app.post("/reviews", (req, res) => {
  Review.find()
    .sort("-id")
    .limit(1)
    .then((result) => {
      let id = result[0].id + 1;
      let review = new Review({
        id: id,
        product_id: req.body.product_id,
        rating: req.body.rating,
        recommend: req.body.recommend,
        summary: req.body.summary,
        body: req.body.body,
        reviewer_name: req.body.name,
        reviewer_email: req.body.email,
        date: new Date(),
        reported: false,
        response: "",
        helpfulness: 0,
        photos: [],
      });

      req.body.photos.forEach((photoURL) => {
        review.photos.push({ review_id: id, url: photoURL });
      });

      review.save();

      Meta.find()
        .sort("-id")
        .limit(1)
        .then((result) => {
          let main_id = result[0].id + 1;
          for (let key in req.body.characteristics) {
            let numeral = Number(key);
            let values = {
              id: main_id,
              characteristic_id: numeral,
              review_id: id,
              value: req.body.characteristics[key],
            };
            Meta.findOne({ id: numeral }, (err, output) => {
              if (err) {
                console.log(err);
              } else {
                output._doc.values.push(values);
                output.save();
              }
            });
          }
        })
        .then((result) => {
          res.sendStatus(204);
        })
        .catch((err) => {
          res.sendStatus(404);
        });
    })
    .catch((err) => {
      res.sendStatus(404);
    });
});

app.put("/reviews/:review_id/helpful", (req, res) => {
  Review.findOneAndUpdate(
    { id: req.params.review_id },
    { $inc: { helpfulness: 1 } }
  )
    .then((result) => {
      res.sendStatus(200);
    })
    .catch((err) => {
      res.sendStatus(404);
    });
});

app.put("/reviews/:review_id/report", (req, res) => {
  Review.findOneAndUpdate(
    { id: req.params.review_id },
    { $set: { reported: true } }
  )
    .then((result) => {
      res.sendStatus(200);
    })
    .catch((err) => {
      res.sendStatus(404);
    });
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
