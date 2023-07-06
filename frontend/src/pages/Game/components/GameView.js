import { useEffect, useRef } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { red } from '@mui/material/colors';
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
      backgroundColor: '#f0f4c3',
      parent: 'game',
      scene: [SnakeScene],
      scale: {
        zoom: 0.6,
      },
    };

    const game = new Phaser.Game(config);

    const addListeners = (game) => {
      game.events.on(Events.UpdatePlayers, (players) => {
        scoreBoardRef.current.updatePlayers(players);
      });
    };

    addListeners(game);
  }, []);

  return (
    <Box>
      <Grid container spacing={1}>
        <Grid item xs={9}>
          <Typography>Press Enter to play!</Typography>
          <Box
            id="game"
            className="game-screen"
            sx={{
              '& canvas': {
                border: `2px solid ${red[500]}`,
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
