const Authenticate = require('./authHelper')
const response = (res, obj, req) => {
  let newExpiryKey = obj;
  if (req?.user && req) {
    newExpiryKey = {
      ...obj,
      expiry: req.user?.jwsUserId?.edate
    }
  }
  return res.status(200).json({ auth: Authenticate.getEncKey(newExpiryKey) });
}
module.exports = response