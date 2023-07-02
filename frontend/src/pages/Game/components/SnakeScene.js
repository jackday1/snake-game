import Phaser from 'phaser';

import { Events, Directions } from '../utils/constants';
import gameConfigs from '../../../configs/game.config';

class Food extends Phaser.GameObjects.Image {
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
  constructor(scene, x, y, size) {
    this.headPosition = new Phaser.Geom.Point(x, y);
    this.body = scene.add.group();
    this.head = this.body.create(x * size, y * size, 'body');
    this.head.setOrigin(0);
    this.alive = true;
    this.speed = 50;
    this.moveTime = 0;
    this.tail = new Phaser.Geom.Point(x, y);
    this.heading = Directions.Right;
    this.direction = Directions.Right;
  }
}

export class SnakeScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'SnakeScene',
    });
  }

  size = gameConfigs.size;
  cursors;
  total = 0;
  snake;
  food;

  preload() {
    this.load.image('food', '/images/heart20.png');
    this.load.image('body', '/images/square20.png');
  }

  create() {
    this.food = new Food(this, 3, 4, this.size);
    this.children.add(this.food);
    this.snake = new Snake(this, 8, 8, this.size);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.snake.alive) {
        this.reset();
        this.game.events.emit(Events.ResetScore);
        this.game.events.emit(Events.GameStart);
      }
    });
  }

  reset() {
    this.children.removeAll();
    this.total = 0;
    this.food = new Food(this, 3, 4, this.size);
    this.children.add(this.food);
    this.snake = new Snake(this, 8, 8, this.size);
  }

  eat() {
    this.total = this.total + 1;
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
      this.grow();
      this.eat();
      //  For every 5 items of food eaten we'll increase the snake speed a little
      if (this.snake.speed > 20 && this.total % 5 === 0) {
        this.snake.speed -= 5;
      }

      this.game.events.emit(Events.IncreaseScore, this.total);
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
      this.snake.heading = Directions.Left;
    }
  }

  faceRight() {
    if (
      this.snake.direction === Directions.Up ||
      this.snake.direction === Directions.Down
    ) {
      this.snake.heading = Directions.Right;
    }
  }

  faceUp() {
    if (
      this.snake.direction === Directions.Left ||
      this.snake.direction === Directions.Right
    ) {
      this.snake.heading = Directions.Up;
    }
  }

  faceDown() {
    if (
      this.snake.direction === Directions.Left ||
      this.snake.direction === Directions.Right
    ) {
      this.snake.heading = Directions.Down;
    }
  }

  move(time) {
    if (!this.snake.alive) {
      return false;
    }
    switch (this.snake.heading) {
      case Directions.Left:
        this.snake.headPosition.x = Phaser.Math.Wrap(
          this.snake.headPosition.x - 1,
          0,
          gameConfigs.width / this.size
        );
        break;
      case Directions.Right:
        this.snake.headPosition.x = Phaser.Math.Wrap(
          this.snake.headPosition.x + 1,
          0,
          gameConfigs.width / this.size
        );
        break;
      case Directions.Up:
        this.snake.headPosition.y = Phaser.Math.Wrap(
          this.snake.headPosition.y - 1,
          0,
          gameConfigs.height / this.size
        );
        break;
      case Directions.Down:
        this.snake.headPosition.y = Phaser.Math.Wrap(
          this.snake.headPosition.y + 1,
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

    var hitBody = Phaser.Actions.GetFirst(
      this.snake.body.getChildren(),
      { x: this.snake.head.x, y: this.snake.head.y },
      1
    );
    if (hitBody) {
      console.log('dead');
      this.snake.alive = false;
      this.game.events.emit(Events.GameEnd);
      return false;
    } else {
      //  Update the timer ready for the next movement
      this.snake.moveTime = time + this.snake.speed;
      return true;
    }
  }

  update(time, delta) {
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
        this.repositionFood();
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
