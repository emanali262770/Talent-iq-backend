import mongoose from "mongoose";
/**
 * Sub Schema for Technical Questions
 */
const technicalQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Technical Question is required"],
    },
    intention: { type: String, required: [true, "Intention is required"] },
    answer: { type: String, required: [true, "Answer is required"] },
  },
 {_id:false},
);
/**
 * Sub Schema for Behavioural Questions
 */
const behaviouralQuestionsSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Behavioural Question is required"],
    },
    intention: { type: String, required: [true, "Intention is required"] },
    answer: { type: String, required: [true, "Answer is required"] },
  },
 {_id:false},
);
/**
 * Sub Schema for Skills Gaps
 */

const skillGapSchema = new mongoose.Schema({
    skill: { type: String, required: [true, "Skill is required"] },
    severity: { type: String, enum: ['low', 'medium', 'high'],required: [true, "Severity is required"] },
},{_id:false});


/**
 * Sub Schema for Prepration Tips
 */

const preparationTipSchema = new mongoose.Schema({
   day: { type: Number, required: [true, "Day is required"] },
    focus: { type: String, required: [true, "Focus is required"] },
    tasks: [{ type: String, required: [true, "Tasks are required"] }],
},{_id:false});

/**
 * Main Sechema for Interview Report
 */
const interviewReportSchema = new mongoose.Schema(
  {
    jobDescription: {
      type: String,
      required: [true, "Job description is required"],
    },
    resume: { type: String },
    selfDescription: { type: String },
    matchScore: { type: Number, min: 0, max: 100 },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behaviouralQuestionsSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationTipSchema],
    user:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"users"
    }
  },
  { timestamps: true },
);
interviewReportSchema.index({ user: 1, createdAt: -1 });
const InterviewReport = mongoose.model("InterviewReport", interviewReportSchema);
export default InterviewReport;
