// mongodb에 저장할 데이터 형식을 정의하는 부분
// https://mongoosejs.com/ 참고

const mongoose = require("mongoose");
const { Schema, model } = mongoose; // mongoose에서 Schema, model 가져오기

// Schema는 데이터의 형식을 정의하는 부분
const PostSchema = new Schema({
  title: { type: String, required: true }, // title은 String이고, 필수로 입력해야 함
  summary: String,
  content: String,
  cover: String,
  author: String,

  like: [{ type: Schema.Types.ObjectId, ref: "User" }], // 좋아요를 누른 사람들의 ObjectId를 저장

  createdAt: { type: Date, default: Date.now }, // createdAt은 Date이고, 기본값은 현재 시간이다.
  updatedAt: { type: Date, default: Date.now }, // updatedAt은 Date이고, 기본값은 현재 시간이다.
});

PostSchema.pre("save", function (next) {
  // 문서가 데이터베이스에 저장되기 전에 실행되는 훅(hook)을 정의, 미들웨어 함수
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() + 9); // KST is UTC +9

  this.updatedAt = currentDate;

  if (!this.createdAt) this.createdAt = currentDate;

  next();
});

const PostModal = model("Post", PostSchema); // UserModal이라는 이름으로 UserSchema를 model로 만들기
module.exports = PostModal;
//index.js에서 User.js를 import해서 사용할 수 있도록 module.exports로 내보내기
