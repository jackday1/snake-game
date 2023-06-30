import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, TextField, Button } from '@mui/material';
import { useSnackbar } from 'notistack';

import { login } from '../../services/auth.service';
import { ACCESS_TOKEN } from '../../utils/constants';

const Login = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState({ username: '', password: '' });
  const changeData = (obj) => setData({ ...data, ...obj });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (userData) => login(userData),
    onSuccess: (res) => {
      localStorage.setItem(ACCESS_TOKEN, res.data.token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (err) => {
      const error = (err.response && err.response.data) || err.message;
      enqueueSnackbar(error, { variant: 'error' });
    },
  });

  const submit = async () => {
    try {
      await mutation.mutateAsync(data);
    } catch (err) {
      console.error(err);
    }
  };

  const { username, password } = data;

  return (
    <Box
      p={2}
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        width="400px"
        maxWidth="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <TextField
          fullWidth
          variant="filled"
          label="Username"
          value={username}
          onChange={(e) => changeData({ username: e.target.value.trim() })}
        />
        <TextField
          type="password"
          fullWidth
          variant="filled"
          label="Password"
          value={password}
          onChange={(e) => changeData({ password: e.target.value.trim() })}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={submit}
          disabled={!username || !password || mutation.isLoading}
        >
          Login
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
