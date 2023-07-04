import crypto from 'crypto';

import db from '../db.js';
import { Directions, GameStatuses } from '../utils/constants.js';
import randomNumber from '../utils/randomNumber.js';
import gameConfigs from '../configs/game.config.js';

const { width, height, size, speed } = gameConfigs;

const maxX = width / size - 1;
const maxY = height / size - 1;

export const get = async () => {
  await db.read();
  const { games } = db.data;
  return games;
};

export const create = async () => {
  await db.read();
  const { games } = db.data;
  const now = Date.now();

  const game = {
    id: crypto.randomUUID(),
    snakes: [],
    foods: [],
    createdAt: now,
    status: GameStatuses.Pending,
  };
  games.push(game);

  await db.write();

  // emit socket event
  _io.emit('game-created', { game });
};

export const startGame = async (data) => {
  const { userId, gameId } = data;

  await db.read();
  const { games } = db.data;
  const now = Date.now();

  const game = games.find((item) => item.id === gameId);
  if (!game) throw new Error('Bad request');
  if (game.status !== GameStatuses.Pending) {
    _io.emit('game-started', {
      game: {
        ...game,
        snake: game.snakes.find((item) => item.userId === userId),
      },
    });
    return;
  }

  const snake = {
    userId,
    direction: Directions.Right,
    head: { x: 0, y: 0 },
    length: 1,
    startDirectionTime: now,
    createdAt: now,
  };

  const food = {
    id: crypto.randomUUID(),
    x: randomNumber(0, maxX),
    y: randomNumber(0, maxY),
    createdAt: now,
  };

  game.snakes.push(snake);
  game.foods.push(food);
  game.status = GameStatuses.Playing;

  await db.write();

  _io.emit('game-started', {
    game: {
      ...game,
      snake: game.snakes.find((item) => item.userId === userId),
    },
  });
};

export const changeDirection = async (data) => {
  const now = Date.now();
  const { userId, gameId, direction, timestamp, position } = data;
  console.log('change direction', {
    ...data,
    now,
  });

  if (timestamp > now) throw new Error('Bad request');
  if (!Object.values(Directions).includes(direction))
    throw new Error('Bad request');

  await db.read();
  const { games } = db.data;

  const game = games.find((item) => item.id === gameId);
  if (!game) throw new Error('Bad request');

  const { snakes } = game;
  const snake = snakes.find((item) => item.userId === userId);
  if (!snake) throw new Error('Bad credential');

  const { direction: oldDirection, startDirectionTime, head } = snake;
  if (timestamp < startDirectionTime) return;

  // if (snake.direction !== direction) {
  let distance = Math.floor((now - startDirectionTime) / 1000) * speed;
  const newHead = JSON.parse(JSON.stringify(head));
  switch (oldDirection) {
    case Directions.Up:
      distance = distance % maxY;
      newHead.y += distance;
      newHead.y = newHead.y % maxY;
      break;
    case Directions.Down:
      distance = distance % maxY;
      newHead.y -= distance;
      while (newHead.y < 0) {
        newHead.y += maxY;
      }
      newHead.y = newHead.y % maxY;
      break;
    case Directions.Right:
      distance = distance % maxX;
      newHead.x += distance;
      newHead.x = newHead.x % maxX;
      break;
    case Directions.Left:
      distance = distance % maxX;
      newHead.x -= distance;
      while (newHead.x < 0) {
        newHead.x += maxX;
      }
      newHead.x = newHead.x % maxX;
      break;
  }

  // implement logic validate later
  // console.log({
  //   direction,
  //   newHead,
  //   position,
  //   head,
  //   1: [Directions.Down, Directions.Up].includes(direction)
  //     ? newHead.y - position.y
  //     : newHead.x - position.x,
  //   2: [Directions.Down, Directions.Up].includes(direction)
  //     ? position.y - head.y
  //     : position.x - head.x,
  // });

  // const valid = [Directions.Down, Directions.Up].includes(direction)
  //   ? (newHead.y - position.y) * (position.y - head.y) >= 0
  //   : (newHead.x - position.x) * (position.x - head.x) >= 0;

  // if (!valid) throw new Error('Bad request');

  snake.direction = direction;
  snake.startDirectionTime = timestamp;
  snake.head = position;
  await db.write();
  // }

  // _io.emit('direction-changed', { gameId, snake });
};

export const eat = async (data) => {
  const { userId, gameId, foodId, timestamp } = data;
  const now = Date.now();
  if (timestamp > now) throw new Error('Bad request');

  await db.read();
  const { games } = db.data;

  const game = games.find((item) => item.id === gameId);
  if (!game) throw new Error('Bad request');

  const { snakes, foods } = game;
  const snake = snakes.find((item) => item.userId === userId);
  if (!snake) throw new Error('Bad credential');

  const food = foods.find((item) => item.id === foodId);
  if (!food) {
    _io.emit('ate', { gameId, snake, newFood: foods[0] });
    return;
  }

  // implement logic validate later
  // const { head, direction, startDirectionTime } = snake;

  // const correctDirection =
  //   (head.x === food.x && head.y <= food.y && direction === Directions.Down) ||
  //   (head.x === food.x && head.y >= food.y && direction === Directions.Up) ||
  //   (head.y === food.y && head.x <= food.x && direction === Directions.Right) ||
  //   (head.y === food.y && head.x >= food.x && direction === Directions.Up);

  // if (!correctDirection) throw new Error('Bad request');

  // const distance =
  //   head.x === food.x ? Math.abs(head.y - food.y) : Math.abs(head.x - food.x);
  // const timeDistance = Math.floor((now - startDirectionTime) / 1000);
  // const canEat = timeDistance * speed >= distance;
  // if (!canEat) throw new Error('Bad request');

  // update snake
  snake.length += 1;

  // remove food
  game.foods = game.foods.filter((item) => item.id !== foodId);

  // generate new food
  const newFood = {
    id: crypto.randomUUID(),
    x: randomNumber(0, maxX),
    y: randomNumber(0, maxY),
    createdAt: now,
  };

  game.foods.push(newFood);

  await db.write();

  // emit socket event
  _io.emit('ate', { gameId, snake, newFood });
};

export const join = async (data) => {
  const { userId, gameId } = data;

  await db.read();
  const { games } = db.data;
  const now = Date.now();

  const game = games.find((item) => item.id === gameId);
  if (!game) throw new Error('Bad request');

  const x = randomNumber(0, maxX);
  const y = randomNumber(0, maxY);
  const snake = {
    userId,
    direction: Directions.Right,
    head: { x: x + 6, y: y + 4 },
    length: 3,
    startDirectionTime: now,
    createdAt: now,
  };

  game.snakes.push(snake);
  await db.write();

  // emit socket event
};
