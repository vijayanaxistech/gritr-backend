import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

mongoose.Promise = global.Promise;

const connectDB = async () => {
  try {
    const dbURI = process.env.DB_URI;
    if (!dbURI) {
      throw new Error("DB_URI is not defined in environment variables.");
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`MongoDB Connected: ${dbURI}`);
    } else {
      console.log("MongoDB connection already open");
    }
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};

// ✅ Use ES Module export instead of module.exports
export default connectDB;
