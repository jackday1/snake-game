import { Box } from '@mui/material';

import GameView from './components/GameView';

const Game = () => {
  return (
    <Box
      p={2}
      minHeight="100vh"
      bgcolor="black"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <GameView />
    </Box>
  );
};

export default Game;
