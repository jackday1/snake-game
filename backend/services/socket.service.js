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
    const x = randomNumber(0, maxX);
    const y = randomNumber(0, maxY);
    backEndPlayers[userId] = {
      x: Math.max(0, x - (x % speed)),
      y: Math.max(0, y - (y % speed)),
      cells: [
        { x, y },
        { x: x - 1, y },
        { x: x - 2, y },
      ],
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      direction: 'right',
    };
  }

  _io.emit('updatePlayers', { backEndPlayers, food });

  socket.on('disconnect', () => {
    delete backEndPlayers[userId];
  });

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    const player = backEndPlayers[userId];
    player.sequenceNumber = sequenceNumber;
    switch (keycode) {
      case 'KeyW':
        // backEndPlayers[userId].y -= speed;
        if (player.direction !== 'down') {
          player.direction = 'up';
        }
        break;

      case 'KeyA':
        // backEndPlayers[userId].x -= speed;
        if (player.direction !== 'right') {
          player.direction = 'left';
        }
        break;

      case 'KeyS':
        // backEndPlayers[userId].y += speed;
        if (player.direction !== 'up') {
          player.direction = 'down';
        }
        break;

      case 'KeyD':
        // backEndPlayers[userId].x += speed;
        if (player.direction !== 'left') {
          player.direction = 'right';
        }
        break;
    }
  });
};

const backEndPlayers = {};
let food = null;

const collideWithFood = (player) => {
  return player.x === food?.x && player.y === food?.y;
};

const gameTick = () => {
  // implement logic check game over
  const isGameOver = false;
  if (isGameOver) {
    clearInterval(gameTickInterval);
    return;
  }

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
    player.cells.unshift({ x: player.x, y: player.y });
    player.cells.pop();

    // check if player can eat food
    if (collideWithFood(player)) {
      _io.emit('grow', { userId: id, food });
      player.cells.unshift({ x: food.x, y: food.y });
      food = null;
    }
  }

  _io.emit('updatePlayers', { backEndPlayers, food });
};

const gameTickInterval = setInterval(gameTick, tickRate);
// we got 3 types of realtime games
// turn based: chess, monopoly,...
// game state changes when user interacts: racing,...
// game state changes without user interactions: snake
// snake game is a game requires movements without user interaction
