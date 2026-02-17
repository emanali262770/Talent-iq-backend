import 'dotenv/config';

export const ENV={
    PORT: process.env.PORT || 3000,
    DB_URI: process.env.DB_URI 
}