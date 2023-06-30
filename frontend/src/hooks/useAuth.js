import { useQuery } from '@tanstack/react-query';

import { getMe } from '../services/auth.service';

const useAuth = () => {
  const { data, status } = useQuery({
    queryKey: ['auth'],
    queryFn: getMe,
    cacheTime: Infinity,
    staleTime: Infinity,
    retry: 0,
  });

  return {
    isInitialized: status !== 'loading',
    user: data?.data || null,
  };
};

export default useAuth;
