export const middleware = (socket, next) => {
  try {
    console.log(socket.handshake.auth);
    // socket.uid =
    next();
  } catch (err) {
    next(new Error(err.message));
  }
};

export const connection = (socket) => {
  console.log(`user connected, id: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`user disconnected, id: ${socket.id}`);
  });

  socket.on('keydown', (key) => {
    console.log(`Keydown event: ${key}`);
    _io.emit('keydown', key);
  });
};
