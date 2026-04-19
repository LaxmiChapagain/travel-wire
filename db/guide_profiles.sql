-- Guide profiles: extra data shown on a travel guide's dashboard / public listing.
-- One row per user where users.role = 'guide'.
USE travel_guide;

CREATE TABLE IF NOT EXISTS guide_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  bio TEXT,
  languages VARCHAR(255),
  location VARCHAR(150),
  specialties VARCHAR(255),
  hourly_rate DECIMAL(10, 2),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
