import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';

const GameDetail = () => {
  const { id } = useParams();

  return <Box>Game id: {id}</Box>;
};

export default GameDetail;
