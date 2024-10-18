const fs = require("fs");
const path = require("path");

function handleFile(req) {
  if (req.file) {
    const { filename, path: filePath } = req.file;
    const newPath = filePath + path.extname(req.file.originalname);
    fs.renameSync(filePath, newPath);
    return newPath;
  }
  return null;
}

module.exports = handleFile;
