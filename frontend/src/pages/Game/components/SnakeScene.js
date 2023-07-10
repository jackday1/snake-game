import Phaser from 'phaser';

import { createSocketInstance } from '../../../services/socket.service';
import { Events } from '../utils/constants';
import gameConfigs from '../../../configs/game.config';
import { ACCESS_TOKEN } from '../../../utils/constants';

const { width, height, size } = gameConfigs;

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
    this.head.tint = Phaser.Display.Color.HexStringToColor(color).color;
  }
}

export class SnakeScene extends Phaser.Scene {
  userId = localStorage.getItem(ACCESS_TOKEN);
  frontEndPlayers = {};
  gameReady = false;
  foods = {};

  constructor() {
    super({
      key: 'SnakeScene',
    });

    this.socket = createSocketInstance();

    this.socket.on(
      'updatePlayers',
      ({ backEndPlayers, foods, leaders, leaderChanged, time }) => {
        if (!this.gameReady) return;
        // uncomment to see how many ms to send event from server to client
        // const now = Date.now();
        // console.log({ now, diff: now - time });
        const keys = foods.map((food) => `${food.x}-${food.y}`);

        // remove eated foods
        Object.values(this.foods)
          .filter(
            (food) =>
              !keys.includes(`${food.x - size / 2}-${food.y - size / 2}`)
          )
          .map((food) => food.destroy());

        // add new foods
        foods.map((food) => {
          const key = `${food.x}-${food.y}`;
          if (!this.foods[key]) {
            this.foods[key] = new Food(this, food.x, food.y);
            this.foods[key].depth = 1;
            this.children.add(this.foods[key]);
          }
        });

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

            // update current player
            this.game.events.emit(Events.UpdateCurrentPlayer, {
              username: backEndPlayer.username,
              color: backEndPlayer.color,
              score: backEndPlayer.cells.length - 3,
            });
          } else {
            if (id === this.userId) {
              // if a player already exists
              this.frontEndPlayers[id].x = backEndPlayer.x;
              this.frontEndPlayers[id].y = backEndPlayer.y;
              this.frontEndPlayers[id].cells = backEndPlayer.cells;

              // update current player
              if (
                this.frontEndPlayers[id].cells?.length !==
                backEndPlayer.cells?.length
              ) {
                this.game.events.emit(Events.UpdateCurrentPlayer, {
                  score: backEndPlayer.cells?.length - 3,
                });
              }
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

        if (leaderChanged) {
          this.game.events.emit(Events.UpdateLeaders, leaders);
        }
      }
    );

    this.socket.on('grow', ({ userId }) => {
      if (!this.gameReady) return;
      if (userId == this.userId) {
        this.beepAudio.play();
        this.game.events.emit(Events.UpdateCurrentPlayer, {
          score: this.frontEndPlayers[userId].cells?.length - 3 + 1,
        });
      }
    });

    this.socket.on('dead', ({ userId }) => {
      if (!this.gameReady) return;
      if (userId === this.userId) {
        this.createOverlay('Game Over! Press Enter to try again.');
        this.bgAudio.stop();
        this.gameOverAudio.play();
      }
    });
  }

  preload() {
    // this.load.image('background', 'images/galaxy.jpeg');
    this.load.image('food', 'images/food.png');
    this.load.image('body', 'images/snake.png');
    this.load.audio('bg', 'audios/bg-audio.mp3');
    this.load.audio('game-over', 'audios/game-over.mp3');
    this.load.audio('beep', 'audios/beep.mp3');
  }

  createOverlay(text = 'Press Enter to play!') {
    if (this.overlay) return;
    this.overlay = {
      bg: this.add.renderTexture(0, 0, width, height),
      text: this.add
        .text(width / 2, height / 2, text, {
          fontFamily: "'VT323', monospace",
          fontSize: '48px',
          color: 'white',
        })
        .setOrigin(0.5),
    };
    this.overlay.bg.fill(0x000000, 0.5);
    this.overlay.bg.depth = 1;
    this.overlay.text.depth = 1;
  }

  removeOverlay() {
    if (!this.overlay) return;
    this.overlay.bg.destroy(true);
    this.overlay.text.destroy(true);
    this.overlay = null;
  }

  create() {
    this.bgAudio = this.sound.add('bg', { loop: true });
    this.beepAudio = this.sound.add('beep', { loop: false });
    this.gameOverAudio = this.sound.add('game-over', { loop: false });
    // const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    // background.depth = -1;
    this.createOverlay();
    this.gameReady = true;

    this.input.keyboard.on('keydown', (event) => {
      const player = this.frontEndPlayers[this.userId];
      if (!player) {
        if (event.code === 'Enter') {
          this.removeOverlay();
          this.bgAudio.play();
          this.socket.emit('join');
        }
        return;
      }

      switch (event.code) {
        case 'KeyW':
          if (!['up', 'down'].includes(player.direction)) {
            this.socket.emit('keydown', {
              keycode: 'KeyW',
            });
          }
          break;

        case 'KeyA':
          if (!['right', 'left'].includes(player.direction)) {
            this.socket.emit('keydown', {
              keycode: 'KeyA',
            });
          }
          break;

        case 'KeyS':
          if (!['up', 'down'].includes(player.direction)) {
            this.socket.emit('keydown', {
              keycode: 'KeyS',
            });
          }
          break;

        case 'KeyD':
          if (!['right', 'left'].includes(player.direction)) {
            this.socket.emit('keydown', {
              keycode: 'KeyD',
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
          newPart.tint = Phaser.Display.Color.HexStringToColor(
            snake.color
          ).color;
        }
      });
    }
  }
}

export default SnakeScene;
