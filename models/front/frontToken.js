import mongoose from "mongoose"; // Using ES module import

const frontTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// Export the model using ES module export
const FrontToken = mongoose.model("frontToken", frontTokenSchema);

export default FrontToken;
