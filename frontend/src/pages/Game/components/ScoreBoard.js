import {
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Box, Typography } from '@mui/material';

import { createSocketInstance } from '../../../services/socket.service';

const ScoreBoard = ({}, ref) => {
  const [loaded, setLoaded] = useState(false);
  const [leaders, setLeaders] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  const updateLeaders = useCallback((newLeaders) => {
    setLeaders(newLeaders);
  }, []);

  const updateCurrentPlayer = useCallback(
    (updatedCurrentPlayer) => {
      setCurrentPlayer({ ...(currentPlayer || {}), ...updatedCurrentPlayer });
    },
    [currentPlayer]
  );

  useImperativeHandle(ref, () => ({
    updateLeaders,
    updateCurrentPlayer,
  }));

  useEffect(() => {
    const socket = createSocketInstance();

    socket.on('updateLeaders', ({ leaders: newLeaders }) => {
      setLeaders(newLeaders);
      setLoaded(true);
      socket.disconnect();
    });

    socket.emit('getLeaders');

    return () => socket.disconnect();
  }, []);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {currentPlayer && (
        <Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              width="20px"
              borderRadius="50%"
              bgcolor={
                currentPlayer?.color
                  ? `#${currentPlayer.color.toString(16)}`
                  : 'transparent'
              }
              sx={{ aspectRatio: '1/1' }}
            />
            <Typography
              fontSize={{ xs: '24px', sm: '36px' }}
              fontWeight={700}
              color="white"
            >
              {currentPlayer?.username}
            </Typography>
          </Box>
          <Typography
            fontSize={{ xs: '24px', sm: '36px' }}
            fontWeight={700}
            color="white"
          >
            Score: {currentPlayer?.score}
          </Typography>
        </Box>
      )}
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
      {loaded && (
        <Box display="flex" flexDirection="column">
          <Typography
            fontSize={{ xs: '24px', sm: '36px' }}
            fontWeight={700}
            color="white"
          >
            Top 3 players
          </Typography>
          {!!leaders.length ? (
            leaders.map((player, index) => (
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
      )}
    </Box>
  );
};

export default forwardRef(ScoreBoard);
