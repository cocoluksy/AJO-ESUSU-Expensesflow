import pool from '../config/database.js';

// Creates a zero-balance wallet when needed. The upsert prevents concurrent
// dashboard requests from creating duplicate wallets or seeing a missing one.
const ensureWallet = async (db, userId) => {
  const result = await db.query(
    `INSERT INTO wallets (user_id, balance, currency)
     VALUES ($1, 0.00, 'NGN')
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING id, user_id, balance, currency, last_updated, created_at`,
    [userId]
  );
  return result.rows[0];
};

export const walletController = {
  // Get user wallet
  getWallet: async (req, res) => {
    try {
      const userId = req.user.id;

      const wallet = await ensureWallet(pool, userId);
      res.status(200).json({
        success: true,
        data: wallet
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wallet'
      });
    }
  },

  // Add money to wallet
  addMoney: async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, description } = req.body;

      const parsedAmount = parseFloat(amount); 
      if (!amount || isNaN(parsedAmount) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount'
        });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const wallet = await ensureWallet(client, userId);
        const walletId = wallet.id;

        // Update wallet balance
        await client.query(
          'UPDATE wallets SET balance = balance + $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2',
          [amount, walletId]
        );

        // Record transaction
        const txResult = await client.query(
          `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, description, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,
          [walletId, userId, 'deposit', amount, description || 'Added money', 'completed']
        );

        await client.query('COMMIT');

        res.status(201).json({
          success: true,
          message: 'Money added successfully',
          transaction: txResult.rows[0]
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error adding money:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add money'
      });
    }
  },

  // Get wallet transactions
  getTransactions: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const query = `
        SELECT wt.* 
        FROM wallet_transactions wt
        JOIN wallets w ON wt.wallet_id = w.id
        WHERE w.user_id = $1
        ORDER BY wt.created_at DESC
        LIMIT $2 OFFSET $3;
      `;

      const result = await pool.query(query, [userId, limit, offset]);

      res.status(200).json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions'
      });
    }
  },

  // Withdraw/Cash out
  cashOut: async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, payoutMethod, description } = req.body;

      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount'
        });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const wallet = await ensureWallet(client, userId);
        const lockResult = await client.query('SELECT balance FROM wallets WHERE id = $1 FOR UPDATE',             [wallet.id]);
        const currentBalance = parseFloat(lockResult.rows[0].balance);
        if (parsedAmount > currentBalance) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Insufficient balance'
          });
        }

        // Update wallet balance
        await client.query(
          'UPDATE wallets SET balance = balance - $1, last_updated = CURRENT_TIMESTAMP WHERE id = $2',
          [amount, wallet.id]
        );

        // Record transaction
        const txResult = await client.query(
          `INSERT INTO wallet_transactions (wallet_id, user_id, type, amount, description, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,
          [wallet.id, userId, 'withdrawal', amount, description || `Cash out via ${payoutMethod}`, 'completed']
        );

        await client.query('COMMIT');

        res.status(201).json({
          success: true,
          message: 'Cash out successful',
          transaction: txResult.rows[0]
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error during cash out:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process cash out'
      }); 
    }
  },

  // Monitor balance
  monitorBalance: async (req, res) => {
    try {
      const userId = req.user.id;

      await ensureWallet(pool, userId);

      const query = `
        SELECT 
          w.balance,
          w.currency,
          COUNT(wt.id) as total_transactions,
          SUM(CASE WHEN wt.type = 'deposit' THEN wt.amount ELSE 0 END) as total_deposits,
          SUM(CASE WHEN wt.type = 'withdrawal' THEN wt.amount ELSE 0 END) as total_withdrawals,
          w.last_updated
        FROM wallets w
        LEFT JOIN wallet_transactions wt ON w.id = wt.wallet_id
        WHERE w.user_id = $1
        GROUP BY w.id, w.balance, w.currency, w.last_updated;
      `;

      const result = await pool.query(query, [userId]);

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error monitoring balance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to monitor balance'
      });
    }
  }
  ,

  getPayoutSchedules: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT ps.*, cg.name AS group_name FROM payout_schedules ps
         LEFT JOIN contribution_groups cg ON cg.id = ps.group_id
         WHERE ps.user_id = $1 ORDER BY ps.payout_date ASC`,
        [req.user.id]
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch payout schedules' });
    }
  },

  createPayoutSchedule: async (req, res) => {
    try {
      const { payoutDate, amount, frequency = 'once', groupId = null } = req.body;
      const parsedAmount = Number(amount);
      if (!payoutDate || !amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: 'A valid payout date and amount are required' });
      }
      const result = await pool.query(
        `INSERT INTO payout_schedules (user_id, group_id, payout_date, amount, frequency)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.user.id, groupId || null, payoutDate, amount, frequency]
      );
      res.status(201).json({ success: true, message: 'Payout schedule created', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create payout schedule' });
    }
  }
  ,

  updatePayoutSchedule: async (req, res) => {
    try {
      const { payoutDate, amount, frequency, status } = req.body;
      const result = await pool.query(
        `UPDATE payout_schedules SET payout_date = COALESCE($1, payout_date), amount = COALESCE($2, amount),
         frequency = COALESCE($3, frequency), status = COALESCE($4, status), updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 AND user_id = $6 AND status != 'paid' RETURNING *`,
        [payoutDate || null, amount || null, frequency || null, status || null, req.params.scheduleId, req.user.id]
      );
      if (!result.rows.length) return res.status(404).json({ success: false, message: 'Payout schedule was not found or is already paid' });
      res.json({ success: true, message: 'Payout schedule updated', data: result.rows[0] });
    } catch (error) { res.status(500).json({ success: false, message: 'Failed to update payout schedule' }); }
  },

  deletePayoutSchedule: async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM payout_schedules WHERE id = $1 AND user_id = $2 AND status != 'paid' RETURNING id`, [req.params.scheduleId, req.user.id]);
      if (!result.rows.length) return res.status(404).json({ success: false, message: 'Payout schedule was not found or is already paid' });
      res.json({ success: true, message: 'Payout schedule deleted' });
    } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete payout schedule' }); }
  },

  markPayoutPaid: async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE payout_schedules SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND status = 'scheduled' RETURNING *`,
        [req.params.scheduleId, req.user.id]
      );
      if (!result.rows.length) return res.status(400).json({ success: false, message: 'Only scheduled payouts can be marked paid' });
      res.json({ success: true, message: 'Payout marked as paid', data: result.rows[0] });
    } catch (error) { res.status(500).json({ success: false, message: 'Failed to mark payout as paid' }); }
  }
};

export default walletController;
