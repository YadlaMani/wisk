import mongoose from "mongoose";

const NameSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    recieverEmail: { type: String, required: true },
    proverName: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    snark: {
      type: mongoose.Schema.Types.Mixed,
    },
    signature: { type: String },
  },
  { timestamps: true }
);

const NameVerify =
  mongoose.models?.NameVerify || mongoose.model("NameVerify", NameSchema);
export default NameVerify;
