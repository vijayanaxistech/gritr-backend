const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    googleId: {
      type: String, // Store the Google user ID for users logging in with Google
      unique: true,
      sparse: true,  // This allows both email-based login and Google-based login
    },
    facebookId: {
      type: String, // Store the Facebook user ID for users logging in with Facebook
      unique: true,
      sparse: true,  // This allows both email-based login and Facebook-based login
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isGmailLogin: {
      type: Boolean,
      default: false,  // Track if the user logged in using Gmail/Google
    },
    isFacebookLogin: {
      type: Boolean,
      default: false,  // Track if the user logged in using Facebook
    },
    isVerify: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    password: {
      type: String, 
      minlength: [6, "Password must be at least 6 characters long"],
      required: function () {
        return !this.googleId && !this.facebookId; // Password is required only if the user is not using Google or Facebook login
      },
    },
    city: {
      type: String,
      required: function () {
        return !this.googleId && !this.facebookId; // City is required only if the user is not using Google or Facebook login
      },
      trim: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
