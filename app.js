// Import third-party libraries
const express = require("express");
const createError = require("http-errors");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const fileupload = require("express-fileupload");
const compression = require("compression");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const dotenv = require("dotenv");

// Force production environment
process.env.NODE_ENV = "production";

// Load production environment variables
dotenv.config({ path: `.env.production` });

// Import custom files
const errorMiddleware = require("./middleware/error");
const connectDB = require("./config/config.js");
const swaggerDocument = require("./swagger.json");
const routes = require("./routes.js");

// Set up app and port
const app = express();
const PORT = process.env.PORT || 8186;

// Middleware setup
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(fileupload());

// Disable logging (morgan) in production for performance
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serve API documentation (disabled in production)
if (process.env.NODE_ENV === "development") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

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
