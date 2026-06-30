import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
    type: {
      type: String,
      enum: ["ats_score", "jd_match", "suggestions", "cover_letter", "github_review"],
      required: true,
    },
    targetRole: { type: String },
    jobDescription: { type: String },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Analysis", analysisSchema);
