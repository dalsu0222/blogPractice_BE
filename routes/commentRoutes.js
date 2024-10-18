// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// 댓글 작성
router.post('/', commentController.create);

// 게시물의 댓글 목록 조회
router.get('/:postId', commentController.getCommentsByPost);

// 댓글 수정
router.put('/:commentId', commentController.updateComment);

// 댓글 삭제
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
