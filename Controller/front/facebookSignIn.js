import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../../models/front/User.js"; // Ensure .js extension
import FrontToken from "../../models/front/frontToken.js"; // Ensure .js extension
import constants from "../../config/constants.js"; // Ensure .js extension
import helper from "../../helpers/helper.js"; // Ensure .js extension

const { JWTExpiresInFrontend, JWTSecretFrontend } = constants;

export const facebookSignIn = async (req, res) => {
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
        isFacebookLogin: true,
        password: null,
        isVerify: true,
      });
      await user.save();
    }
    return user;
  }

  async function facebookSignIn(req, res) {
    const { accessToken } = req.body; // Get Facebook access token from the request body
    try {
      // Verify and decode the Facebook token
      const payload = await verifyFacebookToken(accessToken);

      let existingUser = await User.findOne({ email: payload.email });
      if (existingUser && existingUser.isFacebookLogin === false) {
        return helper.error(
          res,
          "This email is already registered with a different login method."
        );
      }

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
        expiresAt: new Date(
          Date.now() + helper.parseExpiresIn(JWTExpiresInFrontend)
        ),
      });

      // Prepare response object
      const dataObj = {
        status: true,
        code: 200,
        message: "Login Successfully.",
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      };

      // Send success response to the client
      return helper.success(res, "Login successful.", dataObj);
    } catch (error) {
      // If there's an error (invalid token or other issue), return an error response
      console.error(error);
      res.status(400).json({ error: "Invalid token or Facebook API error" });
    }
  }
};

export default { facebookSignIn };
