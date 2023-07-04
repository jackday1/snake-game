import { getUserFromToken } from './auth.service.js';
import * as services from './game.service.js';
import randomNumber from '../utils/randomNumber.js';
import gameConfigs from '../configs/game.config.js';

const { width, height, size, speed, tickRate } = gameConfigs;
const maxX = width - size;
const maxY = height - size;

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

  // new logic
  const { userId } = socket;
  if (!backEndPlayers[userId]) {
    backEndPlayers[userId] = {
      x: randomNumber(0, maxX),
      y: randomNumber(0, maxY),
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
    };
  }

  _io.emit('updatePlayers', backEndPlayers);

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    backEndPlayers[userId].sequenceNumber = sequenceNumber;
    switch (keycode) {
      case 'KeyW':
        backEndPlayers[userId].y -= speed;
        break;

      case 'KeyA':
        backEndPlayers[userId].x -= speed;
        break;

      case 'KeyS':
        backEndPlayers[userId].y += speed;
        break;

      case 'KeyD':
        backEndPlayers[userId].x += speed;
        break;
    }
  });
};

setInterval(() => _io.emit('updatePlayers', backEndPlayers), tickRate);

const backEndPlayers = {};
