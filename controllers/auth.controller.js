import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import BlackList from "../models/blacklist.model.js";

function getCookieOptions() {
  const isProduction = ENV.NODE_ENV === "production" || !!process.env.VERCEL;

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  };
}
/**
 * @Post User Registration
 * @description This endpoint alllows users to register by providing their username, email, and password. The password is hashed before being stored in the database for security.
 */
export const register = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const IsUserExist = await User.findOne({ $or: [{ email }, { userName }] });
    if (IsUserExist) {
      return res
        .status(400)
        .json({ message: "UserName or Email is Already Taken" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      userName,
      email,
      password: hashPassword,
    });
    const token = jwt.sign({ id: newUser._id }, ENV.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, getCookieOptions());
    res
      .status(201)
      .json({ message: "User Registered Successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @Post User Login
 * @description This endpoint allows users to log in by providing their email and password. The provided password is compared with the hashed password stored in the database. If the credentials are valid, a JWT token is generated and sent back to the client.
 */

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const ispassValid = await bcrypt.compare(password, user.password);

    if (!ispassValid) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign(
      { id: user._id, userName: user.userName },
      ENV.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.cookie("token", token, getCookieOptions());
    res.status(200).json({
      message: "Login Successful",
      token,
      user: { id: user._id, userName: user.userName, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export async function logout(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }
    const blacklistedToken = await BlackList.create({ token });
    res.clearCookie("token", getCookieOptions());
    res
      .status(200)
      .json({ message: "Logout Successful", data: blacklistedToken });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

/**
 * @get User
 */
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}
