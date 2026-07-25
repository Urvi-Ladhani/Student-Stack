const mongoose = require("mongoose");

const connectDB = async () => {

  try {

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("Mongo Connected");

  } catch(error) {

    console.log(error);

    if (!process.env.VERCEL) {
      process.exit(1);
    }

  }

};

module.exports = connectDB;