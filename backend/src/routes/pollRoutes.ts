import { Router } from 'express';
import { createPoll, getPoll } from '../controllers/pollController.js';

const router = Router();

router.post('/create', createPoll);
router.get('/:code', getPoll);

export default router;