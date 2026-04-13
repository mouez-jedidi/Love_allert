const users = {}; // { userId: socketId }

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    socket.on('join', (userId) => {
      users[userId] = socket.id;
      socket.userId = userId;
      console.log(`👤 User ${userId} joined`);
    });

    socket.on('sendMessage', ({ matchId, senderId, text }) => {
      io.to(matchId).emit('receiveMessage', {
        senderId, text,
        time: new Date().toISOString(),
      });
    });

    socket.on('joinRoom', (matchId) => {
      socket.join(matchId);
      console.log(`💬 Joined room: ${matchId}`);
    });

    socket.on('typing', ({ matchId, userId }) => {
      socket.to(matchId).emit('userTyping', { userId });
    });

    socket.on('stopTyping', ({ matchId }) => {
      socket.to(matchId).emit('userStopTyping');
    });

    socket.on('disconnect', () => {
      if (socket.userId) delete users[socket.userId];
      console.log('❌ User disconnected:', socket.id);
    });
  });
};

// Export helper to emit to a specific user
module.exports.emitToUser = (io, userId, event, data) => {
  const socketId = users[userId];
  console.log(`🔔 emitToUser: userId=${userId}, socketId=${socketId}`);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};