import io from 'socket.io-client';

import { ACCESS_TOKEN } from '../utils/constants';
import environments from '../utils/environments';

const { BACKEND_URL } = environments;

export const createSocketInstance = () => {
  // create a random token
  // should use jwt token in production
  let accessToken = localStorage.getItem(ACCESS_TOKEN);
  if (!accessToken) {
    accessToken = Date.now();
    localStorage.setItem(ACCESS_TOKEN, accessToken);
  }

  return io(BACKEND_URL, {
    transports: ['websocket'],
    query: { token: accessToken },
  });
};
