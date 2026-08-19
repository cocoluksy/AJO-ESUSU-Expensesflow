import pool from '../config/database.js';

// Create a new category
const createCategory = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name, description, color, icon } = req.body;
    const userId = req.user.id;

    // Check if category with same name already exists for user
    const existingCategory = await client.query(
      'SELECT id FROM expense_categories WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, name]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Category already exists with this name'
      });
    }

    const result = await client.query(
      `INSERT INTO expense_categories (user_id, name, description, color, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, name, description, color, icon, created_at`,
      [userId, name, description || null, color || '#808080', icon || null]
    );

    // Log category creation
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'CREATE', 'CATEGORY', result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  } finally {
    client.release();
  }
};

// Get all categories for current user
const getCategories = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;

    const result = await client.query(
      `SELECT id, name, description, color, icon, created_at
       FROM expense_categories
       WHERE user_id = $1
       ORDER BY name ASC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories'
    });
  } finally {
    client.release();
  }
};

// Get single category by ID
const getCategoryById = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await client.query(
      `SELECT id, name, description, color, icon, created_at
       FROM expense_categories
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category'
    });
  } finally {
    client.release();
  }
};

// Update category
const updateCategory = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;
    const userId = req.user.id;

    // Verify category belongs to user
    const categoryCheck = await client.query(
      'SELECT id FROM expense_categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Category not found or unauthorized'
      });
    }

    // Check for duplicate name
    if (name) {
      const duplicateCheck = await client.query(
        `SELECT id FROM expense_categories 
         WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3`,
        [userId, name, id]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    const result = await client.query(
      `UPDATE expense_categories 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           icon = COALESCE($4, icon)
       WHERE id = $5 AND user_id = $6
       RETURNING id, name, description, color, icon`,
      [name, description, color, icon, id, userId]
    );

    // Log update
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'UPDATE', 'CATEGORY', id, JSON.stringify(req.body)]
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  } finally {
    client.release();
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify category belongs to user
    const categoryCheck = await client.query(
      'SELECT id FROM expense_categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Category not found or unauthorized'
      });
    }

    await client.query(
      'DELETE FROM expense_categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    // Log deletion
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'DELETE', 'CATEGORY', id]
    );

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  } finally {
    client.release();
  }
};

export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
