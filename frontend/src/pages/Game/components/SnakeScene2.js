import Phaser from 'phaser';
import { gsap } from 'gsap';

import gameConfigs from '../../../configs/game.config';
import { createSocketInstance } from '../../../services/socket.service';

const { speed, tickRate } = gameConfigs;

class Food extends Phaser.GameObjects.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'food');
  }
}

class Snake {
  userId;
  x;
  y;
  body;
  color;
  constructor(scene, x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;

    this.body = scene.add.group();
    this.head = this.body.create(x, y, 'body');
    this.head.setOrigin(0);
  }
}

export class SnakeScene extends Phaser.Scene {
  cursors;
  userId = localStorage.getItem('userId');
  frontEndPlayers = {};
  sequenceNumber = 0;
  playerInputs = [];
  keys = {
    w: {
      pressed: false,
    },
    a: {
      pressed: false,
    },
    s: {
      pressed: false,
    },
    d: {
      pressed: false,
    },
  };
  interval = setInterval(() => {
    if (this.keys.w.pressed) {
      this.sequenceNumber++;
      this.playerInputs.push({
        sequenceNumber: this.sequenceNumber,
        dx: 0,
        dy: -speed,
      });
      this.frontEndPlayers[this.userId].y -= speed;
      this.socket.emit('keydown', {
        keycode: 'KeyW',
        sequenceNumber: this.sequenceNumber,
      });
    }

    if (this.keys.a.pressed) {
      this.sequenceNumber++;
      this.playerInputs.push({
        sequenceNumber: this.sequenceNumber,
        dx: -speed,
        dy: 0,
      });
      this.frontEndPlayers[this.userId].x -= speed;
      this.socket.emit('keydown', {
        keycode: 'KeyA',
        sequenceNumber: this.sequenceNumber,
      });
    }

    if (this.keys.s.pressed) {
      this.sequenceNumber++;
      this.playerInputs.push({
        sequenceNumber: this.sequenceNumber,
        dx: 0,
        dy: speed,
      });
      this.frontEndPlayers[this.userId].y += speed;
      this.socket.emit('keydown', {
        keycode: 'KeyS',
        sequenceNumber: this.sequenceNumber,
      });
    }

    if (this.keys.d.pressed) {
      this.sequenceNumber++;
      this.playerInputs.push({
        sequenceNumber: this.sequenceNumber,
        dx: speed,
        dy: 0,
      });
      this.frontEndPlayers[this.userId].x += speed;
      this.socket.emit('keydown', {
        keycode: 'KeyD',
        sequenceNumber: this.sequenceNumber,
      });
    }
  }, tickRate);

  constructor() {
    super({
      key: 'SnakeScene',
    });

    this.socket = createSocketInstance();

    this.socket.on('updatePlayers', ({ backEndPlayers, food }) => {
      console.log({ backEndPlayers, food });
      if (food) {
        if (!this.food) {
          this.food = new Food(this, food.x, food.y);
          this.children.add(this.food);
        } else {
          this.food.setPosition(food.x, food.y);
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
            backEndPlayer.color
          );
        } else {
          if (id === this.userId) {
            // if a player already exists
            this.frontEndPlayers[id].x = backEndPlayer.x;
            this.frontEndPlayers[id].y = backEndPlayer.y;

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

            gsap.to(this.frontEndPlayers[id], {
              x: backEndPlayer.x,
              y: backEndPlayer.y,
              duration: 0.015,
              ease: 'linear',
            });
          }
        }
      }

      for (const id in this.frontEndPlayers) {
        if (!backEndPlayers[id]) {
          delete this.frontEndPlayers[id];
        }
      }
    });
  }

  preload() {
    this.load.image('food', '/images/heart20.png');
    this.load.image('body', '/images/square20.png');
  }

  create() {
    this.input.keyboard.on('keydown', (event) => {
      if (!this.frontEndPlayers[this.userId]) return;

      switch (event.code) {
        case 'KeyW':
          this.keys.w.pressed = true;
          break;

        case 'KeyA':
          this.keys.a.pressed = true;
          break;

        case 'KeyS':
          this.keys.s.pressed = true;
          break;

        case 'KeyD':
          this.keys.d.pressed = true;
          break;
      }
    });

    this.input.keyboard.on('keyup', (event) => {
      if (!this.frontEndPlayers[this.userId]) return;

      switch (event.code) {
        case 'KeyW':
          this.keys.w.pressed = false;
          break;

        case 'KeyA':
          this.keys.a.pressed = false;
          break;

        case 'KeyS':
          this.keys.s.pressed = false;
          break;

        case 'KeyD':
          this.keys.d.pressed = false;
          break;
      }
    });
  }

  update(time, delta) {
    for (const id in this.frontEndPlayers) {
      const snake = this.frontEndPlayers[id];
      Phaser.Actions.ShiftPosition(
        snake.body.getChildren(),
        snake.x,
        snake.y,
        1
      );
    }
  }
}

export default SnakeScene;
