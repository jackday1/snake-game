import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import useAuth from '../hooks/useAuth';

const Navigations = () => {
  const { isInitialized, user } = useAuth();

  if (!isInitialized) return null;

  if (!user) return <AuthRoutes />;

  return <MainRoutes />;
};

export default Navigations;
