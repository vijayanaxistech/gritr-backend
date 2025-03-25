import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../../models/front/User.js";
import FrontToken from "../../models/front/frontToken.js";
import constants from "../../config/constants.js";
import helper from "../../helpers/helper.js";

const { JWTExpiresInFrontend, JWTSecretFrontend } = constants;
const client = new OAuth2Client(constants.GOOGLE_CLIENT_ID);

export const googleSignIn = async (req, res) => {
  // Decode Google token
  async function decodeGoogleToken(token) {
    const decodedPayload = jwt.decode(token);
    if (!decodedPayload) throw new Error("Invalid token");
    return decodedPayload;
  }

  // Find or create Google user
  async function findOrCreateGoogleUser(payload) {
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        fullName: payload.name,
        isGmailLogin: true,
        password: null,
        isVerify: true,
      });
      await user.save();
    }
    return user;
  }

  // Main Google Sign-In logic
  const { credential } = req.body;
  try {
    const payload = await decodeGoogleToken(credential);
    let existingUser = await User.findOne({ email: payload.email });
    if (existingUser && existingUser.isGmailLogin === false) {
      return helper.error(
        res,
        "This email is already registered with a different login method."
      );
    }

    const user = await findOrCreateGoogleUser(payload);

    const token = jwt.sign(
      { userId: user._id, fullName: user.fullName, email: user.email },
      JWTSecretFrontend,
      { expiresIn: JWTExpiresInFrontend }
    );

    await FrontToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(
        Date.now() + helper.parseExpiresIn(JWTExpiresInFrontend)
      ),
    });

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
    return helper.success(res, "Login successful.", dataObj);
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};
