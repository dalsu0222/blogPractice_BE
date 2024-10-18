// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

// 사용자 정보 조회
router.get('/:username', userController.getUserInfo);

// 사용자 정보 수정
router.put('/:username', 
  upload.single('userImage'), 
  userController.updateUserInfo
);

// 사용자의 게시물 목록 조회
router.get('/:username/posts', userController.getUserPosts);

module.exports = router;
