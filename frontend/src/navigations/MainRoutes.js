import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import Game from '../pages/Game';

const MainRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<Game />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default MainRoutes;
