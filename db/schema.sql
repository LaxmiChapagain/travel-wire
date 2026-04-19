-- Travel Guide database schema and sample data
CREATE DATABASE IF NOT EXISTS travel_guide CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travel_guide;

CREATE TABLE IF NOT EXISTS places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  category VARCHAR(100),
  image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO places (name, description, city, country, lat, lng, category, image) VALUES
('Eiffel Tower', 'Iconic wrought-iron tower in Paris', 'Paris', 'France', 48.858370, 2.294481, 'landmark', NULL),
('Colosseum', 'Ancient amphitheatre in Rome', 'Rome', 'Italy', 41.890251, 12.492373, 'historic', NULL),
('Central Park', 'Large public park in NYC', 'New York', 'USA', 40.782865, -73.965355, 'park', NULL);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id INT NOT NULL,
  author VARCHAR(150) DEFAULT 'Anonymous',
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

-- Example reviews
INSERT INTO reviews (place_id, author, rating, comment) VALUES
(1, 'Alice', 5, 'Breathtaking views — a must-see!'),
(2, 'Marco', 4, 'Impressive structure, lines were long but worth it.'),
(3, 'John', 5, 'Great for a picnic and relaxing.');
