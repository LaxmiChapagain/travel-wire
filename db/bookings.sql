-- Reviews of guides (distinct from reviews of places) and bookings.
USE travel_guide;

CREATE TABLE IF NOT EXISTS guide_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  guide_id INT NOT NULL,
  tourist_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uniq_guide_tourist (guide_id, tourist_id),
  FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tourist_id INT NOT NULL,
  guide_id INT NOT NULL,
  booking_date DATE NOT NULL,
  hours DECIMAL(4,1) NOT NULL,
  notes TEXT,
  status ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tourist (tourist_id),
  INDEX idx_guide (guide_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
