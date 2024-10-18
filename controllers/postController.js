// controllers/postController.js
const Post = require("../modules/Post");
const Comment = require("../modules/Comment");
const jwt = require("jsonwebtoken");
const handleFile = require("../utils/fileHandler");
const secret = process.env.JWT_SECRET;

const postController = {
  async create(req, res) {
    const newPath = handleFile(req);
    const { token } = req.cookies;

    try {
      const info = jwt.verify(token, secret);
      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: info.username,
      });
      res.json(postDoc);
    } catch (err) {
      res.status(500).json({ message: "게시물 생성 중 오류가 발생했습니다." });
    }
  },

  async getAllPosts(req, res) {
    try {
      const posts = await Post.find().sort({ createdAt: -1 }).limit(20);
      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const commentCount = await Comment.countDocuments({ post: post._id });
          return {
            ...post.toObject(),
            commentCount,
            likeCount: post?.likes ? post?.likes.length : 0,
          };
        })
      );
      res.json(postsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "서버 에러" });
    }
  },

  async getPostById(req, res) {
    const { id } = req.params;
    try {
      const postDoc = await Post.findById(id);
      res.json(postDoc);
    } catch (error) {
      res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
    }
  },

  async updatePost(req, res) {
    const { id } = req.params;
    const { token } = req.cookies;
    if (!token) return res.status(401).json("로그인이 필요합니다");

    const newPath = handleFile(req);

    try {
      jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body;
        const updateDoc = await Post.findByIdAndUpdate(id, {
          title,
          summary,
          content,
          cover: newPath ? newPath : req.body.cover,
        });
        res.json(updateDoc);
      });
    } catch (error) {
      res.status(500).json({ message: "게시물 수정 중 오류가 발생했습니다." });
    }
  },

  async deletePost(req, res) {
    const { id } = req.params;
    try {
      await Post.findByIdAndDelete(id);
      res.json({ message: "삭제되었습니다." });
    } catch (error) {
      res.status(500).json({ message: "게시물 삭제 중 오류가 발생했습니다." });
    }
  },

  async toggleLike(req, res) {
    const { postId } = req.params;
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    try {
      const userInfo = jwt.verify(token, secret);
      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
      }

      const userIdStr = userInfo.id.toString();
      const likeIndex = post?.likes?.indexOf(userIdStr);
      if (likeIndex > -1) {
        post?.likes?.splice(likeIndex, 1);
      } else {
        post?.likes?.push(userIdStr);
      }

      await post.save();
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "서버 에러" });
    }
  },
};

module.exports = postController;
