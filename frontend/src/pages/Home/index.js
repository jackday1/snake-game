import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socketIOClient from 'socket.io-client';
import { Box, Button } from '@mui/material';

import { ACCESS_TOKEN } from '../../utils/constants';

const host = 'http://localhost:8888';

const Home = () => {
  const navigate = useNavigate();
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = socketIOClient.connect(host, {
      auth: { token: localStorage.getItem(ACCESS_TOKEN) },
    });

    socketRef.current.on('game-created', (data) => {
      const {
        game: { id },
      } = data;
      console.log({ id });
      navigate(`/games/${id}`);
    });

    return socketRef.current.disconnect();
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
