import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    storedPath: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "docx"], required: true },
    extractedText: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
