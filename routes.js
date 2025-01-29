"use strict";

// Import route files
let userRoutes = require("./routes/admin/users");
let roleRoutes = require("./routes/admin/role");
let businessLocation = require("./routes/admin/businessLocationRoutes");
let questionRoutes = require("./routes/admin/questionRoutes");
let advertisement = require("./routes/admin/advertisement");
let authRoutes = require("./routes/front/authRoutes"); 
let verifyToken = require("./routes/front/verifyToken");
const googleSignInRoutes = require('./routes/front/googleSignIn');



module.exports = (app) => {
  // Admin section routes
  app.use("/api/admin/user", userRoutes);       
  app.use("/api/admin/role", roleRoutes);        
  app.use("/api/admin/location", businessLocation);
  app.use("/api/admin/question", questionRoutes); 
  app.use("/api/admin/advertisement", advertisement); 
  app.use("/api/admin/verifyAdminToken", verifyToken);    


  // Front user routes
  app.use("/api/front/login", authRoutes);    
  app.use("/api/front/register", authRoutes);    
  app.use("/api/front/verifyToken", verifyToken);
  app.use('/api/front/auth', googleSignInRoutes);
  



};
