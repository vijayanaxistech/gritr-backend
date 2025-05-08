import mongoose from "mongoose"; // Using ES module import

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
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isGmailLogin: {
      type: Boolean,
      default: false,
    },
    isFacebookLogin: {
      type: Boolean,
      default: false,
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
        return !this.googleId && !this.facebookId;
      },
    },
    city: {
      type: String,
      required: function () {
        return !this.googleId && !this.facebookId;
      },
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema); // Default export
