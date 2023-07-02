import jwt from 'jsonwebtoken';
import passwordHash from 'password-hash';

import { get } from './user.service.js';
import environments from '../utils/environments.js';

const { JWT_SECRET_KEY, JWT_TOKEN_LIFE } = environments;

export const login = async (data) => {
  const { username, password } = data;
  const user = await get({ username });
  if (!user) throw new Error('Bad credential');

  const { password: userPassword } = user;
  if (!passwordHash.verify(password, userPassword))
    throw new Error('Bad credential');

  const userData = {
    id: user.id,
    username: user.username,
  };

  const token = jwt.sign(userData, JWT_SECRET_KEY, {
    expiresIn: JWT_TOKEN_LIFE,
  });

  return token;
};

export const getMe = async (id) => {
  const user = await get({ id });
  return {
    id: user.id,
    username: user.username,
  };
};

export const getUserFromToken = (token) => {
  if (!token) throw new Error('Bad credential');

  jwt.verify(token, JWT_SECRET_KEY);
  const user = jwt.decode(token);

  return user;
};
