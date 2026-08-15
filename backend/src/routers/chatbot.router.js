import express from 'express';
import { sendMessage } from '../controllers/chatbot.controller.js';
import { checkForUserAuthentication } from '../middleware/auth.middleware.js';

const chatbotRouter = express.Router();

chatbotRouter.post('/chatbot/message', checkForUserAuthentication, sendMessage);

export default chatbotRouter;
