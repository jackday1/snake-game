import { Router } from 'express';

import * as controllers from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', controllers.login);

export default router;
