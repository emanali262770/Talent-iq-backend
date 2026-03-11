import app from "../app.js";
import { connectDb } from "../lib/db.js";

let isDbConnected = false;

export default async function handler(req, res) {
  if (!isDbConnected) {
    await connectDb();
    isDbConnected = true;
  }

  return app(req, res);
}
