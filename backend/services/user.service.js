import passwordHash from 'password-hash';
import crypto from 'crypto';

import db from '../db.js';

export const create = async (data) => {
  const { username, password } = data;
  if (!username || username.includes(' ')) return;
  if (!password || password.includes(' ')) return;

  await db.read();
  const { users } = db.data;
  if (users.some((item) => item.username === username))
    throw new Error('User existed');

  users.push({
    id: crypto.randomUUID(),
    username,
    password: passwordHash.generate(password),
  });

  await db.write();
};

export const get = async (filters = {}) => {
  await db.read();
  const { users } = db.data;
  const user = users.find((item) =>
    Object.keys(filters).every((key) => item[key] === filters[key])
  );

  return user;
};
