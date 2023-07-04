import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import Game from '../pages/Game';
import GameDetail from '../pages/Game/GameDetail';

const MainRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<Game />} />
      <Route path="/games/:id" element={<GameDetail />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default MainRoutes;
