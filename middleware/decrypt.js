const Authenticate = require("../utils/authHelper.js");

const decrypt = (req, res, next) => {
  req.body = Authenticate.gsk(req.body.Auth);
  console.log(req.body, "req.body");
  req.body = JSON.parse(req.body);
  next();
};

module.exports = decrypt;
