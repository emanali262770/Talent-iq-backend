import 'dotenv/config';

export const ENV={
    PORT: process.env.PORT || 3000,
    DB_URI: process.env.DB_URI ,
    JWT_SECRET:process.env.JWT_SECRET,
    GOOGLE_GENAI_API_KEY:process.env.GOOGLE_GENAI_API_KEY,
}