const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../../models/front/User');
const FrontToken = require('../../models/front/frontToken');
const constants = require('../../config/constants');
const helper = require('../../helpers/helper');

const { JWTExpiresInFrontend, JWTSecretFrontend } = constants;
const client = new OAuth2Client(constants.GOOGLE_CLIENT_ID);

async function decodeGoogleToken(token) {
  const decodedPayload = jwt.decode(token);
  if (!decodedPayload) throw new Error('Invalid token');
  return decodedPayload;
}

async function findOrCreateGoogleUser(payload) {
  let user = await User.findOne({ googleId: payload.sub });
  if (!user) {
    user = new User({
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      isGmailLogin: true,
      password:null,
      isVerify: true,
    });
    await user.save();
  }
  return user;
}

async function googleSignIn(req, res) {
  const { credential } = req.body;
  try {
    const payload = await decodeGoogleToken(credential);
    const user = await findOrCreateGoogleUser(payload);
    
    const token = jwt.sign(
      { userId: user._id, fullName: user.fullName, email: user.email },
      JWTSecretFrontend,
      { expiresIn: JWTExpiresInFrontend }
    );
    
    await FrontToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + helper.parseExpiresIn(JWTExpiresInFrontend)),
    });

    const dataObj = {
      status: true,
      code: 200,
      message: 'Login Successfully.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    }    
    return helper.success(res, 'Login successful.',dataObj);
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

module.exports = { googleSignIn };