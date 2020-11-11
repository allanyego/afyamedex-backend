const Thread = require("../models/thread");
const Message = require("../models/message");
const CustomError = require("../util/custom-error");
const throwError = require("./helpers/throw-error");

async function addMessage(data) {
  let thread, lastMessage;

  // Client provided thread id
  if (data.thread) {
    thread = await Thread.findById(data.thread);
    if (!thread) {
      throwError("no thread by that identifier found");
    }

    lastMessage = await Message.create(data);
    if (thread.name) {
      // Is a public thread
      return lastMessage;
    }
    thread.lastMessage = lastMessage._id;

    await thread.save();
    return lastMessage;
  }

  // Check if participants already have a thread
  thread = await Thread.findOne({
    participants: {
      $all: [data.sender, data.recipient],
    },
  });

  if (thread) {
    lastMessage = await Message.create({
      ...data,
      thread: thread._id,
    });
    thread.lastMessage = lastMessage._id;
    await thread.save();
    return lastMessage;
  }

  // Completely new thread between users
  thread = await Thread.create({
    participants: [data.sender, data.recipient],
  });

  lastMessage = await Message.create({
    ...data,
    thread: thread._id,
  });

  thread.lastMessage = lastMessage._id;
  await thread.save();

  return lastMessage;
}

async function addPublicThread(data) {
  data.name = data.name.toLowerCase();
  if (await Thread.findOne({ name: data.name })) {
    throwError("thread by name exists");
  }

  return await Thread.create(data);
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
      $in: [userId],
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
    name: {
      $ne: null,
    },
  }).populate("lastMessage");
}

async function getPublicThreadMessages(thread) {
  return await Message.find({
    thread,
  }).populate("sender", pop);
}

module.exports = {
  addMessage,
  addPublicThread,
  get,
  getUserThreads,
  getUserMessages,
  getPublicThreads,
  getPublicThreadMessages,
};
