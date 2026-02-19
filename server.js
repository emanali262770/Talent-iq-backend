import express from "express";
import { ENV } from "./lib/env.js";
import { connectDb } from "./lib/db.js";
const app = express();
const PORT = ENV.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the TalentIQ Backend!" });
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
