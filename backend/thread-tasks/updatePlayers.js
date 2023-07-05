import { workerData, parentPort } from 'worker_threads';

import randomNumber from '../utils/randomNumber.js';
import gameConfigs from '../configs/game.config.js';

const { width, height, size, speed } = gameConfigs;
const maxX = width - size;
const maxY = height - size;

// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
const { backEndPlayers: initBackEndPlayers, food: initFood } = workerData;

const deadIds = [];
const growIds = [];

let food = initFood;
let backEndPlayers = initBackEndPlayers;

const collideWithFood = (player) => {
  return player.x === food?.x && player.y === food?.y;
};

// implement logic check game over
const isGameOver = false;
if (isGameOver) {
  parentPort.postMessage({ isGameOver });
} else {
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

    // with border
    if (player.x < 0 || player.x > maxX || player.y < 0 || player.y > maxY) {
      delete backEndPlayers[id];
      deadIds.push(id);
      continue;
    }

    // check if player can eat food
    if (collideWithFood(player)) {
      growIds.push(id);
      player.cells.unshift({ x: food.x, y: food.y });
      food = null;
    }
  }

  parentPort.postMessage({ backEndPlayers, food, deadIds, growIds });
}
