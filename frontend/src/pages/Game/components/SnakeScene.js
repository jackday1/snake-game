import Phaser from 'phaser';

import { Events, Directions } from '../utils/constants';
import gameConfigs from '../../../configs/game.config';
import { createSocketInstance } from '../../../services/socket.service';

const maxX = gameConfigs.width / gameConfigs.size;
const maxY = gameConfigs.height / gameConfigs.size;
class Food extends Phaser.GameObjects.Image {
  id;
  constructor(scene, x, y, size) {
    super(scene, x * size + size / 2, y * size + size / 2, 'food');
  }
}

class Snake {
  headPosition;
  body;
  head;
  alive;
  speed;
  moveTime;
  tail;
  heading;
  direction;
  startDirectionTime;
  startDirectionX;
  startDirectionY;
  constructor(
    scene,
    x,
    y,
    size,
    heading,
    direction,
    startDirectionTime,
    startDirectionX,
    startDirectionY
  ) {
    this.headPosition = new Phaser.Geom.Point(x, y);
    this.body = scene.add.group();
    this.head = this.body.create(x * size, y * size, 'body');
    this.head.setOrigin(0);
    this.alive = false;
    this.speed = 1000 / gameConfigs.speed; // default is 100 === 1s will run 10 steps
    this.moveTime = 0;
    this.tail = new Phaser.Geom.Point(x, y);
    this.heading = heading;
    this.direction = direction;
    this.startDirectionTime = startDirectionTime;
    this.startDirectionX = startDirectionX;
    this.startDirectionY = startDirectionY;
  }
}

export class SnakeScene extends Phaser.Scene {
  size = gameConfigs.size;
  cursors;
  total = 0;
  snake;
  food;
  gameId;

  constructor() {
    super({
      key: 'SnakeScene',
    });

    this.gameId = window.location.pathname.split('/').at(-1);

    this.socket = createSocketInstance();

    this.socket.on('game-started', (data) => {
      console.log('game-started', data);
      const {
        game: { snakes, foods },
      } = data;
      this.snake = new Snake(
        this,
        snakes[0].head.x - 2,
        snakes[0].head.y,
        this.size,
        snakes[0].direction,
        snakes[0].direction,
        snakes[0].startDirectionTime,
        snakes[0].head.x,
        snakes[0].head.y
      );
      this.food = new Food(this, foods[0].x, foods[0].y, this.size);
      this.food.id = foods[0].id;
      this.children.add(this.food);

      // this.reset();
      this.snake.alive = true;
      this.game.events.emit(Events.ResetScore);
      this.game.events.emit(Events.GameStart);
    });

    this.socket.on('direction-changed', (data) => {
      console.log({ data });
      const { snake } = data;
      const { direction, startDirectionTime } = snake;
      this.snake.heading = direction;
      this.snake.direction = direction;
      this.snake.startDirectionTime = startDirectionTime;
      this.snake.startDirectionX = snake.head.x;
      this.snake.startDirectionY = snake.head.y;
      console.log(snake.head.x, snake.head.y);
    });

    this.socket.on('ate', (data) => {
      const { snake, newFood } = data;
      console.log('ate', { snake, newFood });
      this.game.events.emit(Events.IncreaseScore, snake.length);
      this.food = new Food(this, newFood.x, newFood.y, this.size);
      this.food.id = newFood.id;
      this.children.add(this.food);
    });
  }

  preload() {
    this.load.image('food', '/images/heart20.png');
    this.load.image('body', '/images/square20.png');
  }

