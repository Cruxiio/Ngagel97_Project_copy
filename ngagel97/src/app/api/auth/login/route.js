import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import connectDB from "@/app/api/mongoose";
import { NextResponse } from "next/server";
const SECRET_KEY = process.env.JWT_SECRET;

export async function POST(request) {
  await connectDB();

  try {
    const { email, password, rememberMe } = await request.json();

    const user = await User.findOne({ email, deleted: false });

    // Cek apakah user ditemukan
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email tidak",
          data: null,
          error: "User not found",
        },
        { status: 401 }
      );
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Password salah",
          data: null,
          error: "Incorrect password",
        },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: rememberMe ? "365d" : "12h" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: { token },
      error: null,
    });

    // response.cookies.set("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   maxAge: rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 12, // 1 tahun atau 12 jam
    //   path: "/",
    // });
    response.cookies.set("token", token, {
      httpOnly: false,
      secure: false,
      maxAge: rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 12, // 1 tahun atau 12 jam
      path: "/",
    });

    // response.cookies.set("role", user.role, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   maxAge: rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 12, // 1 tahun atau 12 jam
    //   path: "/",
    // });
    response.cookies.set("role", user.role, {
      httpOnly: false,
      secure: false,
      maxAge: rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 12, // 1 tahun atau 12 jam
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Login failed",
        data: null,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
