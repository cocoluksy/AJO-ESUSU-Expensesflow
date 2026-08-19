import pool from '../config/database.js';

const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        business_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create expense categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      );
    `);

    // Create expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE SET NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description VARCHAR(500),
        date DATE NOT NULL,
        payment_method VARCHAR(50),
        tags VARCHAR(255),
        receipt_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (amount > 0)
      );
    `);

    // Create expense attachments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_attachments (
        id SERIAL PRIMARY KEY,
        expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create audit log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        changes JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create wallets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        currency VARCHAR(3) DEFAULT 'NGN',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Apply Nigerian Naira as the standard currency for both new and existing wallets.
    await pool.query(`ALTER TABLE wallets ALTER COLUMN currency SET DEFAULT 'NGN';`);
    await pool.query(`UPDATE wallets SET currency = 'NGN' WHERE currency IS NULL OR currency = 'USD';`);

    // Create wallet transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description VARCHAR(500),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create contribution groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contribution_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_type VARCHAR(50) DEFAULT 'public',
        target_amount DECIMAL(15, 2),
        savings_expectation VARCHAR(500),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create group members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES contribution_groups(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role VARCHAR(50) DEFAULT 'member',
        status VARCHAR(50) DEFAULT 'active',
        UNIQUE(group_id, user_id)
      );
    `);

    // Create contributions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contributions (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES contribution_groups(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        contribution_date DATE DEFAULT CURRENT_DATE,
        description VARCHAR(500),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Holds funds paid into each Ajo/Esusu group separately from member wallets.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_balances (
        group_id INTEGER PRIMARY KEY REFERENCES contribution_groups(id) ON DELETE CASCADE,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create personal savings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personal_savings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        total_saved DECIMAL(15, 2) DEFAULT 0.00,
        savings_goal DECIMAL(15, 2),
        description TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create payout schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payout_schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES contribution_groups(id) ON DELETE CASCADE,
        payout_date DATE NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        frequency VARCHAR(50),
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Safe migrations for databases created before group payouts were added.
    await pool.query(`ALTER TABLE payout_schedules ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;`);
    
    // Allow group members to be guests (no app account) — name/address only.
    await pool.query(`ALTER TABLE group_members ALTER COLUMN user_id DROP NOT NULL;`);
    await pool.query(`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS guest_address VARCHAR(500);`);
    await pool.query(`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;`);

    // Each member can have their own scheduled payout/collection date within a group.
    await pool.query(`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS payout_date DATE;`);
    await pool.query(`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS payout_received BOOLEAN DEFAULT FALSE;`);

    // Logs each personal savings entry separately (with its own date) instead of one running total.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personal_savings_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        description VARCHAR(500),
        entry_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_personal_savings_entries_user_id ON personal_savings_entries(user_id);`);

    // Link contributions to a specific group member (works for guests too, who have no user_id)
    await pool.query(`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS member_id INTEGER REFERENCES group_members(id) ON DELETE SET NULL;`);
    await pool.query(`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS contribution_month VARCHAR(20);`);
    await pool.query(`ALTER TABLE contributions ALTER COLUMN user_id DROP NOT NULL;`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);`);

    // Create notifications/flash messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        message TEXT,
        related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        related_group_id INTEGER REFERENCES contribution_groups(id) ON DELETE SET NULL,
        related_amount DECIMAL(15, 2),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
      CREATE INDEX IF NOT EXISTS idx_contributions_group_id ON contributions(group_id);
      CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
      CREATE INDEX IF NOT EXISTS idx_payout_schedules_user_id ON payout_schedules(user_id);
      CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
      CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default initializeDatabase;
