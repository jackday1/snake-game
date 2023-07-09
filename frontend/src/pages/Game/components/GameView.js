import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import Phaser from 'phaser';

import SnakeScene from './SnakeScene';
import ScoreBoard from './ScoreBoard';
import { Events } from '../utils/constants';
import gameConfigs from '../../../configs/game.config';

const { width, height } = gameConfigs;

const GameView = () => {
  const scoreBoardRef = useRef();

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width,
      height,
      backgroundColor: '#000',
      parent: 'game',
      scene: [SnakeScene],
      scale: {
        zoom: 0.6,
      },
    };

    const game = new Phaser.Game(config);

    const addListeners = (game) => {
      game.events.on(Events.UpdateLeaders, (leaders) => {
        scoreBoardRef.current?.updateLeaders(leaders);
      });

      game.events.on(Events.UpdateCurrentPlayer, (currentPlayer) => {
        scoreBoardRef.current?.updateCurrentPlayer(currentPlayer);
      });
    };

    addListeners(game);

    return () => game.scene.destroy();
  }, []);

  return (
    <Box
      height="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Box display="flex" gap={2}>
        <Box
          id="game"
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            '& canvas': {
              border: `2px solid white`,
            },
          }}
        />
        <ScoreBoard ref={scoreBoardRef} />
      </Box>
    </Box>
  );
};

export default GameView;
