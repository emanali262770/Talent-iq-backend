import express from 'express';
import { login, register ,logout, getMe} from '../controllers/auth.controller.js';
import { checkBlackList } from '../middlewares/auth.middleware.js';
const router= express.Router();
/**
 * @post /api/auth/register
 * @post /api/auth/login 
 * @Post User Logout 
 */
router.post("/register", register);
router.post("/login", login);
router.post("/logout",logout)
router.get("/get-me",checkBlackList,getMe)


export default router;