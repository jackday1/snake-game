import { faker } from '@faker-js/faker';

import randomNumber from '../utils/randomNumber.js';
import gameConfigs from '../configs/game.config.js';

const { width, height, size, speed, tickRate } = gameConfigs;
const maxX = width - size;
const maxY = height - size;

let usernames = {};
let backEndPlayers = {};
let food = null;
let gameTickInterval;

export const middleware = (socket, next) => {
  try {
    // use token to authentication user
    // set user info to socket
    const { token } = socket.handshake.query;

    socket.userId = token;
    if (!usernames[token]) {
      usernames[token] = faker.internet.userName();
    }
    socket.userUsername = usernames[token];
    next();
  } catch (err) {
    next(new Error(err.message));
  }
};

export const connection = (socket) => {
  console.log(`user connected, id: ${socket.id}`);

  socket.on('join', () => {
    const { userId, userUsername } = socket;
    if (!backEndPlayers[userId]) {
      const x = randomNumber(0, Math.round(maxX / 2));
      const y = randomNumber(0, maxY);
      backEndPlayers[userId] = {
        username: userUsername,
        x: Math.max(0, x - (x % speed)),
        y: Math.max(0, y - (y % speed)),
        cells: [
          { x, y },
          { x: x - speed, y },
          { x: x - speed, y },
        ],
        color: `hsl(${360 * Math.random()}, 100%, 50%)`,
        sequenceNumber: 0,
        direction: 'right',
      };
    }

    // new logic
    if (!gameTickInterval && Object.keys(backEndPlayers).length) {
      gameTickInterval = setInterval(gameTick, tickRate);
    }

    _io.emit('updatePlayers', { backEndPlayers, food });
  });

  socket.on('disconnect', () => {
    const { userId } = socket;
    delete backEndPlayers[userId];
    if (!Object.keys(backEndPlayers).length) {
      clearInterval(gameTickInterval);
      gameTickInterval = null;
    }
  });

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    const { userId } = socket;
    const player = backEndPlayers[userId];
    if (!player) return;
    player.sequenceNumber = sequenceNumber;
    switch (keycode) {
      case 'KeyW':
        // backEndPlayers[userId].y -= speed;
        if (!['up', 'down'].includes(player.direction)) {
          player.direction = 'up';
        }
        break;

      case 'KeyA':
        // backEndPlayers[userId].x -= speed;
        if (!['right', 'left'].includes(player.direction)) {
          player.direction = 'left';
        }
        break;

      case 'KeyS':
        // backEndPlayers[userId].y += speed;
        if (!['up', 'down'].includes(player.direction)) {
          player.direction = 'down';
        }
        break;

      case 'KeyD':
        // backEndPlayers[userId].x += speed;
        if (!['right', 'left'].includes(player.direction)) {
          player.direction = 'right';
        }
        break;
    }
  });
};

const collideWithFood = (player) => {
  return player.x === food?.x && player.y === food?.y;
};

const gameTick = () => {
  // implement logic check game over
  const isGameOver = false;
  if (isGameOver) {
    clearInterval(gameTickInterval);
    gameTickInterval = null;
    return;
  }

  if (!Object.keys(backEndPlayers).length) return;

  // check food
  if (!food) {
    const x = randomNumber(0, maxX);
    const y = randomNumber(0, maxY);
    food = {
      x: Math.max(0, x - (x % 20)),
      y: Math.max(0, y - (y % 20)),
    };
  }

  for (const id in backEndPlayers) {
    const player = backEndPlayers[id];
    switch (player.direction) {
      case 'up':
        player.y -= speed;
        break;
      case 'down':
        player.y += speed;
        break;
      case 'left':
        player.x -= speed;
        break;
      case 'right':
        player.x += speed;
        break;
    }

    // with border
    if (player.x < 0 || player.x > maxX || player.y < 0 || player.y > maxY) {
      delete backEndPlayers[id];
      _io.emit('dead', { userId: id });
      continue;
    }

    player.cells.unshift({ x: player.x, y: player.y });

    // check if player can eat food
    if (collideWithFood(player)) {
      food = null;
    } else {
      player.cells.pop();
    }
  }

  _io.emit('updatePlayers', { backEndPlayers, food });
};
