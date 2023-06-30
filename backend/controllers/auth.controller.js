import * as services from '../services/auth.service.js';

export const login = async (req, res) => {
  try {
    const token = await services.login(req.body);
    return res.status(200).json({ token });
  } catch (err) {
    return res.sendStatus(401);
  }
};
