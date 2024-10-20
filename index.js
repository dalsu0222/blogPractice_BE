require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

// 라우터 불러오기
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = process.env.PORT || 8000;

// MongoDB 연결
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB 연결 성공"))
  .catch((err) => {
    console.error("MongoDB 연결 실패:", err);
    process.exit(1); // 연결 실패시 프로세스 종료
  });

// MongoDB 연결 에러 핸들링
mongoose.connection.on("error", (err) => {
  console.error("MongoDB 연결 에러:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB 연결이 끊어졌습니다. 재연결을 시도합니다.");
  mongoose.connect(process.env.MONGO_URL, mongooseOptions);
});

// 기본 미들웨어 설정
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      "http://3.38.183.123:8000",
      "http://ec2-3-38-183-123.ap-northeast-2.compute.amazonaws.com",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// 추가 헤더 설정
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.json());
app.use(cookieParser());

// 정적 파일 제공 설정
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// uploads 폴더가 없으면 생성
const fs = require("fs");
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// 에러 핸들링 미들웨어
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "서버 에러가 발생했습니다.",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
};

// 라우트 설정
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);
app.use("/users", userRoutes);

// 존재하지 않는 라우트에 대한 처리
app.use("*", (req, res) => {
  res.status(404).json({ message: "요청하신 페이지를 찾을 수 없습니다." });
});

// 에러 핸들링 미들웨어 적용
app.use(errorHandler);

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 ${port}번 포트에서 실행 중입니다...`);
  console.log(`CORS origin: ${process.env.CORS_ORIGIN}`);
});

// 프로세스 에러 처리
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // 심각한 에러 발생 시 서버 종료
  // process.exit(1);
});

module.exports = app;
