import "dotenv/config";
import { ENV } from "./lib/env.js";
import { connectDb } from "./lib/db.js";
import app from "./app.js";

const PORT = ENV.PORT || 3000;

async function startServer() {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server.js:", error);
    process.exit(1);
  }
}
startServer();
