import { useEffect, useRef } from 'react';
import { Box, Grid } from '@mui/material';
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
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <Box
            id="game"
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              '& canvas': {
                // border: `2px solid white`,
                border: '15px solid rgb(28, 49, 73)',
                width: '100%',
                height: '100%',
              },
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <ScoreBoard ref={scoreBoardRef} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GameView;
