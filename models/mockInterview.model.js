import mongoose from "mongoose";

const mockQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  intention: { type: String, default: "" },
  category: { type: String, enum: ["technical", "behavioral"], required: true },
  topic: { type: String, default: "" },
  difficulty: { type: String, default: "intermediate" },
  evaluationCriteria: [{ type: String }],
  benchmarkAnswer: { type: String, default: "" },
  answer: { type: String, default: "" },
  score: { type: Number, min: 0, max: 100, default: null },
  feedback: { type: String, default: "" },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  status: { type: String, enum: ["pending", "answered", "skipped", "timed_out"], default: "pending" },
  timeSpentSeconds: { type: Number, min: 0, default: 0 },
}, { _id: false });

const mockInterviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sourceReport: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewReport", default: null },
  jobDescription: { type: String, required: true },
  roleTitle: { type: String, default: "" },
  resume: { type: String, default: "" },
  selfDescription: { type: String, default: "" },
  questionCount: { type: Number, min: 1, max: 30, required: true },
  secondsPerQuestion: { type: Number, min: 10, max: 300, default: 30 },
  questions: { type: [mockQuestionSchema], required: true },
  currentQuestionIndex: { type: Number, min: 0, default: 0 },
  currentQuestionStartedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["in_progress", "completed"], default: "in_progress", index: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  totalTimeSeconds: { type: Number, min: 0, default: 0 },
  performance: {
    overallScore: { type: Number, min: 0, max: 100, default: null },
    technicalDepth: { type: Number, min: 0, max: 100, default: null },
    scenarioSolving: { type: Number, min: 0, max: 100, default: null },
    communication: { type: Number, min: 0, max: 100, default: null },
    accuracy: { type: Number, min: 0, max: 100, default: null },
    confidence: { type: String, default: "" },
    summary: { type: String, default: "" },
    strengths: [{ type: String }],
    improvementAreas: [{ type: String }],
    recommendations: [{ type: String }],
  },
}, { timestamps: true });

mockInterviewSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("MockInterview", mockInterviewSchema);
