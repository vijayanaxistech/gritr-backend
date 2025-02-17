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
const os = require("os");

// Force production environment
process.env.NODE_ENV = "production";

// Load production environment variables
dotenv.config({ path: `.env.production` });

// Function to get the server's local IP address
const getLocalIP = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceKey in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceKey];
    for (const iface of networkInterface) {
      // Skip internal interfaces (e.g., "lo" on Unix systems)
      if (!iface.internal && iface.family === "IPv4") {
        return iface.address;
      }
    }
  }
  return null; // Return null if no external IP is found
};

const serverIp = getLocalIP();
console.log(`Server's local IP address: ${serverIp}`);

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
    console.log(`Server's local IP address: ${serverIp}`);

    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server started successfully on ${process.env.BASE_URL}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    throw createError(500, "Unable to connect to the database");
  });
