"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { Image, Comment, User } = require("../models");
const { requireAuth, requireGalleryOwner, optionalAuth } = require("../middleware/auth");

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Type validation middleware
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

const validateImageData = (req, res, next) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(422).json({
      error: "Title is required and must be a non-empty string.",
    });
  }

  next();
};

const validateCommentData = (req, res, next) => {
  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(422).json({
      error: "Content is required and must be a non-empty string.",
    });
  }

  next();
};

// GET /api/images - Get all images (pagination)
router.get("/", validateQueryParams, optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const images = await Image.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["date", "DESC"]],
      include: [
        {
          model: User,
          as: "User",
          attributes: ["userId", "username"],
        },
      ],
    });

    res.json({
      images: images.rows.map((image) => ({
        imageId: image.imageId,
        title: image.title,
        description: image.description,
        author: image.User.username,
        url: image.url,
        date: image.date,
        userId: image.userId,
      })),
      total: images.count,
      offset: offset,
      limit: limit,
      hasNext: offset + limit < images.count,
      hasPrev: offset > 0,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({
      error: "Failed to retrieve images from database. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// POST /api/images - Upload new image (requires authentication)
router.post("/", upload.single("image"), requireAuth, validateImageData, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(422).json({ error: "Image file is required" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const imageId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    const image = await Image.create({
      imageId: imageId,
      userId: req.session.userId,
      title: req.body.title.trim(),
      description: req.body.description ? req.body.description.trim() : null,
      author: req.session.username,
      url: imageUrl,
      date: new Date(),
    });

    res.status(201).json({
      imageId: image.imageId,
      title: image.title,
      description: image.description,
      author: image.author,
      url: image.url,
      date: image.date,
      userId: image.userId,
    });
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({
      error: "Failed to save image to database. Please check your input and try again.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/images/:imageId - Get specific image
router.get("/:imageId", validateQueryParams, optionalAuth, async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!imageId || typeof imageId !== "string") {
      return res.status(422).json({ error: "Invalid image ID" });
    }

    const image = await Image.findByPk(imageId, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["userId", "username"],
        },
      ],
    });

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json({
      imageId: image.imageId,
      title: image.title,
      description: image.description,
      author: image.User.username,
      url: image.url,
      date: image.date,
      userId: image.userId,
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({
      error: "Failed to retrieve image from database. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// DELETE /api/images/:imageId - Delete image (gallery owner only)
router.delete("/:imageId", requireGalleryOwner, async (req, res) => {
  try {
    await req.image.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      error: "Failed to delete image from database. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/images/:imageId/comments - Get comments for image (authenticated users only)
router.get("/:imageId/comments", validateQueryParams, requireAuth, async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!imageId || typeof imageId !== "string") {
      return res.status(422).json({ error: "Invalid image ID" });
    }

    const image = await Image.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const comments = await Comment.findAndCountAll({
      where: { imageId: imageId },
      limit: limit,
      offset: offset,
      order: [["date", "DESC"]],
      include: [
        {
          model: User,
          as: "User",
          attributes: ["userId", "username"],
        },
      ],
    });

    res.json({
      comments: comments.rows.map((comment) => ({
        commentId: comment.commentId,
        imageId: comment.imageId,
        author: comment.User.username,
        content: comment.content,
        date: comment.date,
        userId: comment.userId,
      })),
      total: comments.count,
      offset: offset,
      limit: limit,
      hasNext: offset + limit < comments.count,
      hasPrev: offset > 0,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      error: "Failed to retrieve comments from database. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// POST /api/images/:imageId/comments - Add comment (requires authentication)
router.post("/:imageId/comments", requireAuth, validateCommentData, async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!imageId || typeof imageId !== "string") {
      return res.status(422).json({ error: "Invalid image ID" });
    }

    const image = await Image.findByPk(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const commentId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const comment = await Comment.create({
      commentId: commentId,
      userId: req.session.userId,
      imageId: imageId,
      author: req.session.username,
      content: req.body.content.trim(),
      date: new Date(),
    });

    res.status(201).json({
      commentId: comment.commentId,
      imageId: comment.imageId,
      author: comment.author,
      content: comment.content,
      date: comment.date,
      userId: comment.userId,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      error: "Failed to save comment to database. Please check your input and try again.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
