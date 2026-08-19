import pool from '../config/database.js';

// Create a new expense
const createExpense = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { amount, category_id, date, description, payment_method, tags } = req.body;
    const userId = req.user.id;

    // Verify category belongs to the user
    const categoryCheck = await client.query(
      'SELECT id FROM expense_categories WHERE id = $1 AND user_id = $2',
      [category_id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Category not found or unauthorized'
      });
    }

    // Insert expense
    const result = await client.query(
      `INSERT INTO expenses (user_id, category_id, amount, date, description, payment_method, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, category_id, amount, date, description, payment_method, tags, created_at`,
      [userId, category_id, amount, date, description || null, payment_method || null, tags || null]
    );

    // Log expense creation
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'CREATE', 'EXPENSE', result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense'
    });
  } finally {
    client.release();
  }
};

// Get all expenses for current user
const getExpenses = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { start_date, end_date, category_id } = req.query;

    let query = `
      SELECT e.*, c.name as category_name, c.color, c.icon
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 1;

    // Add date filter if provided
    if (start_date) {
      paramCount++;
      query += ` AND e.date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND e.date <= $${paramCount}`;
      params.push(end_date);
    }

    // Add category filter if provided
    if (category_id) {
      paramCount++;
      query += ` AND e.category_id = $${paramCount}`;
      params.push(category_id);
    }

    query += ' ORDER BY e.date DESC';

    const result = await client.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses'
    });
  } finally {
    client.release();
  }
};

// Get single expense by ID
const getExpenseById = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await client.query(
      `SELECT e.*, c.name as category_name, c.color, c.icon
       FROM expenses e
       LEFT JOIN expense_categories c ON e.category_id = c.id
       WHERE e.id = $1 AND e.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense'
    });
  } finally {
    client.release();
  }
};

// Update expense
const updateExpense = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { amount, category_id, date, description, payment_method, tags } = req.body;
    const userId = req.user.id;

    // Verify expense belongs to user
    const expenseCheck = await client.query(
      'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (expenseCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Expense not found or unauthorized'
      });
    }

    // If category is being updated, verify it belongs to user
    if (category_id) {
      const categoryCheck = await client.query(
        'SELECT id FROM expense_categories WHERE id = $1 AND user_id = $2',
        [category_id, userId]
      );

      if (categoryCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Category not found or unauthorized'
        });
      }
    }

    const result = await client.query(
      `UPDATE expenses 
       SET amount = COALESCE($1, amount),
           category_id = COALESCE($2, category_id),
           date = COALESCE($3, date),
           description = COALESCE($4, description),
           payment_method = COALESCE($5, payment_method),
           tags = COALESCE($6, tags),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING id, user_id, category_id, amount, date, description, payment_method, tags, updated_at`,
      [amount, category_id, date, description, payment_method, tags, id, userId]
    );

    // Log update
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'UPDATE', 'EXPENSE', id, JSON.stringify(req.body)]
    );

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense'
    });
  } finally {
    client.release();
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify expense belongs to user
    const expenseCheck = await client.query(
      'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (expenseCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Expense not found or unauthorized'
      });
    }

    await client.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    // Log deletion
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'DELETE', 'EXPENSE', id]
    );

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  } finally {
    client.release();
  }
};

export {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
};
