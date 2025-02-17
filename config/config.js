const mongoose = require("mongoose");
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

mongoose.Promise = global.Promise;

const connectDB = async () => {
  try {
    const dbURI = `mongodb+srv://vijaypanchal05:AXss4q9zgwBg7OWe@cluster0.pnhhz.mongodb.net/gritr?retryWrites=true&w=majority&appName=Cluster0`;

    if (!dbURI) {
      throw new Error("DB_URI is not defined in environment variables.");
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(dbURI);
      console.log(`MongoDB Connected: ${dbURI}`);
    } else {
      console.log("MongoDB connection already open");
    }
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
