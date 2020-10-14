const Condition = require("../models/condition");
const CustomError = require("../util/custom-error");

async function add(data) {
  if (await Condition.findOne({ name: data.name })) {
    throw new CustomError("possible duplicate");
  }
  return await Condition.create(data);
}

async function get() {
  return await Condition.find();
}

async function findById(_id) {
  return await Condition.findById(_id);
}

module.exports = {
  add,
  get,
  findById,
};