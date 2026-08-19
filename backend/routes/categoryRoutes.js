import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateCategory } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// Category routes
router.post('/', validateCategory, createCategory);
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.put('/:id', validateCategory, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
