import "dotenv/config";
import express from "express";
import { ENV } from "./lib/env.js";
import { connectDb } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const PORT = ENV.PORT || 3000;

// middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}))
app.use(express.urlencoded({ extended: true }));
// routes
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Interview Preparation API");
});
async function startServer() {
  try {
    await connectDb();
 
  
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server.js:", error);
  }
}
startServer();
