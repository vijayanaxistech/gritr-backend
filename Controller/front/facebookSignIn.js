const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../../models/front/User');
const FrontToken = require('../../models/front/frontToken');
const constants = require('../../config/constants');
const helper = require('../../helpers/helper');

const { JWTExpiresInFrontend, JWTSecretFrontend } = constants;

async function verifyFacebookToken(token) {
  // Call Facebook's Graph API to verify the token and retrieve user data
  const response = await axios.get(
    `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email`
  );
  return response.data;
}

async function findOrCreateFacebookUser(payload) {
  // Check if the user already exists in your database using their Facebook ID
  let user = await User.findOne({ facebookId: payload.id });
  if (!user) {
    // If user doesn't exist, create a new user
    user = new User({
      facebookId: payload.id,
      email: payload.email,
      fullName: payload.name,
      isGmailLogin: false, // Since this is Facebook login, mark as false
      password: null, // Facebook login doesn't require a password
      isVerify: true, // Mark user as verified by default
    });
    await user.save();
  }
  return user;
}

async function facebookSignIn(req, res) {
  const { accessToken } = req.body;  // Get Facebook access token from the request body
  try {
    // Verify and decode the Facebook token
    const payload = await verifyFacebookToken(accessToken);
    
    // Find or create the user based on Facebook data
    const user = await findOrCreateFacebookUser(payload);
    
    // Generate a JWT token for the user
    const token = jwt.sign(
      { userId: user._id, fullName: user.fullName, email: user.email },
      JWTSecretFrontend, 
      { expiresIn: JWTExpiresInFrontend } // Token expiration time
    );
    
    // Create or update the token in the FrontToken collection
    await FrontToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + helper.parseExpiresIn(JWTExpiresInFrontend)),
    });

    // Prepare response object
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
    };
    
    // Send success response to the client
    return helper.success(res, 'Login successful.', dataObj);
  } catch (error) {
    // If there's an error (invalid token or other issue), return an error response
    console.error(error);
    res.status(400).json({ error: 'Invalid token or Facebook API error' });
  }
}

module.exports = { facebookSignIn };
