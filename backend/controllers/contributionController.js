import pool from '../config/database.js';

const formatNairaServer = (amount) => `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export const contributionController = {
  // Create a contribution group
  createGroup: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, description, groupType = 'public', targetAmount, savingsExpectation } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Group name is required'
        });
      }

      const query = `
        INSERT INTO contribution_groups (name, description, creator_id, group_type, target_amount, savings_expectation, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;

      const result = await pool.query(query, [
        name,
        description || '',
        userId,
        groupType,
        targetAmount || null,
        savingsExpectation || null,
        'active'
      ]);

      // Add creator as group member
      await pool.query(
        `INSERT INTO group_members (group_id, user_id, role, status)
         VALUES ($1, $2, $3, $4)`,
        [result.rows[0].id, userId, 'admin', 'active']
      );
      await pool.query(`INSERT INTO group_balances (group_id, balance, currency) VALUES ($1, 0.00, 'NGN') ON CONFLICT (group_id) DO NOTHING`, [result.rows[0].id]);

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create group'
      });
    }
  },

  // Get all public groups
  getPublicGroups: async (req, res) => {
    try {
      const query = `
        SELECT 
          cg.*,
          COALESCE(gb.balance, 0) as group_balance,
          u.first_name,
          u.last_name,
          COUNT(DISTINCT gm.id) as member_count,
          COALESCE(SUM(c.amount), 0) as total_raised
        FROM contribution_groups cg
        JOIN users u ON cg.creator_id = u.id
        LEFT JOIN group_members gm ON cg.id = gm.group_id AND gm.status = 'active'
        LEFT JOIN group_balances gb ON cg.id = gb.group_id
        LEFT JOIN contributions c ON cg.id = c.group_id AND c.status = 'completed'
        WHERE cg.group_type = 'public' AND cg.status = 'active'
        GROUP BY cg.id, u.first_name, u.last_name, gb.balance
        ORDER BY cg.created_at DESC;
      `;

      const result = await pool.query(query);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching public groups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch groups'
      });
    }
  },

  // Get user's groups
  getUserGroups: async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          cg.*,
          COALESCE(gb.balance, 0) as group_balance,
          u.first_name,
          u.last_name,
          COUNT(DISTINCT gm.id) as member_count,
          COALESCE(SUM(c.amount), 0) as total_raised,
          gm.role,
          gm.joined_at
        FROM contribution_groups cg
        JOIN users u ON cg.creator_id = u.id
        JOIN group_members gm ON cg.id = gm.group_id
        LEFT JOIN group_balances gb ON cg.id = gb.group_id
        LEFT JOIN contributions c ON cg.id = c.group_id AND c.status = 'completed'
        WHERE gm.user_id = $1 AND gm.status = 'active' AND cg.status = 'active'
        GROUP BY cg.id, u.first_name, u.last_name, gm.role, gm.joined_at, gb.balance
        ORDER BY gm.joined_at DESC;
      `;

      const result = await pool.query(query, [userId]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching user groups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your groups'
      });
    }
  },

  // Join a group
  joinGroup: async (req, res) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      // Check if already a member
            const memberCheck = await pool.query(
        `SELECT id, status FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, userId]
      );

      if (memberCheck.rows.length > 0 && memberCheck.rows[0].status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Already a member of this group'
        });
      }

      let result;
      if (memberCheck.rows.length > 0) {
        result = await pool.query(
          `UPDATE group_members SET status = 'active', joined_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
          [memberCheck.rows[0].id]
        );
      } else {
        result = await pool.query(
          `INSERT INTO group_members (group_id, user_id, role, status)
           VALUES ($1, $2, $3, $4)
           RETURNING *;`,
          [groupId, userId, 'member', 'active']
        );
      }

      // Create notification for group members
      const groupMembers = await pool.query(
        `SELECT DISTINCT user_id FROM group_members WHERE group_id = $1 AND user_id != $2`,
        [groupId, userId]
      );

      for (const member of groupMembers.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, related_user_id, related_group_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [member.user_id, 'group_join', 'New Member', 'A new member has joined the group', userId, groupId]
        );
      }

      res.status(201).json({
        success: true,
        message: 'Successfully joined the group',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error joining group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join group'
      });
    }
  },

  // Exit a group
  exitGroup: async (req, res) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const query = `
        UPDATE group_members 
        SET status = 'inactive'
        WHERE group_id = $1 AND user_id = $2
        RETURNING *;
      `;

      const result = await pool.query(query, [groupId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Not a member of this group'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Successfully exited the group',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error exiting group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to exit group'
      });
    }
   },

  // Creator/admin permanently deletes a group and all its related data
  deleteGroup: async (req, res) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;

      const groupResult = await pool.query(
        `SELECT creator_id FROM contribution_groups WHERE id = $1`,
        [groupId]
      );

      if (groupResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }

      if (groupResult.rows[0].creator_id !== userId) {
        return res.status(403).json({ success: false, message: 'Only the group creator can delete this group' });
      }

      await pool.query(`DELETE FROM contribution_groups WHERE id = $1`, [groupId]);

      res.status(200).json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({ success: false, message: 'Failed to delete group' });
    }
  },

  // Admin adds a guest member (no app account needed) — name and address only
  addGuestMember: async (req, res) => {
    try {
      const userId = req.user.id;
      const { groupId } = req.params;
      const { name, address } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Member name is required' });
      }

      const adminCheck = await pool.query(
        `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'admin' AND status = 'active'`,
        [groupId, userId]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Only the group admin can add members' });
      }

      const result = await pool.query(
        `INSERT INTO group_members (group_id, user_id, role, status, guest_name, guest_address, is_guest)
         VALUES ($1, NULL, 'member', 'active', $2, $3, TRUE)
         RETURNING *`,
        [groupId, name.trim(), address || null]
      );

      res.status(201).json({ success: true, message: 'Member added successfully', data: result.rows[0] });
    } catch (error) {
      console.error('Error adding guest member:', error);
      res.status(500).json({ success: false, message: 'Failed to add member' });
    }
  },

  // Admin removes a member (sets inactive) — works for both guest and app-user members
  removeMember: async (req, res) => {
    try {
      const userId = req.user.id;
      const { groupId, memberId } = req.params;

      const adminCheck = await pool.query(
        `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'admin' AND status = 'active'`,
        [groupId, userId]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Only the group admin can remove members' });
      }

      const result = await pool.query(
        `UPDATE group_members SET status = 'inactive' WHERE id = $1 AND group_id = $2 RETURNING *`,
        [memberId, groupId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Member not found in this group' });
      }

      res.status(200).json({ success: true, message: 'Member removed', data: result.rows[0] });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
  },

  // Admin re-adds a previously removed member
  readdMember: async (req, res) => {
    try {
      const userId = req.user.id;
      const { groupId, memberId } = req.params;

      const adminCheck = await pool.query(
        `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'admin' AND status = 'active'`,
        [groupId, userId]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Only the group admin can re-add members' });
      }

      const result = await pool.query(
        `UPDATE group_members SET status = 'active' WHERE id = $1 AND group_id = $2 RETURNING *`,
        [memberId, groupId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Member not found in this group' });
      }

      res.status(200).json({ success: true, message: 'Member re-added', data: result.rows[0] });
    } catch (error) {
      console.error('Error re-adding member:', error);
      res.status(500).json({ success: false, message: 'Failed to re-add member' });
    }
  },

  // Admin sets or updates a member's payout/collection date
  setMemberPayoutDate: async (req, res) => {
    try {
      const userId = req.user.id;
      const { groupId, memberId } = req.params;
      const { payoutDate } = req.body;

      const adminCheck = await pool.query(
        `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'admin' AND status = 'active'`,
        [groupId, userId]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Only the group admin can set payout dates' });
      }

      const result = await pool.query(
        `UPDATE group_members SET payout_date = $1 WHERE id = $2 AND group_id = $3 RETURNING *`,
        [payoutDate || null, memberId, groupId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Member not found in this group' });
      }

      res.status(200).json({ success: true, message: 'Payout date updated', data: result.rows[0] });
    } catch (error) {
      console.error('Error setting payout date:', error);
      res.status(500).json({ success: false, message: 'Failed to set payout date' });
    }
  },

  // Add contribution
    // Add contribution — any member can log a payment on behalf of a named group member (works for guests too)
  addContribution: async (req, res) => {
    try {
      const requesterId = req.user.id;
      const { groupId, memberId, amount, month, description } = req.body;

      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }
      if (!memberId) {
        return res.status(400).json({ success: false, message: 'Please select which member this payment is for' });
      }

      // The person recording this must themselves be an active member of the group
      const requesterCheck = await pool.query(
        `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'active'`,
        [groupId, requesterId]
      );
      if (requesterCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'You are not a member of this group' });
      }

      // Confirm the named member actually belongs to this group
      const memberResult = await pool.query(
        `SELECT id, user_id, is_guest, COALESCE(guest_name, (SELECT first_name FROM users WHERE id = group_members.user_id)) as display_name
         FROM group_members WHERE id = $1 AND group_id = $2 AND status = 'active'`,
        [memberId, groupId]
      );
      if (memberResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'That member was not found in this group' });
      }
      const targetMember = memberResult.rows[0];

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          `INSERT INTO group_balances (group_id, balance, currency) VALUES ($1, $2, 'NGN')
           ON CONFLICT (group_id) DO UPDATE SET balance = group_balances.balance + EXCLUDED.balance,
           last_updated = CURRENT_TIMESTAMP`,
          [groupId, parsedAmount]
        );

        const contribResult = await client.query(
          `INSERT INTO contributions (group_id, user_id, member_id, amount, contribution_month, description, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'completed')
           RETURNING *;`,
          [groupId, targetMember.user_id || null, memberId, parsedAmount, month || null, description || 'Cash contribution']
        );

        // Notify other active members that a contribution was made
        const groupMembers = await client.query(
          `SELECT DISTINCT user_id FROM group_members WHERE group_id = $1 AND user_id IS NOT NULL AND user_id != $2 AND status = 'active'`,
          [groupId, requesterId]
        );

        for (const member of groupMembers.rows) {
          await client.query(
            `INSERT INTO notifications (user_id, type, title, message, related_user_id, related_group_id, related_amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [member.user_id, 'contribution', 'New Contribution', `${targetMember.display_name || 'A member'} contributed ${formatNairaServer(parsedAmount)}`, requesterId, groupId, parsedAmount]
          );
        }

        await client.query('COMMIT');

        res.status(201).json({ success: true, message: 'Contribution recorded successfully', data: contribResult.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error adding contribution:', error);
      res.status(500).json({ success: false, message: 'Failed to add contribution' });
    }
  },

  // Notify the group admin that someone wants to be added
  requestToJoin: async (req, res) => {
    try {
      const requesterId = req.user.id;
      const { groupId } = req.params;

      const groupResult = await pool.query(`SELECT creator_id, name FROM contribution_groups WHERE id = $1`, [groupId]);
      if (groupResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
      const group = groupResult.rows[0];

      const requester = await pool.query(`SELECT first_name, last_name FROM users WHERE id = $1`, [requesterId]);
      const requesterName = `${requester.rows[0]?.first_name || ''} ${requester.rows[0]?.last_name || ''}`.trim() || 'Someone';

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_user_id, related_group_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [group.creator_id, 'join_request', 'Join Request', `${requesterName} wants to be added to ${group.name}`, requesterId, groupId]
      );

      res.status(201).json({ success: true, message: 'The group admin has been notified' });
    } catch (error) {
      console.error('Error sending join request:', error);
      res.status(500).json({ success: false, message: 'Failed to notify admin' });
    }
  },
  // Get group contributions summary
  getGroupContributionsSummary: async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      const membershipCheck = await pool.query(
        `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'active'`,
        [groupId, userId]
      );

      if (membershipCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group'
        });
      }

      const query = `
          SELECT 
          gm.id as member_id,
          gm.user_id,
          gm.is_guest,
          COALESCE(u.first_name, gm.guest_name) as first_name,
          u.last_name,
          u.email,
          gm.guest_address,
          gm.payout_date,
          gm.payout_received,
          gm.role,
          COUNT(c.id) as contribution_count,
          COALESCE(SUM(c.amount), 0) as total_contributed,
          MAX(c.created_at) as last_contribution_date
        FROM group_members gm
        LEFT JOIN users u ON gm.user_id = u.id
        LEFT JOIN contributions c ON c.member_id = gm.id AND c.status = 'completed'
        WHERE gm.group_id = $1 AND gm.status = 'active'
        GROUP BY gm.id, gm.user_id, gm.is_guest, u.first_name, u.last_name, u.email, gm.guest_name, gm.guest_address, gm.payout_date, gm.payout_received, gm.role
        ORDER BY total_contributed DESC;
      `;

      const result = await pool.query(query, [groupId]);

      // Get group details
      const groupResult = await pool.query(
        `SELECT cg.*, COALESCE(gb.balance, 0) AS group_balance FROM contribution_groups cg LEFT JOIN group_balances gb ON gb.group_id = cg.id WHERE cg.id = $1`,
        [groupId]
      );

      res.status(200).json({
        success: true,
        group: groupResult.rows[0],
        contributions: result.rows,
        totalMembers: result.rows.length,
        totalRaised: result.rows.reduce((sum, row) => sum + parseFloat(row.total_contributed || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching group contributions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch group contributions'
      });
    }
  },

  // Track contribution
  trackContribution: async (req, res) => {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          c.id,
          c.amount,
          c.contribution_date,
          c.description,
          cg.name as group_name,
          cg.id as group_id,
          c.created_at
        FROM contributions c
        JOIN contribution_groups cg ON c.group_id = cg.id
        WHERE c.user_id = $1 AND c.status = 'completed'
        ORDER BY c.created_at DESC;
      `;

      const result = await pool.query(query, [userId]);

      const stats = {
        totalContributions: result.rows.length,
        totalAmount: result.rows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0),
        contributions: result.rows
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error tracking contributions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track contributions'
      });
    }
  }
  ,

  getNotifications: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [req.user.id]
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  },

  getPersonalSavings: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM personal_savings WHERE user_id = $1', [req.user.id]);
      res.json({ success: true, data: result.rows[0] || { total_saved: 0, savings_goal: 0, description: '' } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch personal savings' });
    }
  },

  // Get personal savings history — every entry with its own date, plus grand total
  getPersonalSavingsHistory: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM personal_savings_entries WHERE user_id = $1 ORDER BY entry_date DESC, created_at DESC`,
        [req.user.id]
      );
      const grandTotal = result.rows.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
      res.json({ success: true, data: result.rows, grandTotal });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch savings history' });
    }
  },

  // Add a new personal savings entry with its own date
  addPersonalSavingsEntry: async (req, res) => {
    try {
      const { amount, description, entryDate } = req.body;
      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }

      const result = await pool.query(
        `INSERT INTO personal_savings_entries (user_id, amount, description, entry_date)
         VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE))
         RETURNING *`,
        [req.user.id, parsedAmount, description || '', entryDate || null]
      );

      res.status(201).json({ success: true, message: 'Savings entry recorded', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to record savings entry' });
    }
  },


  savePersonalSavings: async (req, res) => {
    try {
      const { totalSaved, savingsGoal, description } = req.body;
      const result = await pool.query(
        `INSERT INTO personal_savings (user_id, total_saved, savings_goal, description, last_updated)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET total_saved = EXCLUDED.total_saved,
         savings_goal = EXCLUDED.savings_goal, description = EXCLUDED.description, last_updated = CURRENT_TIMESTAMP
         RETURNING *`,
        [req.user.id, totalSaved || 0, savingsGoal || null, description || '']
      );
      res.json({ success: true, message: 'Personal savings updated', data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update personal savings' });
    }
  }
};

export default contributionController;
