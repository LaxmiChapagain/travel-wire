-- Admin support: expand users.role to include 'admin', add verified flag on guide_profiles.
USE travel_guide;

ALTER TABLE users MODIFY COLUMN role ENUM('tourist', 'guide', 'admin') NOT NULL DEFAULT 'tourist';

-- Run once; ignore "duplicate column" error on subsequent runs.
ALTER TABLE guide_profiles ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE;
