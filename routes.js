"use strict";

let userRoutes = require("./routes/users");

let roleRoutes = require("./routes/role");
let moduleRoutes = require("./routes/moduleAccess");
let welcomeMessage = require("./routes/welcomeMsg");


module.exports = (app) => {
  // admin section routes
  app.use("/api/admin/user", userRoutes);
  app.use("/api/admin/role", roleRoutes);
  // app.use("/api/zoom", zoomRoutes);
  
  // app.use("/api/super/user", superUserRoutes);
  // app.use("/api/sys/user", sysUserRoutes);
  // app.use("/api/moduleAccess", moduleRoutes);
  // app.use("/api/welcomeMessage", welcomeMessage);  
};