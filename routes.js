"use strict";

let userRoutes = require("./routes/users");

let roleRoutes = require("./routes/role");
let moduleRoutes = require("./routes/moduleAccess");


module.exports = (app) => {
  // admin section routes
  app.use("/api/admin/user", userRoutes);
  app.use("/api/admin/role", roleRoutes);

};