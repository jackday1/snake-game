import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { red } from '@mui/material/colors';
import Phaser from 'phaser';

import SnakeScene from './SnakeScene2';
import { Events } from '../utils/constants';
import gameConfigs from '../../../configs/game.config';

const { width, height } = gameConfigs;

const GameView = () => {
  useEffect(() => {
    const config = {
      type: Phaser.CANVAS,
      width,
      height,
      backgroundColor: '#f0f4c3',
      parent: 'game',
      scene: [SnakeScene],
      scale: {
        zoom: 0.6,
      },
    };

    new Phaser.Game(config);
  }, []);

  return (
    <Box display="flex">
      <Box m="auto" textAlign="center">
        <Box
          id="game"
          className="game-screen"
          sx={{
            '& canvas': {
              border: `2px solid ${red[500]}`,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default GameView;
