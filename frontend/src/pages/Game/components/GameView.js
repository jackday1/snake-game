import { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import Phaser from 'phaser';

import SnakeScene from './SnakeScene';
import { Events } from '../utils/constants';
import gameConfigs from '../../../configs/game.config';

const GameView = () => {
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const config = {
      type: Phaser.CANVAS,
      width: gameConfigs.width,
      height: gameConfigs.height,
      backgroundColor: '#f0f4c3',
      parent: 'game',
      scene: [SnakeScene],
      scale: {
        zoom: 0.6,
      },
    };

    const game = new Phaser.Game(config);
    // game.scale.scaleMode = Phaser.Scale.RESIZE;

    // Custom event that change value in Mobx store
    const addListeners = (game) => {
      game.events.on(Events.GameStart, () => {
        console.log('Game start');
        setIsPlaying(true);
      });

      game.events.on(Events.GameEnd, () => {
        console.log('Game end');
        setIsPlaying(false);
      });

      game.events.on(Events.IncreaseScore, (data) => {
        console.log('Increase score', data);
        setScore(data);
      });

      game.events.on(Events.ResetScore, () => {
        console.log('Reset score');
        setScore(0);
      });
    };

    addListeners(game);
  }, []);

  return (
    <Box display="flex">
      <Box m="auto" textAlign="center">
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          <Typography>
            {score} {!isPlaying && ' Press Enter to play again'}
          </Typography>
        </Box>
        <Box id="game" className="game-screen" />
      </Box>
    </Box>
  );
};

export default GameView;
