import 'dotenv/config';

export const ENV={
    PORT: process.env.PORT || 3000,
    DB_URI: process.env.DB_URI ,
    JWT_SECRET:process.env.JWT_SECRET,
    GOOGLE_GENAI_API_KEY:process.env.GOOGLE_GENAI_API_KEY,
    GROQ_API_KEY:process.env.GROQ_API_KEY,
    NODE_ENV: process.env.NODE_ENV || "development",
    FRONTEND_URL: process.env.FRONTEND_URL,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
}
