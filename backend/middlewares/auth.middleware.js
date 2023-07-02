import { getUserFromToken } from '../services/auth.service.js';

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = getUserFromToken(token);

    req.userId = user.id;

    next();
  } catch (err) {
    console.error(err);
    return res.sendStatus(403);
  }
};

export default auth;