  create() {
    // this.food = new Food(this, 3, 4, this.size);
    // this.children.add(this.food);
    // this.snake = new Snake(this, 8, 8, this.size);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.snake?.alive) {
        this.socket.emit('start-game', { gameId: this.gameId });
        // this.reset();
        // this.snake.alive = true;
        // this.game.events.emit(Events.ResetScore);
        // this.game.events.emit(Events.GameStart);
      }
    });
  }

  reset() {
    this.children.removeAll();
    // this.total = 0;
    // this.food = new Food(this, 3, 4, this.size);
    // this.children.add(this.food);
    // this.snake = new Snake(this, 8, 8, this.size);
  }

  eat() {
    // this.total = this.total + 1;
    console.log('eat', this.food);
    this.socket.emit('eat', { gameId: this.gameId, foodId: this.food.id });
  }

  snakeUpdate(time) {
    if (time >= this.snake.moveTime) {
      return this.move(time);
    }
  }

  grow() {
    var newPart = this.snake.body.create(
      this.snake.tail.x,
      this.snake.tail.y,
      'body'
    );
    newPart.setOrigin(0);
  }

  collideWithFood(food) {
    if (
      food.x - this.size <= this.snake.head.x &&
      this.snake.head.x <= food.x &&
      food.y - this.size <= this.snake.head.y &&
      this.snake.head.y <= food.y
    ) {
      // this.grow();
      this.eat();
      // //  For every 5 items of food eaten we'll increase the snake speed a little
      // if (this.snake.speed > 20 && this.total % 5 === 0) {
      //   this.snake.speed -= 5;
      // }

      // this.game.events.emit(Events.IncreaseScore, this.total);
      return true;
    } else {
      return false;
    }
  }

  updateGrid(grid) {
    //  Remove all body pieces from valid positions list
    this.snake.body.children.each((segment) => {
      var bx = segment.x / this.size;
      var by = segment.y / this.size;
      grid[by][bx] = false;
    });
    return grid;
  }

  faceLeft() {
    if (
      this.snake.direction === Directions.Up ||
      this.snake.direction === Directions.Down
    ) {
      // this.snake.heading = Directions.Left;
      this.socket.emit('change-direction', {
        gameId: this.gameId,
        direction: Directions.Left,
      });
    }
  }

  faceRight() {
    if (
      this.snake.direction === Directions.Up ||
      this.snake.direction === Directions.Down
    ) {
      // this.snake.heading = Directions.Right;
      this.socket.emit('change-direction', {
        gameId: this.gameId,
        direction: Directions.Right,
      });
    }
  }

  faceUp() {
    if (
      this.snake.direction === Directions.Left ||
      this.snake.direction === Directions.Right
    ) {
      // this.snake.heading = Directions.Up;
      this.socket.emit('change-direction', {
        gameId: this.gameId,
        direction: Directions.Up,
      });
    }
  }

  faceDown() {
    if (
      this.snake.direction === Directions.Left ||
      this.snake.direction === Directions.Right
    ) {
      // this.snake.heading = Directions.Down;
      this.socket.emit('change-direction', {
        gameId: this.gameId,
        direction: Directions.Down,
      });

      console.log(this.snake.headPosition.x, this.snake.headPosition.y);
    }
  }

  move(time) {
    if (!this.snake.alive) {
      return false;
    }
    const now = Date.now();
    let distance =
      ((now - this.snake.startDirectionTime) * gameConfigs.speed) / 1000;
    distance = Math.floor(distance);
    console.log({
      distance,
      startX: this.snake.startDirectionX,
      startY: this.snake.startDirectionY,
      direction: this.snake.heading,
    });
    switch (this.snake.heading) {
      case Directions.Left:
        distance = distance % maxX;
        this.snake.headPosition.x = Phaser.Math.Wrap(
          this.snake.startDirectionX - distance,
          0,
          gameConfigs.width / this.size
        );
        break;
      case Directions.Right:
        distance = distance % maxX;
        this.snake.headPosition.x = Phaser.Math.Wrap(
          this.snake.startDirectionX + distance,
          0,
          gameConfigs.width / this.size
        );
        break;
      case Directions.Up:
        distance = distance % maxY;
        this.snake.headPosition.y = Phaser.Math.Wrap(
          this.snake.startDirectionY - distance,
          0,
          gameConfigs.height / this.size
        );
        break;
      case Directions.Down:
        distance = distance % maxY;
        this.snake.headPosition.y = Phaser.Math.Wrap(
          this.snake.startDirectionY + distance,
          0,
          gameConfigs.height / this.size
        );
        break;
    }

    this.snake.direction = this.snake.heading;

    //  Update the body segments and place the last coordinate into this.tail
    Phaser.Actions.ShiftPosition(
      this.snake.body.getChildren(),
      this.snake.headPosition.x * this.size,
      this.snake.headPosition.y * this.size,
      1,
      this.snake.tail
    );

    this.snake.moveTime = time + this.snake.speed;
    return true;

    // can hit body
    // var hitBody = Phaser.Actions.GetFirst(
    //   this.snake.body.getChildren(),
    //   { x: this.snake.head.x, y: this.snake.head.y },
    //   1
    // );
    // if (hitBody) {
    //   console.log('dead');
    //   this.snake.alive = false;
    //   this.game.events.emit(Events.GameEnd);
    //   return false;
    // } else {
    //   //  Update the timer ready for the next movement
    //   this.snake.moveTime = time + this.snake.speed;
    //   return true;
    // }
  }

  update(time, delta) {
    if (!this.snake) return;

    if (this.cursors.left?.isDown) {
      this.faceLeft();
    } else if (this.cursors.right?.isDown) {
      this.faceRight();
    } else if (this.cursors.up?.isDown) {
      this.faceUp();
    } else if (this.cursors.down?.isDown) {
      this.faceDown();
    }

    if (this.snakeUpdate(time)) {
      //  If the snake updated, we need to check for collision against food
      if (this.collideWithFood(this.food)) {
        // this.repositionFood();
      }
    }
  }

  repositionFood() {
    //  First create an array that assumes all positions
    //  are valid for the new piece of food

    //  A Grid we'll use to reposition the food each time it's eaten
    let testGrid = [];

    for (var y = 0; y < gameConfigs.height / this.size; y++) {
      testGrid[y] = [];

      for (var x = 0; x < gameConfigs.width / this.size; x++) {
        // @ts-ignore
        testGrid[y][x] = true;
      }
    }

    this.updateGrid(testGrid);

    //  Purge out false positions
    let validLocations = [];

    for (let y = 0; y < gameConfigs.height / this.size; y++) {
      for (let x = 0; x < gameConfigs.width / this.size; x++) {
        if (testGrid[y][x] === true) {
          //  Is this position valid for food? If so, add it here ...
          validLocations.push({ x: x, y: y });
        }
      }
    }

    if (validLocations.length > 0) {
      //  Pick a random food position
      const pos = Phaser.Math.RND.pick(validLocations);
      this.food.setPosition(
        pos.x * this.size + this.size / 2,
        pos.y * this.size + this.size / 2
      );
      return true;
    } else {
      return false;
    }
  }
}

export default SnakeScene;
