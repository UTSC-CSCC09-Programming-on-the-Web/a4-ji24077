"use strict";

const { User, Image, Comment } = require("../models");

// Auth check middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }
  next();
};

// Optional auth middleware (if authenticated, store user info in req.user)
const optionalAuth = (req, res, next) => {
  if (req.session.userId) {
    req.user = {
      userId: req.session.userId,
      username: req.session.username,
    };
  }
  next();
};

// Gallery owner check middleware
const requireGalleryOwner = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { imageId } = req.params;
    const image = await Image.findByPk(imageId);

    if (!image) {
      return res.status(404).json({
        error: "Image not found",
      });
    }

    if (image.userId !== req.session.userId) {
      return res.status(403).json({
        error: "Access denied. You can only modify your own gallery.",
      });
    }

    req.image = image;
    next();
  } catch (error) {
    console.error("Error in requireGalleryOwner:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Comment owner or gallery owner check middleware
const requireCommentOwnerOrGalleryOwner = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { commentId } = req.params;
    const comment = await Comment.findByPk(commentId, {
      include: [
        {
          model: Image,
          as: "Image",
        },
      ],
    });

    if (!comment) {
      return res.status(404).json({
        error: "Comment not found",
      });
    }

    // Check if comment owner or gallery owner
    const isCommentOwner = comment.userId === req.session.userId;
    const isGalleryOwner = comment.Image.userId === req.session.userId;

    if (!isCommentOwner && !isGalleryOwner) {
      return res.status(403).json({
        error: "Access denied. You can only delete your own comments or comments in your gallery.",
      });
    }

    req.comment = comment;
    next();
  } catch (error) {
    console.error("Error in requireCommentOwnerOrGalleryOwner:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireGalleryOwner,
  requireCommentOwnerOrGalleryOwner,
};
