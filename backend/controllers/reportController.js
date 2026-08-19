import pool from '../config/database.js';

// Get expense summary by category
const getCategoryBreakdown = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        COUNT(e.id) as expense_count,
        SUM(e.amount) as total_amount,
        AVG(e.amount) as average_amount,
        MIN(e.amount) as min_amount,
        MAX(e.amount) as max_amount
      FROM expense_categories c
      LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

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

    query += `
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total_amount DESC
    `;

    const result = await client.query(query, params);

    // Calculate total
    const total = result.rows.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0);

    // Add percentage
    const data = result.rows.map(row => ({
      ...row,
      total_amount: parseFloat(row.total_amount) || 0,
      percentage: total > 0 ? ((parseFloat(row.total_amount) || 0) / total * 100).toFixed(2) : 0
    }));

    res.status(200).json({
      success: true,
      total: total.toFixed(2),
      data
    });
  } catch (error) {
    console.error('Get category breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category breakdown'
    });
  } finally {
    client.release();
  }
};

// Get daily expenses trend
const getDailyTrend = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        e.date,
        COUNT(e.id) as transaction_count,
        SUM(e.amount) as daily_total,
        AVG(e.amount) as average_amount
      FROM expenses e
      WHERE e.user_id = $1
    `;

    const params = [userId];
    let paramCount = 1;

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

    query += `
      GROUP BY e.date
      ORDER BY e.date ASC
    `;

    const result = await client.query(query, params);

    const data = result.rows.map(row => ({
      date: row.date,
      transaction_count: row.transaction_count,
      daily_total: parseFloat(row.daily_total),
      average_amount: parseFloat(row.average_amount)
    }));

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get daily trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve daily trend'
    });
  } finally {
    client.release();
  }
};

// Get monthly summary
const getMonthlySummary = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const result = await client.query(
      `
        SELECT 
          EXTRACT(MONTH FROM e.date)::INT as month,
          TO_CHAR(e.date, 'Month') as month_name,
          COUNT(e.id) as transaction_count,
          SUM(e.amount) as total_amount,
          MIN(e.amount) as min_amount,
          MAX(e.amount) as max_amount
        FROM expenses e
        WHERE e.user_id = $1 
          AND EXTRACT(YEAR FROM e.date) = $2
        GROUP BY EXTRACT(MONTH FROM e.date), TO_CHAR(e.date, 'Month')
        ORDER BY month ASC
      `,
      [userId, currentYear]
    );

    const data = result.rows.map(row => ({
      month: row.month,
      month_name: row.month_name.trim(),
      transaction_count: row.transaction_count,
      total_amount: parseFloat(row.total_amount),
      min_amount: parseFloat(row.min_amount),
      max_amount: parseFloat(row.max_amount)
    }));

    const yearTotal = data.reduce((sum, row) => sum + row.total_amount, 0);

    res.status(200).json({
      success: true,
      year: currentYear,
      year_total: yearTotal.toFixed(2),
      data
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly summary'
    });
  } finally {
    client.release();
  }
};

// Get comprehensive financial report
const getFinancialReport = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    // Get total expenses
    let expenseQuery = 'SELECT SUM(amount) as total FROM expenses WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (start_date) {
      paramCount++;
      expenseQuery += ` AND date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      expenseQuery += ` AND date <= $${paramCount}`;
      params.push(end_date);
    }

    const expenseResult = await client.query(expenseQuery, params);
    const totalExpenses = parseFloat(expenseResult.rows[0].total) || 0;

    // Get category breakdown
    let categoryQuery = `
      SELECT 
        c.name,
        COUNT(e.id) as count,
        SUM(e.amount) as amount
      FROM expense_categories c
      LEFT JOIN expenses e ON c.id = e.category_id
    `;

    const categoryParams = [userId];
    let categoryParamCount = 1;

    if (start_date) {
      categoryParamCount++;
      categoryQuery += ` AND e.date >= $${categoryParamCount}`;
      categoryParams.push(start_date);
    }

    if (end_date) {
      categoryParamCount++;
      categoryQuery += ` AND e.date <= $${categoryParamCount}`;
      categoryParams.push(end_date);
    }

    categoryQuery += `
      WHERE c.user_id = $1
      GROUP BY c.id, c.name
      ORDER BY amount DESC
    `;

    const categoryResult = await client.query(categoryQuery, categoryParams);

    // Get payment method breakdown
    const paymentQuery = `
      SELECT 
        COALESCE(payment_method, 'Not Specified') as method,
        COUNT(id) as count,
        SUM(amount) as amount
      FROM expenses
      WHERE user_id = $1
    ` + (start_date ? ` AND date >= $2` : '') + 
        (end_date ? ` AND date <= $${start_date ? 3 : 2}` : '') + `
      GROUP BY payment_method
      ORDER BY amount DESC
    `;

    const paymentParams = [userId];
    if (start_date) paymentParams.push(start_date);
    if (end_date) paymentParams.push(end_date);

    const paymentResult = await client.query(paymentQuery, paymentParams);

    // Get transaction statistics
    const statsQuery = `
      SELECT 
        COUNT(id) as total_transactions,
        AVG(amount) as average_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount,
        COUNT(DISTINCT date) as days_with_expenses
      FROM expenses
      WHERE user_id = $1
    ` + (start_date ? ` AND date >= $2` : '') + 
        (end_date ? ` AND date <= $${start_date ? 3 : 2}` : '');

    const statsParams = [userId];
    if (start_date) statsParams.push(start_date);
    if (end_date) statsParams.push(end_date);

    const statsResult = await client.query(statsQuery, statsParams);
    const stats = statsResult.rows[0];

    res.status(200).json({
      success: true,
      report: {
        period: {
          start_date,
          end_date
        },
        summary: {
          total_expenses: totalExpenses.toFixed(2),
          total_transactions: stats.total_transactions,
          average_transaction: parseFloat(stats.average_amount || 0).toFixed(2),
          min_transaction: parseFloat(stats.min_amount || 0).toFixed(2),
          max_transaction: parseFloat(stats.max_amount || 0).toFixed(2),
          days_with_expenses: stats.days_with_expenses
        },
        categories: categoryResult.rows.map(row => ({
          name: row.name,
          count: row.count,
          amount: parseFloat(row.amount || 0).toFixed(2),
          percentage: totalExpenses > 0 ? ((parseFloat(row.amount || 0) / totalExpenses) * 100).toFixed(2) : 0
        })),
        payment_methods: paymentResult.rows.map(row => ({
          method: row.method,
          count: row.count,
          amount: parseFloat(row.amount || 0).toFixed(2)
        }))
      }
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve financial report'
    });
  } finally {
    client.release();
  }
};

export {
  getCategoryBreakdown,
  getDailyTrend,
  getMonthlySummary,
  getFinancialReport
};
