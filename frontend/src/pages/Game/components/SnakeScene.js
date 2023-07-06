import Phaser from 'phaser';

import { createSocketInstance } from '../../../services/socket.service';
import { Events } from '../utils/constants';
import gameConfigs from '../../../configs/game.config';
import { ACCESS_TOKEN } from '../../../utils/constants';

const { speed, size, tickRate } = gameConfigs;

class Food extends Phaser.GameObjects.Image {
  constructor(scene, x, y) {
    super(scene, x + size / 2, y + size / 2, 'food');
  }
}

class Snake {
  userId;
  x;
  y;
  cells;
  body;
  color;
  constructor(scene, x, y, cells, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.cells = cells;
    this.body = scene.add.group();
    this.head = this.body.create(x, y, 'body');
    this.head.setOrigin(0);
  }
}

export class SnakeScene extends Phaser.Scene {
  cursors;
  userId = localStorage.getItem(ACCESS_TOKEN);
  frontEndPlayers = {};
  sequenceNumber = 0;
  playerInputs = [];

  constructor() {
    super({
      key: 'SnakeScene',
    });

    this.socket = createSocketInstance();

    this.socket.on('updatePlayers', ({ backEndPlayers, food }) => {
      if (food) {
        if (!this.food) {
          this.food = new Food(this, food.x, food.y);
          this.children.add(this.food);
        } else {
          this.food.setPosition(food.x + size / 2, food.y + size / 2);
        }
      }
      for (const id in backEndPlayers) {
        const backEndPlayer = backEndPlayers[id];
        if (!backEndPlayer) continue;

        if (!this.frontEndPlayers[id]) {
          this.frontEndPlayers[id] = new Snake(
            this,
            backEndPlayer.x,
            backEndPlayer.y,
            backEndPlayer.cells,
            backEndPlayer.color
          );
        } else {
          if (id === this.userId) {
            // if a player already exists
            this.frontEndPlayers[id].x = backEndPlayer.x;
            this.frontEndPlayers[id].y = backEndPlayer.y;
            this.frontEndPlayers[id].cells = backEndPlayer.cells;

            const lastBackendInputIndex = this.playerInputs.findIndex(
              (input) => {
                return backEndPlayer.sequenceNumber === input.sequenceNumber;
              }
            );

            if (lastBackendInputIndex > -1)
              this.playerInputs.splice(0, lastBackendInputIndex + 1);

            this.playerInputs.forEach((input) => {
              this.frontEndPlayers[id].x += input.dx;
              this.frontEndPlayers[id].y += input.dy;
            });
          } else {
            // for all other players
            this.frontEndPlayers[id].x = backEndPlayer.x;
            this.frontEndPlayers[id].y = backEndPlayer.y;
            this.frontEndPlayers[id].cells = backEndPlayer.cells;
          }
        }
      }

      for (const id in this.frontEndPlayers) {
        if (!backEndPlayers[id]) {
          const snake = this.frontEndPlayers[id];
          const children = snake.body.getChildren();
          children.map((child) => snake.body.killAndHide(child));
          delete this.frontEndPlayers[id];
        }
      }

      this.game.events.emit(Events.UpdatePlayers, backEndPlayers);
    });

    this.socket.on('dead', ({ userId }) => {
      if (userId === this.userId) {
        alert('You lost!');
      }
    });
  }

  preload() {
    this.load.image('food', 'images/heart20.png');
    this.load.image('body', 'images/snake.png');
  }

  create() {
    this.input.keyboard.on('keydown', (event) => {
      const player = this.frontEndPlayers[this.userId];
      if (!player) {
        if (event.code === 'Enter') {
          this.socket.emit('join');
        }
        return;
      }

      switch (event.code) {
        case 'KeyW':
          if (!['up', 'down'].includes(player.direction)) {
            this.sequenceNumber++;
            this.playerInputs.push({
              sequenceNumber: this.sequenceNumber,
              dx: 0,
              dy: -speed,
            });
            player.y -= speed;
            player.direction = 'up';
            player.cells.unshift({ x: player.x, y: player.y });
            player.cells.pop();
            this.socket.emit('keydown', {
              keycode: 'KeyW',
              sequenceNumber: this.sequenceNumber,
            });
          }
          break;

        case 'KeyA':
          if (!['right', 'left'].includes(player.direction)) {
            this.sequenceNumber++;
            this.playerInputs.push({
              sequenceNumber: this.sequenceNumber,
              dx: -speed,
              dy: 0,
            });
            player.x -= speed;
            player.direction = 'left';
            player.cells.unshift({ x: player.x, y: player.y });
            player.cells.pop();
            this.socket.emit('keydown', {
              keycode: 'KeyA',
              sequenceNumber: this.sequenceNumber,
            });
          }
          break;

        case 'KeyS':
          if (!['up', 'down'].includes(player.direction)) {
            this.sequenceNumber++;
            this.playerInputs.push({
              sequenceNumber: this.sequenceNumber,
              dx: 0,
              dy: speed,
            });
            player.y += speed;
            player.direction = 'down';
            player.cells.unshift({ x: player.x, y: player.y });
            player.cells.pop();
            this.socket.emit('keydown', {
              keycode: 'KeyS',
              sequenceNumber: this.sequenceNumber,
            });
          }
          break;

        case 'KeyD':
          if (!['right', 'left'].includes(player.direction)) {
            this.sequenceNumber++;
            this.playerInputs.push({
              sequenceNumber: this.sequenceNumber,
              dx: speed,
              dy: 0,
            });
            player.x += speed;
            player.direction = 'right';
            player.cells.unshift({ x: player.x, y: player.y });
            player.cells.pop();
            this.socket.emit('keydown', {
              keycode: 'KeyD',
              sequenceNumber: this.sequenceNumber,
            });
          }
          break;
      }
    });
  }

  update(time, delta) {
    if (!Object.keys(this.frontEndPlayers).length) return;

    for (const id in this.frontEndPlayers) {
      const snake = this.frontEndPlayers[id];
      const children = snake.body.getChildren();
      snake.cells.map((cell, i) => {
        const sprite = children[i];
        if (sprite) {
          sprite.setPosition(cell.x, cell.y);
        } else {
          const newPart = snake.body.create(cell.x, cell.y, 'body');
          newPart.setOrigin(0);
        }
      });
    }
  }
}

export default SnakeScene;
