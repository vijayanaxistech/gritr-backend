"use strict";

let userRoutes = require("./routes/users");
let roleRoutes = require("./routes/role");
let businessLocation = require("./routes/businessLocationRoutes");
let questionRoutes = require("./routes/questionRoutes");
let advertisement = require("./routes/advertisement");



module.exports = (app) => {
  // admin section routes
  app.use("/api/admin/user", userRoutes);
  app.use("/api/admin/role", roleRoutes);
  app.use("/api/admin/location",businessLocation );
  app.use("/api/admin/question",questionRoutes);
  app.use("/api/admin/advertisement",advertisement);
  
};