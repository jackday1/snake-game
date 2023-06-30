import { Router } from 'express';

import auth from '../middlewares/auth.middleware.js';
import * as controllers from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', controllers.login);

router.get('/me', auth, controllers.getMe);

export default router;
