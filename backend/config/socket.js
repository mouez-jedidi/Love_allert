const users = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
      users[userId] = socket.id;
      console.log(`👤 User ${userId} joined`);
    });

    // Send message
    socket.on('sendMessage', ({ matchId, senderId, text }) => {
      io.to(matchId).emit('receiveMessage', {
        senderId, text,
        time: new Date().toISOString(),
      });
    });

    // Join chat room
    socket.on('joinRoom', (matchId) => {
      socket.join(matchId);
      console.log(`💬 Joined room: ${matchId}`);
    });

    // Typing indicator
    socket.on('typing', ({ matchId, userId }) => {
      socket.to(matchId).emit('userTyping', { userId });
    });

    socket.on('stopTyping', ({ matchId }) => {
      socket.to(matchId).emit('userStopTyping');
    });

    socket.on('disconnect', () => {
      Object.keys(users).forEach(key => {
        if (users[key] === socket.id) delete users[key];
      });
      console.log('❌ User disconnected:', socket.id);
    });
  });
};