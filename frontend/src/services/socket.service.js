import io from 'socket.io-client';
import randomstring from 'randomstring';

import { ACCESS_TOKEN, USERNAME } from '../utils/constants';
import environments from '../utils/environments';

const { BACKEND_URL } = environments;

export const createSocketInstance = () => {
  // create a random token
  // should use jwt token in production
  let token = localStorage.getItem(ACCESS_TOKEN);
  let username = localStorage.getItem(USERNAME);
  if (!token) {
    token = randomstring.generate(10);
    localStorage.setItem(ACCESS_TOKEN, token);
  }
  if (!username) {
    username = `player ${randomstring.generate(4)}`;
    localStorage.setItem(USERNAME, username);
  }

  return io(BACKEND_URL, {
    transports: ['websocket'],
    query: { token, username },
  });
};
