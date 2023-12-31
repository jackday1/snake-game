import { faker } from '@faker-js/faker';

import randomNumber from '../utils/randomNumber.js';
import gameConfigs from '../configs/game.config.js';

const { width, height, size, speed, tickRate, border, exact, suicide } =
  gameConfigs;
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
let foods = [];
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
      const headX = Math.max(0, x - (x % speed));
      const headY = Math.max(0, y - (y % speed));
      backEndPlayers[userId] = {
        id: userId,
        username: userUsername,
        x: headX,
        y: headY,
        cells: [
          { x: headX, y: headY },
          { x: headX - speed, y: headY },
          { x: headX - speed, y: headY },
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

  socket.on('ping', () => {
    socket.emit('pong');
  });
};

const emitUpdateGameState = () =>
  _io.emit('updatePlayers', {
    backEndPlayers,
    foods,
    leaders,
    leaderChanged,
    time: Date.now(),
  });

const touch = (square, item, exactIncluded = false) => {
  const border = {
    top: square.y,
    bottom: square.y + size,
    left: square.x,
    right: square.x + size,
  };

  if (exactIncluded) {
    return (
      border.top <= item.y &&
      item.y <= border.bottom &&
      border.left <= item.x &&
      item.x <= border.right
    );
  }

  return (
    border.top < item.y &&
    item.y < border.bottom &&
    border.left < item.x &&
    item.x < border.right
  );
};

const collideWithFood = (player) => {
  const foodIndexes = [];
  if (exact) {
    foods.map((food, index) => {
      if (food.x === player.x && food.y === player.y) {
        foodIndexes.unshift(index);
      }
    });
  } else {
    foods.map((food, index) => {
      const corners = [
        { x: player.x, y: player.y },
        { x: player.x + size, y: player.y },
        { x: player.x, y: player.y + size },
        { x: player.x + size, y: player.y + size },
      ];

      const valid = corners.some((item) => touch(food, item, true));

      if (valid) {
        foodIndexes.unshift(index);
      }
    });
  }

  return foodIndexes;
};

const addCell = (player) => {
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

  player.cells.unshift({ x: player.x, y: player.y });
};

const checkBorder = (player) => {
  if (player.x < 0 || player.x > maxX || player.y < 0 || player.y > maxY) {
    return true;
  }

  return false;
};

const getCheckCoordinate = (player) => {
  const { x, y } = player;
  let checkCoordinates = [];
  switch (player.direction) {
    case 'up':
      checkCoordinates = [
        { x, y },
        { x: x + size, y },
      ];
      break;
    case 'down':
      checkCoordinates = [
        { x, y: y + size },
        { x: x + size, y: y + size },
      ];
      break;
    case 'right':
      checkCoordinates = [
        { x: x + size, y },
        { x: x + size, y: y + size },
      ];
      break;
    case 'left':
      checkCoordinates = [
        { x, y },
        { x, y: y + size },
      ];
      break;
  }

  return checkCoordinates;
};

const checkSuicide = (player) => {
  const { cells } = player;
  const checkCoordinates = getCheckCoordinate(player);
  const hitCell = cells.find((cell) => {
    return checkCoordinates.some((coordinate) => touch(cell, coordinate));
  });

  return !!hitCell;
};

const checkCollision = () => {
  Object.values(backEndPlayers).map((player) => {
    const checkCoordinates = getCheckCoordinate(player);

    for (const id in backEndPlayers) {
      const anotherPlayer = backEndPlayers[id];
      if (anotherPlayer.id === player.id) continue;
      const hitCell = anotherPlayer.cells.find((cell) =>
        checkCoordinates.some((coordinate) => touch(cell, coordinate))
      );
      if (hitCell) {
        console.log({ hitCell });
        killSnake(player);
        break;
      }
    }
  });
};

const killSnake = (player) => {
  foods.push(...player.cells.filter((_item, index) => index % 5 === 0)); // each 5 cells of dead snake --> 1 food
  delete backEndPlayers[player.id];
  _io.emit('dead', { userId: player.id });
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
  if (!foods.length) {
    const x = randomNumber(0, maxX);
    const y = randomNumber(0, maxY);
    const newFood = {
      x: Math.max(0, x - (x % speed)),
      y: Math.max(0, y - (y % speed)),
    };
    foods.push(newFood);
  }

  for (const id in backEndPlayers) {
    const player = backEndPlayers[id];
    addCell(player);

    // check suicide
    if (suicide) {
      const suicideCommitted = checkSuicide(player);
      if (suicideCommitted) {
        killSnake(player);
        continue;
      }
    }

    // check border
    if (border) {
      const hitBorder = checkBorder(player);
      if (hitBorder) {
        killSnake(player);
        continue;
      }
    }

    // check if player can eat food
    const eatenFoodIndexes = collideWithFood(player);
    if (eatenFoodIndexes.length) {
      while (eatenFoodIndexes.length) {
        foods.splice(eatenFoodIndexes.pop(), 1);
        if (eatenFoodIndexes.length > 1) addCell(player);
      }
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
            leaders.sort((item1, item2) => item2.score - item1.score);
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

  // check if snakes hit another one
  if (suicide) {
    checkCollision();
  }

  emitUpdateGameState();
};
