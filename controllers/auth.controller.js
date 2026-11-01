import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import BlackList from "../models/blacklist.model.js";
import { createHash, randomBytes } from "node:crypto";

async function sendPasswordResetEmail(email, resetUrl) {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = ENV;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error("Password reset email is not configured");
  }

  let nodemailer;
  try {
    ({ default: nodemailer } = await import("nodemailer"));
  } catch {
    throw new Error("Install nodemailer to enable password reset emails");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "Reset your Talent IQ password",
    text: `Use this link to reset your password. It expires in 15 minutes: ${resetUrl}`,
    html: `<p>Use the link below to reset your password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
}

export async function forgotPassword(req, res) {
  const genericResponse = {
    message: "If an account exists for that email, password reset instructions have been sent.",
  };
  try {
    const email = req.body?.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(genericResponse);

    const frontendUrl = ENV.FRONTEND_URL?.replace(/\/$/, "");
    if (!frontendUrl) throw new Error("FRONTEND_URL is not configured");
    const rawToken = randomBytes(32).toString("hex");
    user.passwordResetToken = createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw error;
    }
    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password failed:", error.message);
    return res.status(500).json({ message: "Unable to send password reset email" });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body ?? {};
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const hashedToken = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");
    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password failed:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
}

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
