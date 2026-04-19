-- ====================================
-- BANKING SYSTEM SECURITY SCHEMA
-- ====================================

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (id, name, description) VALUES
(1, 'ADMIN', 'System Administrator - Full control'),
(2, 'MANAGER', 'Branch Manager - Approvals & oversight'),
(3, 'EMPLOYEE', 'Bank Employee - Daily operations'),
(4, 'USER', 'Customer - Banking services') ON DUPLICATE KEY UPDATE id=id;

-- 2. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  manager_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. UPDATE USERS TABLE
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT DEFAULT 4;
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'NORMAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_by INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD INDEX idx_status (status);
ALTER TABLE users ADD INDEX idx_role_id (role_id);
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE users ADD FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- 4. UPDATE ACCOUNTS TABLE
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS blocked_by INT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMP;
ALTER TABLE accounts ADD INDEX idx_status (status);
ALTER TABLE accounts ADD FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL;

-- 5. TRANSACTION_LIMITS TABLE
CREATE TABLE IF NOT EXISTS transaction_limits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  account_type VARCHAR(50) NOT NULL UNIQUE,
  daily_limit DECIMAL(15,2) NOT NULL,
  per_transaction_limit DECIMAL(15,2) NOT NULL,
  otp_threshold DECIMAL(15,2) NOT NULL,
  approval_threshold DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO transaction_limits (account_type, daily_limit, per_transaction_limit, otp_threshold, approval_threshold) VALUES
('NORMAL', 100000, 50000, 10000, 200000),
('PREMIUM', 500000, 200000, 50000, 500000) ON DUPLICATE KEY UPDATE id=id;

-- 6. UPDATE TRANSACTIONS TABLE
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMP;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS requires_otp BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS daily_total_before DECIMAL(15,2);
ALTER TABLE transactions ADD INDEX idx_status (status);
ALTER TABLE transactions ADD INDEX idx_created_at (created_at);

-- 7. APPROVALS TABLE
CREATE TABLE IF NOT EXISTS approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  requested_by INT NOT NULL,
  assigned_to INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2),
  description TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  rejection_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INT,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at),
  INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. OTP TABLE
CREATE TABLE IF NOT EXISTS otps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  otp_type VARCHAR(50) DEFAULT 'TRANSACTION',
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  attempt_count INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_otp (user_id, is_used),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  status VARCHAR(50) DEFAULT 'SUCCESS',
  error_message VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. SUSPICIOUS_ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  device_info VARCHAR(255),
  action_taken VARCHAR(50) DEFAULT 'FLAGGED',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. NOTIFICATIONS TABLE (NEW)
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(100),
  message TEXT,
  reference_id INT,
  reference_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. SESSIONS TABLE (NEW)
CREATE TABLE IF NOT EXISTS sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ip_address VARCHAR(45),
  device_info VARCHAR(255),
  user_agent VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP,
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_login_at (login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create stored procedure for auto-reject expired approvals
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS reject_expired_approvals()
BEGIN
  UPDATE approvals
  SET status = 'REJECTED', rejection_reason = 'Auto-rejected: 24 hour timeout'
  WHERE status = 'PENDING' AND expires_at < NOW();
END//
DELIMITER ;
