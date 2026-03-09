import { GoogleGenAI, Type } from "@google/genai";
import { ENV } from "../lib/env.js";

// ─── 1. Gemini Native Schema ──────────────────────────────────────────────────

const interviewReportSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The title of the job for which the interview report is generated"
        },
        matchScore: {
            type: Type.NUMBER,
            description: "A score between 0 and 100 indicating how well the candidate profile matches the job description"
        },
        technicalQuestions: {
            type: Type.ARRAY,
            description: "Exactly 5 technical questions tailored to the job description and candidate resume",
            items: {
                type: Type.OBJECT,
                properties: {
                    question:  { type: Type.STRING, description: "The technical question to ask in the interview" },
                    intention: { type: Type.STRING, description: "Why the interviewer is asking this question" },
                    answer:    { type: Type.STRING, description: "How to answer this question, what points to cover, what approach to take etc." },
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestions: {
            type: Type.ARRAY,
            description: "Exactly 4 behavioral questions tailored to the candidate background",
            items: {
                type: Type.OBJECT,
                properties: {
                    question:  { type: Type.STRING, description: "The behavioral question to ask in the interview" },
                    intention: { type: Type.STRING, description: "Why the interviewer is asking this question" },
                    answer:    { type: Type.STRING, description: "How to answer this question, what points to cover, what approach to take etc." },
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: Type.ARRAY,
            description: "Skills required by the job description that are missing from the candidate profile",
            items: {
                type: Type.OBJECT,
                properties: {
                    skill:    { type: Type.STRING, description: "The missing skill" },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"], description: "How critically this gap impacts the candidate chances" },
                },
                required: ["skill", "severity"]
            }
        },
        preparationPlan: {
            type: Type.ARRAY,
            description: "A 7-day preparation plan. Day 7 must be mock interview and review",
            items: {
                type: Type.OBJECT,
                properties: {
                    day:   { type: Type.NUMBER, description: "Day number starting from 1" },
                    focus: { type: Type.STRING, description: "Main topic for this day e.g. Node.js async patterns, system design" },
                    tasks: {
                        type: Type.ARRAY,
                        description: "3 to 5 specific actionable tasks with real resources",
                        items: { type: Type.STRING }
                    },
                },
                required: ["day", "focus", "tasks"]
            }
        },
    },
    required: ["title", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"]
};

// ─── 2. Gemini Client ─────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: ENV.GOOGLE_GENAI_API_KEY });

// ─── 3. Main Function ─────────────────────────────────────────────────────────

export async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
       const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: interviewReportSchema,
                temperature: 1,
            },
        });

        const data = JSON.parse(response.text.trim());

        console.log("FINAL DATA:", JSON.stringify(data, null, 2));

        return data;

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}