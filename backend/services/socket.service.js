import { faker } from '@faker-js/faker';

import randomNumber from '../utils/randomNumber.js';
import gameConfigs from '../configs/game.config.js';

const { width, height, size, speed, tickRate, border } = gameConfigs;
const maxX = width - size;
const maxY = height - size;

const limitNumber = (num, min, max) => {
  if (num < min) return max - (Math.abs(max - num) % max);
  if (num > max) return num % max;
  return num;
};

let usernames = {};
let backEndPlayers = {};
let leaders = [];
let minLeaderScore = 0;
let leaderChanged = true;
let food = null;
let gameTickInterval;

export const middleware = (socket, next) => {
  try {
    // use token to authentication user
    // set user info to socket
    const { token, username } = socket.handshake.query;

    socket.userId = token;
    if (!username) {
      if (!usernames[token]) {
        usernames[token] = faker.internet.userName();
      }
    } else {
      usernames[token] = username;
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
        id: userId,
        username: userUsername,
        x: Math.max(0, x - (x % speed)),
        y: Math.max(0, y - (y % speed)),
        cells: [
          { x, y },
          { x: x - speed, y },
          { x: x - speed, y },
        ],
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        direction: 'right',
      };
    }

    if (!gameTickInterval && Object.keys(backEndPlayers).length) {
      gameTickInterval = setInterval(gameTick, tickRate);
    }

    emitUpdateGameState();
  });

  socket.on('disconnect', () => {
    const { userId } = socket;
    delete backEndPlayers[userId];
    emitUpdateGameState();
    if (!Object.keys(backEndPlayers).length) {
      clearInterval(gameTickInterval);
      gameTickInterval = null;
    }
  });

  socket.on('keydown', ({ keycode }) => {
    const { userId } = socket;
    const player = backEndPlayers[userId];
    if (!player) return;
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

  socket.on('getLeaders', () => {
    _io.emit('updateLeaders', { leaders });
  });
};

const emitUpdateGameState = () =>
  _io.emit('updatePlayers', {
    backEndPlayers,
    food,
    leaders,
    leaderChanged,
    time: Date.now(),
  });

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
      x: Math.max(0, x - (x % speed)),
      y: Math.max(0, y - (y % speed)),
    };
  }

  for (const id in backEndPlayers) {
    const player = backEndPlayers[id];
    switch (player.direction) {
      case 'up':
        // player.y -= speed
        player.y = border
          ? player.y - speed
          : limitNumber(player.y - speed, 0, maxY);
        break;
      case 'down':
        // player.y += speed
        player.y = border
          ? player.y + speed
          : limitNumber(player.y + speed, 0, maxY);
        break;
      case 'left':
        // player.x -= speed;
        player.x = border
          ? player.x - speed
          : limitNumber(player.x - speed, 0, maxX);
        break;
      case 'right':
        // player.x += speed;
        player.x = border
          ? player.x + speed
          : limitNumber(player.x + speed, 0, maxX);
        break;
    }

    // with border
    if (border) {
      if (player.x < 0 || player.x > maxX || player.y < 0 || player.y > maxY) {
        delete backEndPlayers[id];
        _io.emit('dead', { userId: id });
        continue;
      }
    }

    player.cells.unshift({ x: player.x, y: player.y });

    // check if player can eat food
    if (collideWithFood(player)) {
      food = null;
      _io.emit('grow', { userId: id });
      const score = player.cells.length - 3;
      if (score > minLeaderScore) {
        // update leaderboard
        leaderChanged = true;
        if (leaders.length > 3) {
          minLeaderScore = score;
        }
        const record = leaders.find((item) => item.id === id);
        if (record) {
          if (record.score < score) {
            record.score = score;
          }
        } else {
          if (leaders.length >= 3) {
            leaders.pop();
          }
          leaders.push({ id, username: player.username, score });
        }
      }
    } else {
      player.cells.pop();
    }
  }

  emitUpdateGameState();
};
