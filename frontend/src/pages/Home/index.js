import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, alpha, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import randomstring from 'randomstring';

import { ACCESS_TOKEN, USERNAME } from '../../utils/constants';

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [username, setUsername] = useState('');

  const joinGame = () => {
    if (!username) {
      enqueueSnackbar('Please fill in your username', { variant: 'error' });
      return;
    }
    localStorage.setItem(USERNAME, username);
    localStorage.setItem(ACCESS_TOKEN, randomstring.generate(10));
    navigate('/game');
  };

  return (
    <Box
      sx={{
        backgroundImage: 'url(/images/galaxy-bg.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box
        p={2}
        height="100vh"
        width="100vw"
        bgcolor={alpha('#000', 0.4)}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <Box display="flex" flexDirection="column" alignItems="center">
          <img src="/images/snake-pixel.png" alt="snake" width="200" />
          <Typography
            fontSize="60px"
            align="center"
            color="white"
            sx={{ textShadow: '0px 0px 21px rgba(255,255,255,1)' }}
          >
            JSnake.io
          </Typography>
        </Box>
        <Box
          width={{ xs: '90vw', sm: '400px' }}
          display="flex"
          bgcolor="white"
          borderRadius={6}
          overflow="hidden"
          sx={{
            '& input': {
              flex: 1,
              border: 'none',
              outline: 'none',
              bgcolor: 'transparent',
              px: 2,
              py: 0,
              fontSize: { xs: '16px', sm: '20px' },
            },
          }}
        >
          <input
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button
            onClick={joinGame}
            sx={{
              py: 0.5,
              px: 2,
              borderRadius: 6,
              bgcolor: alpha(theme.colors.main, 0.8),
              color: 'white',
              fontSize: { xs: '16px', sm: '20px' },
              '&:hover': { bgcolor: theme.colors.main },
            }}
          >
            Join game
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
