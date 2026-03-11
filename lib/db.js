import mongoose from "mongoose";
import {ENV} from "./env.js"

export async function connectDb() {
    try {
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        const conn=await mongoose.connect(ENV.DB_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn.connection;
    } catch (error) {
        console.log("Error Connecting Db",error);
        throw error;
    }
}






