import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import config from "../config/config.js"
import crypto from "crypto"

export const hashPassword = (password)=>{
    return bcrypt.hashSync(password,10)
}

export const comparePassword =async (password,hashedPassword) =>{
    return bcrypt.compare(password,hashedPassword)
}
export const createAccessToken = (user)=>{
     const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      config.secret_key,
      { expiresIn: "15m" },
    );
    return token;
}

export const createRefreshToken = () => {
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    return { refreshToken, hashedToken };
  };
