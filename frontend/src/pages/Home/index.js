import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box p={2}>
      <Button onClick={() => navigate('/game')}>Go to game demo</Button>
    </Box>
  );
};

export default Home;
