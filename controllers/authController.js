// controllers/authController.js
const User = require('../modules/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    const userDoc = await User.findOne({ username });
    
    if (!userDoc) {
      return res.status(404).json({ message: "존재하지 않는 사용자입니다" });
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json({
          id: userDoc._id,
          username,
        });
      });
    } else {
      res.status(400).json({ message: "비밀번호가 틀렸습니다" });
    }
  },

  async profile(req, res) {
    const { token } = req.cookies;
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
  },

  logout(req, res) {
    res.cookie("token", "").json("로그아웃 되었습니다.");
  }
};

module.exports = authController;
