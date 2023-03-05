const express = require('express');
const path = require('path');
const { Server } = require('socket.io');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const io = new Server(server);

// signaling
io.on('connection', socket => {
  console.log('a user connected');

  socket.on('start', roomName => {
    const room = io.sockets.adapter.rooms.get(roomName);
    const usersCount = room ? room.size : 0;

    console.log(`${roomName} has ${usersCount} users connected`);

    // room is full (2 users max)
    if (usersCount > 1) {
      return socket.emit('full', roomName);
    }

    socket.join(roomName);
    socket.emit(usersCount === 0 ? 'created' : 'joined', roomName);
  });

  socket.on('ready', room => {
    socket.broadcast.to(room).emit('ready'); // broadcast every socket in the room except the sender.
  });

  socket.on('candidate', event => {
    socket.broadcast.to(event.room).emit('candidate', event.candidate);
  });

  socket.on('offer', event => {
    socket.broadcast.to(event.room).emit('offer', event.sdp);
  });

  socket.on('answer', event => {
    socket.broadcast.to(event.room).emit('answer', event.sdp);
  });
});
