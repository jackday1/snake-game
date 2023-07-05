import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

import GameView from './components/GameView';
import { createSocketInstance } from '../../services/socket.service';

const Game = () => {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = createSocketInstance();

    return () => socketRef.current.disconnect();
  }, []);

  return (
    <Box p={2} minHeight="100vh" display="flex" flexDirection="column">
      <Box flex={1}>
        <GameView />
      </Box>
    </Box>
  );
};

export default Game;
