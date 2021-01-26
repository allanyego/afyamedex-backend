const fs = require("fs");
const path = require("path");

async function sendVideo(req, res, next) {
  const MAX_CHUNK_SIZE = 1024 * 1024;
  const { media } = res.locals;

  const filePath = path.join(
    __dirname,
    "..",
    "uploads",
    "condition-files",
    media.file
  );

  try {
    const stats = await new Promise((resolve, reject) => {
      fs.stat(filePath, (err, fileStats) => {
        if (err) {
          reject(err);
        }

        resolve(fileStats);
      });
    });

    const range = req.headers.range;
    if (!range) {
      // Wrong range
      return res.sendStatus(416);
    }

    const positions = range.replace(/bytes=/, "").split("-");
    const start = parseInt(positions[0], 10);
    const total = stats.size;
    let end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    let chunksize = end - start + 1;
    // Don't send more than specified size
    if (chunksize > MAX_CHUNK_SIZE) {
      end = start + MAX_CHUNK_SIZE - 1;
      chunksize = end - start + 1;
    }

    res.status(206).set({
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/webm",
    });

    const stream = fs
      .createReadStream(filePath, { start, end })
      .on("open", () => {
        stream.pipe(res);
      })
      .on("error", (err) => {
        res.end(err);
      });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.sendStatus(404);
    }

    res.end(error);
  }
}

module.exports = sendVideo;
