"use strict";

const express = require("express");
const router = express.Router();
const { User } = require("../models");
const bcrypt = require("bcrypt");

// 입력값 검증 미들웨어
const validateSignupData = (req, res, next) => {
  const { username, password, email } = req.body;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(422).json({
      error: "Username is required and must be at least 3 characters long.",
    });
  }

  if (!password || typeof password !== "string" || password.trim().length < 6) {
    return res.status(422).json({
      error: "Password is required and must be at least 6 characters long.",
    });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(422).json({
      error: "Valid email is required.",
    });
  }

  next();
};

const validateLoginData = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || typeof username !== "string" || username.trim().length === 0) {
    return res.status(422).json({
      error: "Username is required.",
    });
  }

  if (!password || typeof password !== "string" || password.trim().length === 0) {
    return res.status(422).json({
      error: "Password is required.",
    });
  }

  next();
};

// POST /api/auth/signup - 회원가입
router.post("/signup", validateSignupData, async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // 사용자명 중복 확인
    const existingUser = await User.findOne({
      where: { username: username.trim() },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Username already exists. Please choose a different username.",
      });
    }

    // 이메일 중복 확인
    const existingEmail = await User.findOne({
      where: { email: email.trim() },
    });

    if (existingEmail) {
      return res.status(409).json({
        error: "Email already exists. Please use a different email.",
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // 사용자 생성
    const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const user = await User.create({
      userId: userId,
      username: username.trim(),
      password: hashedPassword,
      email: email.trim(),
      date: new Date(),
    });

    // 세션에 사용자 정보 저장
    req.session.userId = user.userId;
    req.session.username = user.username;

    res.status(201).json({
      message: "User registered successfully",
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      error: "Failed to create user. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// POST /api/auth/login - 로그인
router.post("/login", validateLoginData, async (req, res) => {
  try {
    const { username, password } = req.body;

    // 사용자 찾기
    const user = await User.findOne({
      where: { username: username.trim() },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password.",
      });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password.trim(), user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid username or password.",
      });
    }

    // 세션에 사용자 정보 저장
    req.session.userId = user.userId;
    req.session.username = user.username;

    res.json({
      message: "Login successful",
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      error: "Failed to login. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// POST /api/auth/logout - 로그아웃
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({
        error: "Failed to logout. Please try again later.",
      });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
});

// GET /api/auth/me - 현재 로그인한 사용자 정보
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      error: "Not authenticated",
    });
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
  });
});

module.exports = router;
