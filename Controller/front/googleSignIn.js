const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/front/User');  // Adjust the path as necessary
const jwt = require('jsonwebtoken');
const constants = require('../../config/constants');
const apiResponse = require("../../utils/response");
const helper = require("../../helpers/helper");
const FrontToken = require("../../models/front/frontToken");


const {
  JWTExpiresInFrontend,
  JWTSecretFrontend,
} = require("../../config/constants");

const client = new OAuth2Client(constants.GOOGLE_CLIENT_ID);
async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: constants.GOOGLE_CLIENT_ID,
  });
 
  const payload = ticket.getPayload();
  return payload;
}


async function decodeGoogleToken(token) {
  const decodedPayload = jwt.decode(token);
  if (!decodedPayload) {
    throw new Error('Invalid token');
  }
  return decodedPayload;
}


async function findOrCreateGoogleUser(payload) {  

  let user = await User.findOne({ googleId: payload.sub });   
  


  if (!user) {
    user = new User({
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name,
      isGmailLogin:true,   
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
     
    // Create a JWT token
     const token = jwt.sign(
      { userId: user._id, fullName:user.fullName,  email: user.email },
      JWTSecretFrontend,
      { expiresIn: JWTExpiresInFrontend }
    );

     // Store the token in the frontToken collection
     const tokenData = {
        userId: user._id,
        token,
        expiresAt: new Date(Date.now() + helper.parseExpiresIn(JWTExpiresInFrontend)),
     };    
      
    // Save token data in the database
       await FrontToken.create(tokenData);


    const resObj = {
      status: true,
      code: 200,
      message: 'Login Successfully.',
      data: {
        token:token,
        user:{
          id: user._id,
          fullName: user.name,
          email: user.email,
        }        
      },
    };    
    return apiResponse(res, resObj);
  } catch (error) {    
    res.status(400).json({ error: 'Invalid token' });
  }
}


module.exports = {
  googleSignIn,
};
