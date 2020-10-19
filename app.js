require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");

// Fire up db connection
require("./db");

var apiRouter = require("./routes/index");
const createResponse = require("./routes/helpers/create-response");

var app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1", apiRouter);

app.use(function errorHandler(err, req, res, next) {
  console.log("server eerr", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.json(
    createResponse({
      error: err,
    })
  );
});

module.exports = app;
