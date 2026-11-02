import { generateInterviewReport, generateMockInterviewQuestions, evaluateMockInterviewAnswer, generateMockInterviewPerformance } from "../services/ai.service.js";
import InterviewReport from "../models/interviewReport.model.js";
import MockInterview from "../models/mockInterview.model.js";

import { extractTextFromPDF } from "../lib/pdfExtractor.js";

export const generateInterviewReports = async (req, res) => {
  try {
    const resumefile = req.file;

    if (!resumefile) {
      return res.status(400).json({
        message: "Resume file is required",
      });
    }

    let resumeText;

    try {
      resumeText = await extractTextFromPDF(resumefile.buffer);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid or unsupported PDF file",
        error: error.message,
      });
    }

    if (!resumeText) {
      return res.status(400).json({
        message: "Could not extract text from PDF",
      });
    }

    const { selfDescription, jobDescription } = req.body;

    let interviewGenerate;

    try {
      interviewGenerate = await generateInterviewReport({
        resume: resumeText,

        selfDescription,

        jobDescription,
      });
    } catch (error) {
      return res.status(502).json({
        message: "AI report generation failed. Please try again.",
        error: "The AI provider returned an invalid response.",
      });
    }

    const interviewReport = await InterviewReport.create({
      user: req.user.id,

      resume: resumeText,

      selfDescription,

      jobDescription,

      ...interviewGenerate,
    });

    res.status(201).json({
      message: "InterviewReport Created Successfully",

      interviewReport,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Internal Server Error",

      error: error.message,
    });
  }
};
export const getAllInterviewReports = async (req, res) => {
  try {
    const data = await InterviewReport.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });
    if (!data) {
      res.status(401).json({ message: "No Data were found" });
    }
    res.status(200).json({
      message: "All Data Were Fetch Successfully",
      interviewReport: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getInterviewReportsById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await InterviewReport.findById({
      _id: id,
      user: req.user.id,
    });
    if (!data) {
      res.status(401).json({ message: "No Data were found" });
    }
    res.status(200).json({
      message: "All Data Were Fetch Successfully",
      interviewReport: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

function publicMockInterview(session) {
  const result = session.toObject ? session.toObject() : { ...session };
  if (result.status !== "completed") result.questions = result.questions.map(({ benchmarkAnswer, ...question }) => question);
  return result;
}

export const startMockInterview = async (req, res) => {
  try {
    const { jobDescription, roleTitle = "", resume = "", selfDescription = "", sourceReportId = null } = req.body || {};
    const questionCount = Number(req.body?.questionCount ?? 16);
    const secondsPerQuestion = Number(req.body?.secondsPerQuestion ?? 30);
    if (typeof jobDescription !== "string" && !sourceReportId) return res.status(400).json({ message: "A job description or sourceReportId is required" });
    if (typeof jobDescription === "string" && jobDescription.length > 20000) return res.status(400).json({ message: "Job description, resume, or candidate description is too long or invalid" });
    if ((typeof jobDescription === "string" && jobDescription.length > 20000) || (typeof resume !== "string") || resume.length > 20000 || (typeof selfDescription !== "string") || selfDescription.length > 5000) return res.status(400).json({ message: "Job description, resume, or candidate description is too long or invalid" });
    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 30) return res.status(400).json({ message: "questionCount must be between 1 and 30" });
    if (!Number.isInteger(secondsPerQuestion) || secondsPerQuestion < 10 || secondsPerQuestion > 300) return res.status(400).json({ message: "secondsPerQuestion must be between 10 and 300" });
    let report = null;
    if (sourceReportId) {
      if (!/^[a-f\d]{24}$/i.test(sourceReportId)) return res.status(400).json({ message: "Invalid sourceReportId" });
      report = await InterviewReport.findOne({ _id: sourceReportId, user: req.user.id });
      if (!report) return res.status(404).json({ message: "Interview report not found" });
    }
    const sessionJobDescription = (typeof jobDescription === "string" ? jobDescription.trim() : "") || report?.jobDescription;
    if (!sessionJobDescription || sessionJobDescription.length < 30) return res.status(400).json({ message: "A job description of at least 30 characters is required" });
    const questions = await generateMockInterviewQuestions({
      jobDescription: report?.jobDescription || sessionJobDescription,
      roleTitle,
      resume: resume || report?.resume || "",
      selfDescription: selfDescription || report?.selfDescription || "",
      questionCount,
    });
    const session = await MockInterview.create({
      user: req.user.id,
      sourceReport: report?._id || null,
      jobDescription: report?.jobDescription || sessionJobDescription,
      roleTitle,
      resume: resume || report?.resume || "",
      selfDescription: selfDescription || report?.selfDescription || "",
      questionCount,
      secondsPerQuestion,
      questions,
    });
    return res.status(201).json({ message: "Mock interview started", mockInterview: publicMockInterview(session) });
  } catch (error) {
    console.error("Start mock interview error:", error.message);
    return res.status(error.message?.includes("AI returned") || error.message?.includes("AI did not") ? 502 : 500).json({ message: "Could not start mock interview. Please try again.", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

export const getMockInterview = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ message: "Invalid mock interview id" });
    const session = await MockInterview.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ message: "Mock interview not found" });
    return res.status(200).json({ mockInterview: publicMockInterview(session) });
  } catch (error) {
    return res.status(500).json({ message: "Could not load mock interview" });
  }
};

export const submitMockInterviewAnswer = async (req, res) => {
  try {
    const { questionIndex, answer = "", status = "answered", timeSpentSeconds = 0 } = req.body || {};
    if (!Number.isInteger(questionIndex) || typeof answer !== "string" || answer.length > 12000) return res.status(400).json({ message: "Valid questionIndex and answer (up to 12000 characters) are required" });
    if (!["answered", "skipped", "timed_out"].includes(status)) return res.status(400).json({ message: "status must be answered, skipped, or timed_out" });
    if (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 0 || timeSpentSeconds > 300) return res.status(400).json({ message: "Invalid timeSpentSeconds" });
    const session = await MockInterview.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ message: "Mock interview not found" });
    if (session.status !== "in_progress") return res.status(409).json({ message: "Mock interview is already completed" });
    if (questionIndex !== session.currentQuestionIndex || questionIndex >= session.questions.length) return res.status(409).json({ message: "Question index is out of sequence", currentQuestionIndex: session.currentQuestionIndex });
    const question = session.questions[questionIndex];
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(session.currentQuestionStartedAt).getTime()) / 1000));
    const timedOut = elapsedSeconds > session.secondsPerQuestion + 2;
    const safeAnswer = answer.trim();
    const outcome = timedOut ? "timed_out" : status === "answered" && !safeAnswer ? "skipped" : status;
    const effectiveAnswer = timedOut ? "" : safeAnswer;
    const evaluation = await evaluateMockInterviewAnswer({ question, answer: effectiveAnswer, jobDescription: session.jobDescription, resume: session.resume });
    question.answer = effectiveAnswer;
    question.score = outcome === "answered" ? evaluation.score : 0;
    question.feedback = evaluation.feedback;
    question.strengths = outcome === "answered" ? evaluation.strengths : [];
    question.improvements = evaluation.improvements;
    question.status = outcome;
    question.timeSpentSeconds = timeSpentSeconds;
    session.currentQuestionIndex += 1;
    session.totalTimeSeconds += Math.min(timeSpentSeconds, session.secondsPerQuestion, elapsedSeconds);
    session.currentQuestionStartedAt = new Date();
    await session.save();
    return res.status(200).json({ message: "Answer recorded", evaluation: { ...evaluation, score: question.score }, status: outcome, nextQuestionIndex: session.currentQuestionIndex, isComplete: session.currentQuestionIndex >= session.questions.length });
  } catch (error) {
    console.error("Submit mock answer error:", error.message);
    return res.status(error.message?.includes("AI returned") ? 502 : 500).json({ message: "Could not evaluate answer. Please try again.", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

export const completeMockInterview = async (req, res) => {
  try {
    const session = await MockInterview.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ message: "Mock interview not found" });
    if (session.status === "completed") return res.status(200).json({ message: "Mock interview report", mockInterview: session });
    if (session.currentQuestionIndex < session.questions.length) return res.status(409).json({ message: "Answer or skip all questions before completing the interview", currentQuestionIndex: session.currentQuestionIndex });
    const performance = await generateMockInterviewPerformance({ questions: session.questions, jobDescription: session.jobDescription, resume: session.resume, totalTimeSeconds: session.totalTimeSeconds });
    session.performance = performance;
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();
    return res.status(200).json({ message: "Mock interview completed", mockInterview: session });
  } catch (error) {
    console.error("Complete mock interview error:", error.message);
    return res.status(error.message?.includes("AI returned") ? 502 : 500).json({ message: "Could not generate mock interview report. Please try again.", error: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

export const getMockInterviewHistory = async (req, res) => {
  try {
    const sessions = await MockInterview.find({ user: req.user.id }).select("roleTitle questionCount status performance.overallScore startedAt completedAt createdAt").sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ mockInterviews: sessions });
  } catch (error) {
    return res.status(500).json({ message: "Could not load mock interview history" });
  }
};
