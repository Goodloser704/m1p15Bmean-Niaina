const mongoose = require("mongoose");

async function connectToDb(mongodbUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongodbUri);
}

module.exports = { connectToDb };

