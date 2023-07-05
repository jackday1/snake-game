import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography } from '@mui/material';
import { lightBlue } from '@mui/material/colors';

const ScoreBoard = ({}, ref) => {
  const [players, setPlayers] = useState([]);

  const updatePlayers = useCallback((newPlayers) => {
    const sortedPlayers = Object.values(newPlayers)
      .map((item) => ({ username: item.username, score: item.cells.length }))
      .sort((item1, item2) => item2.score - item1.score);
    setPlayers(sortedPlayers);
  }, []);

  useImperativeHandle(ref, () => ({
    updatePlayers,
  }));

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography fontSize="20px" fontWeight={700}>
        Score board
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        {players.map((player, index) => (
          <Box
            key={player.username}
            p={2}
            borderRadius={2}
            bgcolor={lightBlue[200]}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography>
              {index + 1}. {player.username}
            </Typography>
            <Typography>{player.score}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default forwardRef(ScoreBoard);
