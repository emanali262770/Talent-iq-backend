import "dotenv/config";
import express from "express";
import { ENV } from "./lib/env.js";
import { connectDb } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
const app = express();
const PORT = ENV.PORT || 3000;

// middleware
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
// routes
app.use("/api/auth", authRoutes);


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
