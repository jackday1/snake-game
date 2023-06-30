import * as services from '../services/auth.service.js';

export const login = async (req, res) => {
  try {
    console.log('body', req.body);
    const token = await services.login(req.body);
    return res.status(200).json({ token });
  } catch (err) {
    return res.sendStatus(401);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await services.getMe(req.userId);
    if (!user) throw new Error('Bad credential');
    return res.status(200).send(user);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};
