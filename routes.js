"use strict";

// Import route files
let userRoutes = require("./routes/admin/users");
let roleRoutes = require("./routes/admin/role");
let businessLocation = require("./routes/admin/businessLocationRoutes");
let questionRoutes = require("./routes/admin/questionRoutes");
let advertisement = require("./routes/admin/advertisement");
//let frontUserRoutes = require("./routes/frontUserRoutes"); 
let registerRoutes = require("./routes/front/registerRoutes"); 

module.exports = (app) => {
  // Admin section routes
  app.use("/api/admin/user", userRoutes);       
  app.use("/api/admin/role", roleRoutes);        
  app.use("/api/admin/location", businessLocation);
  app.use("/api/admin/question", questionRoutes); 
  app.use("/api/admin/advertisement", advertisement); 
  
  // Front user routes
  // app.use("/api/front/user", frontUserRoutes);  
  app.use("/api/front/register", registerRoutes);    




};
