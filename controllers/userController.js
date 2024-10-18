// controllers/userController.js
const User = require("../modules/User");
const Post = require("../modules/Post");
const Comment = require("../modules/Comment");
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const userController = {
  async getUserInfo(req, res) {
    const { username } = req.params;
    try {
      const userDoc = await User.findOne({ username });
      if (!userDoc) {
        return res.status(404).json({ message: "사용자정보를 찾을 수 없어요" });
      }
      res.json(userDoc);
    } catch (error) {
      res.status(500).json({ message: "서버에러" });
    }
  },

  async updateUserInfo(req, res) {
    const { username } = req.params;
    const { password, newpassword } = req.body;

    try {
      const userDoc = await User.findOne({ username });
      if (!userDoc) {
        return res.status(404).json({ message: "사용자정보를 찾을 수 없어요" });
      }

      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (!passOk) {
        return res.status(400).json({ message: "현재 비밀번호가 맞지 않아요" });
      }

      const updateData = {};

      if (newpassword) {
        updateData.password = bcrypt.hashSync(newpassword, saltRounds);
      }

      if (req.file) {
        updateData.userImage = req.file.filename;
      }

      await User.findByIdAndUpdate(userDoc._id, updateData);
      res.json({ message: "사용자 정보가 정상적으로 수정되었습니다" });
    } catch (error) {
      res.status(500).json({ message: "서버에러" });
    }
  },

  async getUserPosts(req, res) {
    const { username } = req.params;
    try {
      const posts = await Post.find({ author: username })
        .sort({ createdAt: -1 })
        .lean();

      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const commentCount = await Comment.countDocuments({
            post: post._id,
          });
          return {
            ...post,
            commentCount,
            likeCount: post.likes.length,
          };
        })
      );

      res.json(postsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "서버 에러" });
    }
  },
};

module.exports = userController;
