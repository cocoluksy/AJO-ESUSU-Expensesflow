import { body, validationResult, query } from 'express-validator';

// Custom validation middleware to catch validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation error', 
      errors: errors.array() 
    });
  }
  next();
};

// Validation chains for user registration
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
    .withMessage('Password must contain letters, numbers, and special characters'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('business_name')
    .trim()
    .optional()
    .isLength({ max: 255 })
    .withMessage('Business name must not exceed 255 characters'),
  handleValidationErrors
];

// Validation chains for login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Validation chains for expense creation
const validateExpense = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category_id')
    .isInt()
    .withMessage('Valid category ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('description')
    .trim()
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('payment_method')
    .trim()
    .optional()
    .isLength({ max: 50 })
    .withMessage('Payment method must not exceed 50 characters'),
  body('tags')
    .trim()
    .optional()
    .isLength({ max: 255 })
    .withMessage('Tags must not exceed 255 characters'),
  handleValidationErrors
];

// Validation chains for category creation
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters'),
  body('description')
    .trim()
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be valid hex format'),
  body('icon')
    .trim()
    .optional()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),
  handleValidationErrors
];

// Validation chains for date range queries
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  handleValidationErrors
];

export {
  validateRegister,
  validateLogin,
  validateExpense,
  validateCategory,
  validateDateRange,
  handleValidationErrors
};
