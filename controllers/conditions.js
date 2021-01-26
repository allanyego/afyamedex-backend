const fs = require("fs");
const path = require("path");

const Condition = require("../models/condition");
const throwError = require("./helpers/throw-error");
const ThreadController = require("./threads");
const {
  PROFILE_PICTURE_FORMATS,
  ALLOWED_VIDEO_FILE_TYPES,
} = require("../util/constants");

// Helper to check entity existence
async function checkIfExists(name) {
  if (await Condition.findOne({ name })) {
    throwError("A condition by that name already exists.");
  }
}

// Helper to check mime type
function checkExtension(file) {
  const ext = file.originalname.split(".").pop();
  if (PROFILE_PICTURE_FORMATS.includes(file.mimetype)) {
    return [ext, "image"];
  } else if (ALLOWED_VIDEO_FILE_TYPES.includes(file.mimetype)) {
    return [ext, "video"];
  }

  return false;
}

// Helper to build up file location path
function getFilePath(fileName) {
  return path.join(__dirname, "..", "uploads", "condition-files", fileName);
}

async function create(data) {
  data.name = data.name.toLowerCase();
  await checkIfExists(data.name);
  let extDetail;

  if (data.file) {
    extDetail = checkExtension(data.file);
    if (!extDetail) {
      throwError(
        "file format should be one of: " +
          PROFILE_PICTURE_FORMATS.join(", ") +
          ", ",
        ALLOWED_VIDEO_FILE_TYPES.join(", ")
      );
    }
  }

  // If client wants to create a thread along with
  // condition
  data.startThread &&
    ThreadController.addPublicThread(data)
      .then(() => {
        console.log("thread created successfully");
      })
      .catch((err) => {
        console.log("could not create thread", err);
      });

  const newCondition = await Condition.create(data);
  if (data.file) {
    const [extension, mediaType] = extDetail;
    const media = `${newCondition._id}.${extension}`;
    await new Promise((resolve, reject) => {
      fs.writeFile(getFilePath(media), data.file.buffer, async (err) => {
        if (err) {
          reject(err);
        }

        await newCondition.updateOne({
          media: {
            kind: mediaType,
            file: media,
          },
        });
        resolve();
      });
    });
  }

  return newCondition;
}

async function find({ search, includeDisabled = false }) {
  let opts = {};
  if (search) {
    opts.name = {
      $regex: search,
    };
  }

  if (!includeDisabled) {
    opts.disabled = false;
  }

  return await Condition.find(opts);
}

async function findById(_id) {
  return await Condition.findById(_id);
}

// TODO check owner
async function updateCondition(id, data) {
  const condition = await Condition.findById(id);

  !condition && throwError("No matching condition found.");

  data.name && (await checkIfExists(data.name));

  await condition.updateOne(data);
  return condition;
}

module.exports = {
  create,
  find,
  findById,
  updateCondition,
};
