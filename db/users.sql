-- Users table for authentication
USE travel_guide;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('tourist', 'guide') NOT NULL DEFAULT 'tourist',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Migration: add role column to an existing users table.
-- Only needed if the table was created before the role column was added.
-- MySQL 8 does not support `ADD COLUMN IF NOT EXISTS`, so run this once manually
-- and ignore the "duplicate column" error on subsequent runs.
-- ALTER TABLE users ADD COLUMN role ENUM('tourist', 'guide') NOT NULL DEFAULT 'tourist';
