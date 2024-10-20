// controllers/authController.js
const User = require("../modules/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const saltRounds = 10;

const authController = {
  async register(req, res) {
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
        field: "username",
      });
    }
  },

  async login(req, res) {
    const { username, password } = req.body;
    try {
      const userDoc = await User.findOne({ username });

      if (!userDoc) {
        return res.status(404).json({ message: "존재하지 않는 사용자입니다" });
      }

      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
          if (err) throw err;

          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // production에서만 true
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000, // 24시간
          };

          console.log("Environment:", process.env.NODE_ENV);
          console.log("Cookie options:", cookieOptions);
          console.log("Request origin:", req.headers.origin);

          res.cookie("token", token, cookieOptions).json({
            id: userDoc._id,
            username,
          });

          // 개발 환경에서의 디버깅을 위한 로그
          console.log(
            "Login successful - Cookie set with options:",
            cookieOptions
          );
          console.log("Token:", token);
        });
      } else {
        res.status(400).json({ message: "비밀번호가 틀렸습니다" });
      }
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "서버 오류가 발생했습니다" });
    }
  },

  async profile(req, res) {
    const { token } = req.cookies;

    // 디버깅을 위한 로그
    console.log("Cookies in profile:", req.cookies);
    console.log("Headers in profile:", req.headers);

    if (!token) {
      return res.status(401).json("로그인이 필요합니다. 토큰이 없습니다.");
    }
    try {
      jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
      });
    } catch (err) {
      console.error("Token verification error:", err);
      return res.status(401).json("유효하지 않은 토큰입니다");
    }
  },

  logout(req, res) {
    res
      .cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        expires: new Date(0),
      })
      .json("로그아웃 되었습니다.");
  },
};

module.exports = authController;
