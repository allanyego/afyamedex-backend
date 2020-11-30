const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

module.exports = (middlewareType, fileName) => upload[middlewareType](fileName);
