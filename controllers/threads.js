const Thread = require("../models/thread");
const Message = require("../models/message");
const CustomError = require("../util/custom-error");

async function add(data) {
  let thread, lastMessage;

  if (data.thread) {
    thread = await Thread.findById(thread);
    if (!thread) {
      return new CustomError("no thread by that identifier found");
    }

    lastMessage = await Message.create(data);
    thread.lastMessage = lastMessage._id;

    return await thread.save();
  }

  thread = await Thread.create({
    participants: [data.sender, data.recipient],
  });

  lastMessage = await Message.create({
    ...data,
    thread: thread._id,
  });

  thread.lastMessage = lastMessage._id;
  await thread.save();

  return thread;
}

const pop = "_id fullName";
async function get(thread, userId) {
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

module.exports = {
  add,
  get,
  getUserThreads,
  getUserMessages,
};
