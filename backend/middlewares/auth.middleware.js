import jwt from 'jsonwebtoken';

import environments from '../utils/environments.js';

const { JWT_SECRET_KEY } = environments;

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) throw new Error('Bad credential');

    jwt.verify(token, JWT_SECRET_KEY);

    const user = jwt.decode(token);

    req.userId = user.id;

    next();
  } catch (err) {
    console.error(err);
    return res.sendStatus(403);
  }
};

export default auth;
