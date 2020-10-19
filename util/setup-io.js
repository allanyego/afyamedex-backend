const onlineUsers = {};

/**
 * Setup events and callbacks for the application's socket.io
 * functionality.
 * @param {SocketIOServer} io
 */
function setupIO(io) {
  // Listen for new connections
  io.on("connection", (socket) => {
    // Subscribe socket to channel
    socket.customId = socket.handshake.query.userId;
    onlineUsers[socket.id] = socket.customId;
    // Let other users know your online
    socket.broadcast.emit("connected", {
      user: socket.customId,
    });

    // Join a socket to a room
    socket.on("join", (data) => {
      console.log("User subscribing to", data);

      socket
        .join(data.room)
        .to(data.room)
        .emit("user-joined", {
          userId: socket.customId,
          peer: data.peer || false,
        });
    });

    // Keep track of online users
    // socket.on("userPresence", (data) => {
    //   console.log("user joined", data);
    //   onlineUsers[socket.id] = {
    //     ...data,
    //   };

    //   socket.broadcast.emit("onlineUsers", onlineUsers);
    // });

    // Pass messages
    socket.on("new-message", (data) => {
      socket.to(data.room).emit("new-message", {
        message: data.message,
      });
    });

    // When a user leaves the room for whatever reason
    socket.on("left-room", ({ room, peer }) => {
      socket.leave(room, () => {
        io.to(room).emit("left-room", {
          userId: socket.customId,
          peer: peer || false,
        });
      });
    });

    // Socket disconnected
    socket.on("disconnect", () => {
      socket.broadcast.emit("disconnected", {
        userId: socket.customId,
      });

      onlineUsers[socket.id] = null;
      socket.broadcast.emit("onlineUsers", onlineUsers);
    });
  });
}

module.exports = setupIO;
