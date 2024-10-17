// mongodb에 저장할 데이터 형식을 정의하는 부분
// https://mongoosejs.com/ 참고

const mongoose = require("mongoose");
const { Schema, model } = mongoose; // mongoose에서 Schema, model 가져오기

// Schema는 데이터의 형식을 정의하는 부분
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true }, // username은 String이고, 필수로 입력해야 하며, 최소 4글자 이상이어야 함, 중복되면 안됨
  password: { type: String, required: true },
  userImage: { type: String, default: "" }, // userImage는 String이고, 기본값은 ""이다.
  createdAt: { type: Date, default: Date.now }, // createdAt은 Date이고, 기본값은 현재 시간이다.
  updatedAt: { type: Date, default: Date.now }, // updatedAt은 Date이고, 기본값은 현재 시간이다.
}); // timestamp는 UTC시간으로 저장되므로, 쓴다면 한국 시간으로 변환해서 사용해야 함(+9시간)

UserSchema.pre("save", function (next) {
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() + 9); // KST is UTC +9

  this.updatedAt = currentDate;

  if (!this.createdAt) this.createdAt = currentDate;

  next();
});

const UserModal = model("User", UserSchema); // UserModal이라는 이름으로 UserSchema를 model로 만들기
module.exports = UserModal;
//index.js에서 User.js를 import해서 사용할 수 있도록 module.exports로 내보내기
