require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

const cors = require("cors");
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URL);
const User = require("./modules/User");
const Post = require("./modules/Post");
const Comment = require("./modules/Comment");

const bcrypt = require("bcryptjs");
const saltRounds = 10;

const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// 글쓰기 기능
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // 항상 새로운 파일명으로 생성됨
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 파일 처리 함수
function handleFile(req) {
  if (req.file) {
    const { filename, path: filePath } = req.file;
    const newPath = filePath + path.extname(req.file.originalname);
    fs.renameSync(filePath, newPath);
    return newPath;
  }
  return null;
}

// -------------------------------------------------

app.post("/register", async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, saltRounds),
    });
    res.json(userDoc);
  } catch (err) {
    res.status(409).json({
      message: "이미 존재하는 이름입니다",
      filed: "username",
      // error:e
    });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  console.log(userDoc);
  if (!userDoc) {
    res.status(404).json({ message: "존재하지 않는 사용자입니다" });
    return;
  }
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      // res.json({ token });
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json({ message: "비밀번호가 틀렸습니다" });
  }
});

// header 에서 token을 받아와서 검증하는 과정
app.get("/profile", async (req, res) => {
  const { token } = req.cookies;
  console.log("token ----", token);
  if (!token) {
    return res.status(401).json("로그인이 필요합니다");
  }
  try {
    jwt.verify(token, secret, {}, (err, info) => {
      if (err) throw err;
      res.json(info);
    });
  } catch (err) {
    return res.json("로그인이 필요합니다");
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("로그아웃 되었습니다.");
});

// 글 작성
app.post("/postWrite", upload.single("files"), async (req, res) => {
  // console.log(req.body);
  // console.log(req.file);
  // console.log(req.cookies); // 쿠키가 왜 넘어올 수 있는지? -> 쿠키는 헤더에 포함되어 있기 때문에

  // const { originalname, path } = req.file;
  // const parts = originalname.split(".");
  // const ext = parts[parts.length - 1];
  // const newPath = path + "." + ext;
  // fs.renameSync(path, newPath);

  // console.log(newPath);

  const newPath = handleFile(req); // 모듈화

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.username,
    });
    res.json(postDoc);
  });
});

// 글 목록 가져오기에서 댓글 수도 같이 가져오기
app.get("/postList", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(20);

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({
          post: post._id,
        });
        return {
          ...post.toObject(),
          commentCount,
          likeCount: post?.likes ? post?.likes.length : 0,
        };
      })
    );

    res.json(postsWithDetails);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "서버 에러" });
  }
});

// 글 상세보기
app.get("/postDetail/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id);
  res.json(postDoc);
});

// 글 삭제
app.delete("/deletePost/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findByIdAndDelete(id);
  res.json({ message: "삭제되었습니다." });
});

// 글 수정
app.put("/editPost/:id", upload.single("files"), async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  if (!token) return res.json("로그인이 필요합니다");
  const newPath = handleFile(req); // 모듈화

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
});

// 사용자 정보 가져오기
app.get("/userpage/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const userDoc = await User.findOne({ username });
    if (!userDoc) {
      return res.status(404).json({ message: "사용자정보를 찾을 수 없어요" });
    }
    res.json(userDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버에러" });
  }
});

app.put(
  "/updataUserInfo/:username",
  upload.single("userImage"),
  async (req, res) => {
    const { username } = req.params;
    const { password, newpassword } = req.body;

    try {
      const userDoc = await User.findOne({ username });
      if (!userDoc) {
        return res.status(404).json({ message: "사용자정보를 찾을 수 없어요" });
      }

      // 현재 비밀번호 확인
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (!passOk) {
        return res.status(400).json({ message: "현재 비밀번호가 맞지 않아요" });
      }

      // 업데이트할 정보 객체
      const updateData = {};

      // 새 비밀번호가 제공된 경우 업데이트
      if (newpassword) {
        updateData.password = bcrypt.hashSync(newpassword, saltRounds);
      }

      // 새 이미지가 업로드된 경우 업데이트
      if (req.file) {
        updateData.userImage = req.file.filename;
      }

      // 사용자 정보 업데이트
      await User.findByIdAndUpdate(userDoc._id, updateData);

      res.json({ message: "사용자 정보가 정상적으로 수정되었습니다" });
    } catch (error) {
      console.error("Error updating user info:", error);
      res.status(500).json({ message: "서버에러" });
    }
  }
);

// 새 댓글 작성
app.post("/comments", async (req, res) => {
  const { postId, content, author } = req.body;

  try {
    const comment = await Comment.create({
      content,
      author,
      post: postId,
    });
    res.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "서버 에러" });
  }
});

// 댓글 목록 가져오기
app.get("/comments/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId }).sort({
      createdAt: -1,
    });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "서버 에러" });
  }
});

// 댓글 수정
app.put("/comments/:commentId", async (req, res) => {
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
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "서버 에러" });
  }
});

// 댓글 삭제
app.delete("/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }
    res.json({ message: "댓글이 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러" });
  }
});

// 댓글 수 가져오기 app.get("/postList") 에서 수정
// 좋아요 토글 라우트
app.post("/like/:postId", async (req, res) => {
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
    const likeIndex = post.likes.indexOf(userIdStr);

    if (likeIndex > -1) {
      // 이미 좋아요를 눌렀다면 제거
      post.likes.splice(likeIndex, 1);
    } else {
      // 좋아요를 누르지 않았다면 추가
      post.likes.push(userIdStr);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error("토글 기능 오류:", error);
    res.status(500).json({ message: "서버 에러" });
  }
});

//사용자가 등록한 게시물 목록 가져오기
app.get("/user-posts/:username", async (req, res) => {
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
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "서버 에러" });
  }
});

app.listen(port, () => {
  console.log(`서버 돌아가는 중...`);
});
