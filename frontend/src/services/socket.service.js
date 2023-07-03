import io from 'socket.io-client';

import { ACCESS_TOKEN } from '../utils/constants';
import environments from '../utils/environments';

const { BACKEND_URL } = environments;

export const createSocketInstance = () =>
  io(BACKEND_URL, {
    transports: ['websocket'],
    query: { token: localStorage.getItem(ACCESS_TOKEN) },
  });
