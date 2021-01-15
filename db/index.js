const mongoose = require("mongoose");

const isProduction = process.env.NODE_ENV === "production";
const dbName = isProduction ? process.env.TEST_DB_NAME : process.env.DB_NAME;
const dbPassword = process.env.MONGO_PASS;

const mongoUrl = `mongodb+srv://afyamedex:${dbPassword}@cluster0.lygm5.gcp.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
