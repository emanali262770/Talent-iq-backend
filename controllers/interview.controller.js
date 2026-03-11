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

    // Lazy-load PDF parser to avoid crashing the whole serverless function at startup.
    const pdfModule = await import("pdf-parse");
    let resumeText = "";

    if (typeof pdfModule.default === "function") {
      const result = await pdfModule.default(resumefile.buffer);
      resumeText = result.text;
    } else if (typeof pdfModule.PDFParse === "function") {
      const parser = new pdfModule.PDFParse({ data: resumefile.buffer });
      const result = await parser.getText();
      resumeText = result.text;
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
    } else {
      throw new Error("Unsupported pdf-parse module format");
    }

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