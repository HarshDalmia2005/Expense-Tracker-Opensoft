import express from 'express';
import {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    addContribution,
} from '../controllers/goal.controller.js';
import { checkForUserAuthentication } from '../middleware/auth.middleware.js';

const goalRouter = express.Router();

goalRouter.post('/goals/create/:id', checkForUserAuthentication, createGoal);
goalRouter.get('/goals/get/:userId', checkForUserAuthentication, getGoals);
goalRouter.put('/goals/update/:id/:userId', checkForUserAuthentication, updateGoal);
goalRouter.delete('/goals/delete/:id/:userId', checkForUserAuthentication, deleteGoal);
goalRouter.post('/goals/contribute/:id/:userId', checkForUserAuthentication, addContribution);

export default goalRouter;
