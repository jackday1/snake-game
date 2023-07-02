import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import GameDetail from '../pages/Game/GameDetail';

const MainRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games/:id" element={<GameDetail />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default MainRoutes;
