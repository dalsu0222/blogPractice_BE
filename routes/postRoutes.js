// routes/postRoutes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

// 공개 라우트 - 인증 불필요
router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);

// 보호된 라우트 - 인증 필요
router.post("/write", auth, upload.single("files"), postController.create);
router.put("/:id", auth, upload.single("files"), postController.updatePost);
router.delete("/:id", auth, postController.deletePost);
router.post("/likes/:postId", auth, postController.toggleLike);

module.exports = router;
