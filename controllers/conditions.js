const fs = require("fs");
const path = require("path");

const Comment = require("../models/comment");
const throwError = require("./helpers/throw-error");
const ThreadController = require("./threads");
const {
  PROFILE_PICTURE_FORMATS,
  ALLOWED_VIDEO_FILE_TYPES,
} = require("../util/constants");
const dbClient = require("../db/db-sql");

// Helper to check entity existence
async function checkIfExists(name) {
  const queryOpt = {
    name: "check-if-exits",
    text: "SELECT * FROM conditions WHERE name=$1 LIMIT 1",
    values: [name],
  };

  const res = await dbClient.query(queryOpt);
  if (res.rows.length) {
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

  let queryOpt = {
    name: "create-condition",
    text:
      "INSERT INTO conditions (name, description, symptoms, remedies, disabled, created_at) " +
      "VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
    values: [
      data.name,
      data.description,
      data.symptoms,
      data.remedies,
      false,
      new Date(),
    ],
  };

  const { rows } = await dbClient.query(queryOpt);
  let newCondition = rows[0];

  if (data.file) {
    const [extension, mediaType] = extDetail;
    const media = `${newCondition.id}.${extension}`;
    await new Promise((resolve, reject) => {
      fs.writeFile(getFilePath(media), data.file.buffer, async (err) => {
        if (err) {
          reject(err);
        }

        queryOpt = {
          name: "update-condition-media",
          text:
            "UPDATE conditions SET media_kind=$1, media_file=$2 WHERE id=$3",
          values: [mediaType, media, newCondition.id],
        };
        await dbClient.query(queryOpt);
        resolve();
      });
    });
  }

  queryOpt = {
    name: "find-condition-by-id",
    text: "SELECT * FROM conditions WHERE id=$1 LIMIT 1",
    values: [newCondition.id],
  };
  const res = await dbClient.query(queryOpt);
  newCondition = res.rows[0];

  return newCondition;
}

async function find({ search, includeDisabled = false }) {
  let hasWhere = false;
  let queryText = "SELECT * FROM conditions ",
    values = [];

  if (search) {
    queryText += "WHERE name LIKE $1";
    values.push(`%${search}%`);
    hasWhere = true;
  }

  if (!includeDisabled) {
    queryText += ` ${hasWhere ? "AND" : "WHERE"}` + " disabled=false";
  }

  const res = await dbClient.query(queryText, values);
  return res.rows;
}

async function findById(id) {
  const queryOpt = {
    name: "find-condition-by-id",
    text: "SELECT * FROM conditions WHERE id=$1 LIMIT 1",
    values: [id],
  };
  const res = await dbClient.query(queryOpt);
  return res.rows[0];
}

// TODO check owner
async function updateCondition(id, data) {
  const condition = await findById(id);

  !condition && throwError("No matching condition found.");

  data.name && (await checkIfExists(data.name));

  const name = data.name || condition.name;
  const description = data.description || condition.description;
  const symptoms = data.symptoms || condition.symptoms;
  const remedies = data.remedies || condition.remedies;
  const disabled = data.disabled || condition.disabled;
  let queryOpt = {
    name: "update-condition-details",
    text:
      "UPDATE conditions SET name=$1, description=$2, symptoms=$3, remedies=$4, " +
      "disabled=$5 WHERE id=$6",
    values: [name, description, symptoms, remedies, disabled, condition.id],
  };
  await dbClient.query(queryOpt);

  return findById(condition.id);
}

async function getPostComments(condition) {
  return await Comment.find({
    condition,
  })
    .sort({ createdAt: "asc" })
    .populate("user", "fullName _id");
}

async function addPostComment(condition, data) {
  if (await findById(condition)) {
    return await Comment.create({
      condition,
      ...data,
    });
  }
}

async function deleteComment(_id) {
  return await Comment.deleteMany({
    _id,
  });
}

module.exports = {
  create,
  find,
  findById,
  updateCondition,
  addPostComment,
  deleteComment,
  getPostComments,
};
