import mongoose from "mongoose";

const UserScheme = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: [true, "UserName is Already Taken"],
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email is Already Taken"],
  },
  password: {
    type: String,
    required: true,
  },
});
const User=mongoose.model("User", UserScheme);
export default User;