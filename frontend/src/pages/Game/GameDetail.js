import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import GameView from './components/GameView';
import { createSocketInstance } from '../../services/socket.service';

const GameDetail = () => {
  const { id } = useParams();
  const socketRef = useRef();
  const [score, setScore] = useState(0);

  useEffect(() => {
    socketRef.current = createSocketInstance();

    socketRef.current.on('ate', (data) => {
      const { snake } = data;
      setScore(snake.length);
    });

    return () => socketRef.current.disconnect();
  }, []);

  return (
    <Box p={2} minHeight="100vh" display="flex" flexDirection="column">
      <Typography align="center">Game id: {id}</Typography>
      <Box flex={1}>
        <GameView />
      </Box>
    </Box>
  );
};

export default GameDetail;
