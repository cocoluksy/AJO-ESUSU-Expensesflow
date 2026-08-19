import express from 'express';
import {
  getCategoryBreakdown,
  getDailyTrend,
  getMonthlySummary,
  getFinancialReport
} from '../controllers/reportController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateDateRange } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// Report routes
router.get('/category-breakdown', validateDateRange, getCategoryBreakdown);
router.get('/daily-trend', validateDateRange, getDailyTrend);
router.get('/monthly-summary', getMonthlySummary);
router.get('/financial-report', validateDateRange, getFinancialReport);

export default router;
