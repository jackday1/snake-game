import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';

import { createSocketInstance } from '../../services/socket.service';

const Home = () => {
  const navigate = useNavigate();
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = createSocketInstance();

    socketRef.current.on('game-created', (data) => {
      const {
        game: { id },
      } = data;
      navigate(`/games/${id}`);
    });

    return () => socketRef.current.disconnect();
  }, []);

  const create = () => {
    socketRef.current.emit('create-game');
  };

  return (
    <Box p={2}>
      <Button variant="contained" onClick={create}>
        Create game
      </Button>
    </Box>
  );
};

export default Home;
