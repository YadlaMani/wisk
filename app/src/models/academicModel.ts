import mongoose from "mongoose";

const AcademicSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    recieverEmail: { type: String, required: true },
    proverName: { type: String, required: true },
    proverAcademicId: { type: String, required: true },
    proverInstitute: { type: String, required: true },
    proverCGPA: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    snark: {
      type: mongoose.Schema.Types.Mixed,
    },
    signature: { type: String },
  },
  { timestamps: true }
);

const AcademicVerify =
  mongoose.models?.AcademicVerify ||
  mongoose.model("AcademicVerify", AcademicSchema);
export default AcademicVerify;
