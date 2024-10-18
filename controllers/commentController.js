// controllers/commentController.js
const Comment = require('../modules/Comment');

const commentController = {
  async create(req, res) {
    const { postId, content, author } = req.body;

    try {
      const comment = await Comment.create({
        content,
        author,
        post: postId,
      });
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "댓글 생성 중 오류가 발생했습니다." });
    }
  },

  async getCommentsByPost(req, res) {
    try {
      const comments = await Comment.find({ post: req.params.postId })
        .sort({ createdAt: -1 });
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "서버 에러" });
    }
  },

  async updateComment(req, res) {
    const { commentId } = req.params;
    const { content } = req.body;

    try {
      const comment = await Comment.findByIdAndUpdate(
        commentId,
        { content, updatedAt: new Date() },
        { new: true }
      );
      if (!comment) {
        return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
      }
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "댓글 수정 중 오류가 발생했습니다." });
    }
  },

  async deleteComment(req, res) {
    const { commentId } = req.params;

    try {
      const comment = await Comment.findByIdAndDelete(commentId);
      if (!comment) {
        return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
      }
      res.json({ message: "댓글이 삭제되었습니다." });
    } catch (error) {
      res.status(500).json({ message: "댓글 삭제 중 오류가 발생했습니다." });
    }
  }
};

module.exports = commentController;
