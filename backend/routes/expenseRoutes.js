import express from 'express';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateExpense, validateDateRange } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// Expense routes
router.post('/', validateExpense, createExpense);
router.get('/', validateDateRange, getExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', validateExpense, updateExpense);
router.delete('/:id', deleteExpense);

export default router;
