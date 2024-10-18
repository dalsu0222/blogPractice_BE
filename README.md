## MVC 패턴 적용
#### 폴더구조
```
BE/
├── modules/           # MongoDB 스키마
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
├── controllers/       # 비즈니스 로직
│   ├── authController.js
│   ├── postController.js
│   ├── commentController.js
│   └── userController.js
├── routes/           # 라우트 정의
│   ├── authRoutes.js
│   ├── postRoutes.js
│   ├── commentRoutes.js
│   └── userRoutes.js
├── middleware/       # 미들웨어
│   ├── auth.js
│   └── upload.js
├── utils/           # 유틸리티 함수
│   └── fileHandler.js
├── uploads/         # 업로드 파일 저장
├── .env             # 환경 변수
└── index.js         # 앱 진입점
```
