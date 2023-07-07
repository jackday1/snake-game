import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography } from '@mui/material';

const ScoreBoard = ({}, ref) => {
  const [players, setPlayers] = useState([]);

  const updatePlayers = useCallback((newPlayers) => {
    const sortedPlayers = Object.values(newPlayers)
      .sort((item1, item2) => item2.score - item1.score)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        username: item.username,
        score: item.cells.length,
      }));

    setPlayers(sortedPlayers);
  }, []);

  useImperativeHandle(ref, () => ({
    updatePlayers,
  }));

  return (
    <Box width="400px" display="flex" flexDirection="column" gap={3}>
      <Box display="flex" flexDirection="column">
        <Typography
          fontSize={{ xs: '24px', sm: '36px' }}
          fontWeight={700}
          color="white"
        >
          How to play?
        </Typography>
        <Typography
          fontSize={{ xs: '18px', sm: '24px' }}
          fontWeight={700}
          color="white"
        >
          Press Enter to start/retry game
        </Typography>
        <Typography
          fontSize={{ xs: '18px', sm: '24px' }}
          fontWeight={700}
          color="white"
        >
          W-A-S-D to move your snake
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column">
        <Typography
          fontSize={{ xs: '24px', sm: '36px' }}
          fontWeight={700}
          color="white"
        >
          Top 3 players
        </Typography>
        {!!players.length ? (
          players.map((player, index) => (
            <Typography
              key={player.id}
              fontSize={{ xs: '18px', sm: '24px' }}
              fontWeight={700}
              color="white"
            >
              {index + 1}. {player.username}: {player.score}
            </Typography>
          ))
        ) : (
          <Typography
            fontSize={{ xs: '18px', sm: '24px' }}
            fontWeight={700}
            color="white"
          >
            No players.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default forwardRef(ScoreBoard);
