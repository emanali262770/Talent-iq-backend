import express from 'express';
import { checkBlackList } from '../middlewares/auth.middleware.js';
import { generateInterviewReports, getAllInterviewReports, getInterviewReportsById, startMockInterview, getMockInterview, submitMockInterviewAnswer, completeMockInterview, getMockInterviewHistory } from '../controllers/interview.controller.js';
import { uplode } from '../middlewares/fileUplode.js';

const router= express.Router();
/**
 * @post /api/interview
 */
router.post('/',checkBlackList,uplode.single('resume'),generateInterviewReports)
router.get('/',checkBlackList,getAllInterviewReports)
router.post('/mock', checkBlackList, startMockInterview)
router.get('/mock', checkBlackList, getMockInterviewHistory)
router.get('/mock/:id', checkBlackList, getMockInterview)
router.post('/mock/:id/answer', checkBlackList, submitMockInterviewAnswer)
router.post('/mock/:id/complete', checkBlackList, completeMockInterview)
router.get('/:id',checkBlackList,getInterviewReportsById)

export default router;
