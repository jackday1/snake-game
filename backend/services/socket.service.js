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
      x,
      y,
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

const updatePlayerPositions = () => {
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
  }
};

const collideWithFood = (player) => {
  const border = {
    top: food.y,
    bottom: food.y + size,
    left: food.x,
    right: food.x + size,
  };

  const corners = [
    { x: player.x, y: player.y },
    { x: player.x + size, y: player.y },
    { x: player.x, y: player.y + size },
    { x: player.x + size, y: player.y + size },
  ];

  return corners.some(
    (item) =>
      border.top <= item.y &&
      item.y <= border.bottom &&
      border.left <= item.x &&
      item.x <= border.right
  );
};

const checkFood = () => {
  if (food) return;
  food = {
    x: randomNumber(0, maxX),
    y: randomNumber(0, maxY),
  };
};

const checkPlayerFood = () => {
  if (!food) return;
  for (const id in backEndPlayers) {
    const player = backEndPlayers[id];
    if (collideWithFood(player)) {
      food = null;
    }
  }
};

const isGameOver = () => {
  // implement logic game over
  return false;
};

const checkGameOver = () => {
  if (isGameOver()) {
    clearInterval(gameTickInterval);
  }
};

const gameTick = () => {
  checkGameOver();
  updatePlayerPositions();
  checkPlayerFood();
  checkFood();
  _io.emit('updatePlayers', { backEndPlayers, food });
};

const gameTickInterval = setInterval(gameTick, tickRate);
// we got 3 types of realtime games
// turn based: chess, monopoly,...
// game state changes when user interacts: racing,...
// game state changes without user interactions: snake
// snake game is a game requires movements without user interaction
