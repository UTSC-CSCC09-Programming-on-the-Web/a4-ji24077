"use strict";

const express = require("express");
const router = express.Router();
const { Comment } = require("../models");
const { requireCommentOwnerOrGalleryOwner } = require("../middleware/auth");

// DELETE /api/comments/:commentId - 댓글 삭제 (댓글 소유자 또는 갤러리 소유자만)
router.delete("/:commentId", requireCommentOwnerOrGalleryOwner, async (req, res) => {
  try {
    await req.comment.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      error: "Failed to delete comment from database. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
