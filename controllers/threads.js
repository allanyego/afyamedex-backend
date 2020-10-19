const Thread = require("../models/thread");
const Message = require("../models/message");
const CustomError = require("../util/custom-error");

async function add(data) {
  let thread, lastMessage;

  if (data.thread) {
    thread = await Thread.findById(data.thread);
    if (!thread) {
      throw new CustomError("no thread by that identifier found");
    }

    lastMessage = await Message.create(data);
    thread.lastMessage = lastMessage._id;

    await thread.save();
    return await Thread.findById(thread._id).populate("lastMessage");
  }

  thread = await Thread.create({
    participants: data.recipient ? [data.sender, data.recipient] : null,
  });

  lastMessage = await Message.create({
    ...data,
    thread: thread._id,
  });

  thread.lastMessage = lastMessage._id;
  await thread.save();

  return await Thread.findById(thread._id).populate("lastMessage");
}

const pop = "_id fullName";
async function get(thread, userId) {
  if (!userId) {
    return getPublicThreadMessages(thread);
  }

  return await Message.find({
    thread,
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .populate("sender", pop)
    .populate("recipient", pop);
}

async function getUserThreads(userId) {
  return await Thread.find({
    participants: {
      $all: [userId],
    },
  })
    .populate("lastMessage", "body createdAt")
    .populate("participants", "_id fullName");
}

async function getUserMessages(userA, userB) {
  return await Message.find({
    $or: [
      { sender: userA, recipient: userB },
      { sender: userB, recipient: userA },
    ],
  })
    .populate("sender", pop)
    .populate("recipient", pop);
}

async function getPublicThreads() {
  return await Thread.find({
    participants: {
      $eq: null,
    },
  }).populate("lastMessage");
}

async function getPublicThreadMessages(thread) {
  return await Message.find({
    thread,
  }).populate("sender", pop);
}

module.exports = {
  add,
  get,
  getUserThreads,
  getUserMessages,
  getPublicThreads,
  getPublicThreadMessages,
};
