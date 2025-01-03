const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const connectDB = async () => {
  try {
    const dbURI = process.env.DB_URI || "mongodb://127.0.0.1:27017/gritr";

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(dbURI, {
        useNewUrlParser: true,
      });
      console.log("MongoDB Connected");
    } else {
      console.log("MongoDB connection already open");
    }
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
