import { PDFParse } from "pdf-parse";
import { generateInterviewReport } from "../services/ai.service.js";
import InterviewReport from "../models/interviewReport.model.js";


export const generateInterviewReports = async (req, res) => {
  try {
    const resumefile = req.file;

    if (!resumefile) {
      return res.status(400).json({
        message: "Resume file is required",
      });
    }

    const parser = new PDFParse({ data: resumefile.buffer });

    const result = await parser.getText();
    const resumeText = result.text;

    const { selfDescription, jobDescription } = req.body;

    const interviewGenerate = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });

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
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
export const getAllInterviewReports=async(req,res)=>{
  try {
      const data=await InterviewReport.find({
        user:req.user.id
      }).sort({ createdAt: -1 });;
      if (!data) {
        res.status(401).json({message:"No Data were found"})
      }
      res.status(200).json({message: "All Data Were Fetch Successfully",interviewReport:data})
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

export const getInterviewReportsById=async(req,res)=>{
  try {
    const {id}=req.params
      const data=await InterviewReport.findById({
        _id:id,
        user:req.user.id
      });
      if (!data) {
        res.status(401).json({message:"No Data were found"})
      }
      res.status(200).json({message: "All Data Were Fetch Successfully",interviewReport:data})
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}