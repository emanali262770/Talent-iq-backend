import express from 'express';
import { checkBlackList } from '../middlewares/auth.middleware.js';
import { generateInterviewReports, getAllInterviewReports, getInterviewReportsById } from '../controllers/interview.controller.js';
import { uplode } from '../middlewares/fileUplode.js';

const router= express.Router();
/**
 * @post /api/interview
 */
router.post('/',checkBlackList,uplode.single('resume'),generateInterviewReports)
router.get('/',checkBlackList,getAllInterviewReports)
router.get('/:id',checkBlackList,getInterviewReportsById)

export default router;