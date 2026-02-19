import mongoose from "mongoose";
import {ENV} from "./env.js"



export async function connectDb() {
    try {
        const conn=await mongoose.connect(ENV.DB_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log("Error Connecting Db",error);
        process.exit(1);
    }
}