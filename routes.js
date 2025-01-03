"use strict";

let userRoutes = require("./routes/users");

let roleRoutes = require("./routes/role");
let superUserRoutes = require("./routes/super/user");
let sysUserRoutes = require("./routes/sys/user");
let moduleRoutes = require("./routes/moduleAccess");
let welcomeMessage = require("./routes/welcomeMsg");


module.exports = (app) => {
  app.use("/api/user", userRoutes);
  // app.use("/api/zoom", zoomRoutes);
  // app.use("/api/role", roleRoutes);
  // app.use("/api/super/user", superUserRoutes);
  // app.use("/api/sys/user", sysUserRoutes);
  // app.use("/api/moduleAccess", moduleRoutes);
  // app.use("/api/welcomeMessage", welcomeMessage);  
};