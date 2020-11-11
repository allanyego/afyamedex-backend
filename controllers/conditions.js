const Condition = require("../models/condition");
const CustomError = require("../util/custom-error");
const throwError = require("./helpers/throw-error");
const ThreadController = require("./threads");

// Helper to check entity existence
async function checkIfExists(name) {
  if (await Condition.findOne({ name })) {
    throwError("A condition by that name already exists.");
  }
}

async function create(data) {
  data.name = data.name.toLowerCase();
  await checkIfExists(data.name);
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

  return await Condition.create(data);
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
