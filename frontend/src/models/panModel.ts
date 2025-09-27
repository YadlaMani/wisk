import mongoose from "mongoose";

const PanSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    recieverEmail: { type: String, required: true },
    proverName: { type: String, required: true },
    proverPanId: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    snark: {
      type: mongoose.Schema.Types.Mixed,
    },
    signature: { type: String },
  },
  { timestamps: true }
);

const PanVerify =
  mongoose.models?.PanVerify || mongoose.model("PanVerify", PanSchema);
export default PanVerify;
