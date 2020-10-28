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
      socket
        .join(data.room)
        .to(data.room)
        .emit("user-joined", {
          userId: socket.customId,
          peer: data.peer || false,
        });

      function emitToRoom(event, room) {
        socket.to(room).emit(event, {
          userId: socket.customId,
        });
      }

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

      // Handle media track toggles
      socket.on("video-off", () => emitToRoom("video-off", data.room));
      socket.on("video-on", () => emitToRoom("video-on", data.room));
      socket.on("audio-off", () => emitToRoom("audio-off", data.room));
      socket.on("audio-on", () => emitToRoom("audio-on", data.room));
    });

    // Keep track of online users
    // socket.on("userPresence", (data) => {
    //   console.log("user joined", data);
    //   onlineUsers[socket.id] = {
    //     ...data,
    //   };

    //   socket.broadcast.emit("onlineUsers", onlineUsers);
    // });

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
