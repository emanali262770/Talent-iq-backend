import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { ENV } from "../lib/env.js";


// Schema

const interviewSchema = z.object({

  title: z.string(),

  matchScore: z.number()
    .min(0)
    .max(100),

  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    })
  ).length(5),

  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    })
  ).length(4),

  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum([
        "low",
        "medium",
        "high"
      ]),
    })
  ),

  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()),
    })
  ).length(7),

});



// Groq Model

const groq = new ChatGroq({

  apiKey: ENV.GROQ_API_KEY,

  model: "openai/gpt-oss-120b",

  temperature: 0,

  maxTokens: 6000,

});



// Structured Output

const structuredModel = groq.withStructuredOutput(
  interviewSchema,
  {
    method: "functionCalling",
    name: "interview_report",
  }
);

const MAX_RETRIES = 2;

function isRetryableAiError(error) {
  const message = error?.message || "";

  return (
    message.includes("tool_use_failed") ||
    message.includes("json_validate_failed") ||
    message.includes("Failed to parse tool call arguments") ||
    message.includes("Failed to generate JSON")
  );
}




// Generate Interview Report

export async function generateInterviewReport({

  resume,

  selfDescription,

  jobDescription,

}) {


  try {


    const prompt = `

You are an expert technical interviewer and career advisor.

Your task is to analyze a candidate resume against a job description
and create a realistic interview preparation report.



====================
CANDIDATE RESUME
====================

${resume}



====================
CANDIDATE DESCRIPTION
====================

${selfDescription || "Not provided"}



====================
JOB DESCRIPTION
====================

${jobDescription}



====================
ANALYSIS RULES
====================


1. Calculate matchScore from 0-100.

Use this formula:

- Required technical skills match: 50%
- Professional experience match: 20%
- Education match: 10%
- Projects relevance: 20%


2. Compare only real information from resume and job description.

3. Do not assume candidate has skills that are not mentioned.

4. Identify missing skills that can affect hiring chances.



====================
INTERVIEW QUESTIONS
====================


Generate:

- Exactly 5 technical questions
- Exactly 4 behavioral questions


Technical questions should focus on:
- Required job technologies
- Candidate weak areas
- Real interview scenarios


For every question provide:

question:
The interview question

intention:
Why interviewer asks this question

answer:
What a strong candidate answer should include



====================
PREPARATION PLAN
====================


Create a 7 day preparation plan.

Each day must have:

day:
Day number

focus:
Main learning topic

tasks:
3-5 practical tasks



Day 7 must include:

- Mock interview
- Review mistakes
- Final preparation

Keep all answers concise:
- question: one sentence
- intention: one sentence
- answer: 2 short sentences maximum
- focus: short phrase
- each task: short practical action


====================
IMPORTANT
====================


- Return only structured data.
- Do not use markdown.
- Do not create fake companies or experiences.
- Do not mention Gemini, OpenAI, or other AI providers.
- Only use technologies present in resume or job description.


`;



    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await structuredModel.invoke(prompt);

        return result;
      } catch (error) {
        lastError = error;

        if (!isRetryableAiError(error) || attempt === MAX_RETRIES) {
          throw error;
        }
      }
    }


    throw lastError;



  } catch (error) {


    console.log(
      "Groq Error:",
      error.message
    );


    throw error;


  }

}
