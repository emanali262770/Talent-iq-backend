import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import BlackList from "../models/blacklist.model.js";

export const checkBlackList = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // check blacklist
    const isBlacklisted = await BlackList.findOne({ token });

    if (isBlacklisted) {
      return res
        .status(401)
        .json({ message: "Token is blacklisted, please login again" });
    }

    // verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired, please login again",
      });
    }

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};