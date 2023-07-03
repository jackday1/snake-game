import { getUserFromToken } from './auth.service.js';
import * as services from './game.service.js';

export const middleware = (socket, next) => {
  try {
    const { token } = socket.handshake.query;
    const user = getUserFromToken(token);
    socket.userId = user.id;
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

  socket.on('create-game', async () => {
    try {
      if (!socket.userId) return;
      await services.create();
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('start-game', async (data) => {
    try {
      if (!socket.userId) return;
      data.userId = socket.userId;
      // socket.join(data.gameId); // implement later
      await services.startGame(data);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('change-direction', async (data) => {
    try {
      if (!socket.userId) return;
      data.userId = socket.userId;
      await services.changeDirection(data);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('eat', async (data) => {
    console.log('eat', data);
    try {
      if (!socket.userId) return;
      data.userId = socket.userId;
      await services.eat(data);
    } catch (err) {
      console.error(err);
    }
  });
};
