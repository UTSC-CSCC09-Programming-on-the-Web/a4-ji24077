"use strict";

const express = require("express");
const router = express.Router();
const { User, Image } = require("../models");
const { optionalAuth } = require("../middleware/auth");

// 쿼리 파라미터 검증
const validateQueryParams = (req, res, next) => {
  const { limit, offset } = req.query;

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(422).json({
      error: "Invalid limit parameter. Must be a number between 1 and 100.",
    });
  }

  if (offset && (isNaN(offset) || parseInt(offset) < 0)) {
    return res.status(422).json({
      error: "Invalid offset parameter. Must be a non-negative number.",
    });
  }

  next();
};

// GET /api/users - 모든 사용자 갤러리 목록 (페이지네이션)
router.get("/", validateQueryParams, optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const users = await User.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["date", "DESC"]],
      include: [
        {
          model: Image,
          as: "Images",
          attributes: ["imageId", "title", "url", "date"],
          limit: 1, // 각 사용자의 최신 이미지 1개만
          order: [["date", "DESC"]],
        },
      ],
    });

    res.json({
      users: users.rows.map((user) => ({
        userId: user.userId,
        username: user.username,
        imageCount: user.Images ? user.Images.length : 0,
        latestImage: user.Images && user.Images.length > 0 ? user.Images[0] : null,
      })),
      total: users.count,
      offset: offset,
      limit: limit,
      hasNext: offset + limit < users.count,
      hasPrev: offset > 0,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "Failed to retrieve users from database. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/users/:userId - 특정 사용자의 갤러리
router.get("/:userId", validateQueryParams, optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const images = await Image.findAndCountAll({
      where: { userId: userId },
      limit: limit,
      offset: offset,
      order: [["date", "DESC"]],
    });

    res.json({
      user: {
        userId: user.userId,
        username: user.username,
      },
      images: images.rows,
      total: images.count,
      offset: offset,
      limit: limit,
      hasNext: offset + limit < images.count,
      hasPrev: offset > 0,
    });
  } catch (error) {
    console.error("Error fetching user gallery:", error);
    res.status(500).json({
      error: "Failed to retrieve user gallery from database. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
