// Import third-party libraries
import express from "express";
import createError from "http-errors";
import path from "path";
import fs from "fs";
import cors from "cors";
import fileupload from "express-fileupload";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

// ES Modules doesn't support __dirname by default, so define it manually
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables dynamically
const environment = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${environment}` });

// Import custom files
import errorMiddleware from "./middleware/error.js";
import connectDB from "./config/config.js";
//import swaggerDocument from "./swagger.json" assert { type: "json" };
import routes from "./routes.js"; // Ensure routes.js also uses ES Modules

// Set up app and port
const app = express();
const PORT = process.env.PORT || 8186;

// Middleware setup
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(fileupload());
app.use(morgan("dev"));

// Serve API documentation
//app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Define API routes
routes(app);

// Custom error middleware
app.use(errorMiddleware);

// Connect to the database and start the server
connectDB()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server started successfully on ${process.env.BASE_URL}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    throw createError(500, "Unable to connect to the database");
  });
