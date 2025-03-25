"use strict";
import userRoutes from "./routes/admin/users.js"; // Add `.js`
import roleRoutes from "./routes/admin/role.js"; // Add `.js`
import businessLocation from "./routes/admin/businessLocationRoutes.js";
import questionRoutes from "./routes/admin/questionRoutes.js";
import surveys from "./routes/admin/surveys.js"; // Add `.js`
import verifyToken from "./routes/front/verifyToken.js"; // Add `.js`
import googleSignInRoutes from "./routes/front/googleSignIn.js"; // Add `.js`

const routes = (app) => {
  app.use("/api/admin/user", userRoutes);
  app.use("/api/admin/role", roleRoutes);
  app.use("/api/admin/location", businessLocation);
  app.use("/api/admin/question", questionRoutes);
  //app.use("/api/admin/advertisement", advertisement);
  app.use("/api/admin/verifyAdminToken", verifyToken);
  app.use("/api/admin/surveys", surveys);
  app.use("/api/front/auth", googleSignInRoutes);
};

export default routes;
