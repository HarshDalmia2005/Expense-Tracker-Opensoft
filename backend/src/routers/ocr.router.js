import express from 'express';
import { scanReceipt } from '../controllers/ocr.controller.js';
import { checkForUserAuthentication } from '../middleware/auth.middleware.js';

const ocrRouter = express.Router();

ocrRouter.post('/ocr/scan', checkForUserAuthentication, scanReceipt);

export default ocrRouter;
