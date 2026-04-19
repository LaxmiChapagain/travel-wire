-- Travel Guide: Countries & expanded places data
-- Run this AFTER schema.sql has been imported

USE travel_guide;

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  hero_tagline VARCHAR(255),
  flag_emoji VARCHAR(10),
  currency VARCHAR(50),
  language VARCHAR(100),
  best_season VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add country_code and highlights columns to places
-- (MySQL 8 doesn't support ADD COLUMN IF NOT EXISTS, so we handle errors)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='travel_guide' AND TABLE_NAME='places' AND COLUMN_NAME='country_code');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE places ADD COLUMN country_code VARCHAR(2) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='travel_guide' AND TABLE_NAME='places' AND COLUMN_NAME='highlights');
SET @sql2 = IF(@col_exists2 = 0, 'ALTER TABLE places ADD COLUMN highlights TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Insert countries
INSERT INTO countries (code, name, description, hero_tagline, flag_emoji, currency, language, best_season) VALUES
('NP', 'Nepal', 'Nestled in the heart of the Himalayas, Nepal is a land of towering peaks, ancient temples, and warm hospitality. From the world''s highest mountain to lush jungle lowlands, this small nation packs extraordinary diversity into its borders.', 'Where the Mountains Touch the Sky', '🇳🇵', 'Nepalese Rupee (NPR)', 'Nepali', 'October – December (Autumn)'),
('US', 'United States', 'From coast to coast, the United States offers an incredible tapestry of landscapes, cultures, and experiences. Explore sprawling national parks, iconic city skylines, and everything in between across this vast and diverse nation.', 'The Land of Endless Discovery', '🇺🇸', 'US Dollar (USD)', 'English', 'Varies by Region'),
('FR', 'France', 'The epitome of art, culture, and gastronomy, France enchants visitors with its romantic cities, sun-kissed countryside, and world-renowned cuisine. Every cobblestone street tells a story spanning centuries of history.', 'Art, Culture & Joie de Vivre', '🇫🇷', 'Euro (EUR)', 'French', 'April – October (Spring/Summer)')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Clear existing places and re-insert with country_code
DELETE FROM reviews;
DELETE FROM places;

-- ============ NEPAL ============
INSERT INTO places (name, description, city, country, country_code, lat, lng, category, highlights) VALUES
('Mount Everest Base Camp', 'The legendary trek to the base of the world''s highest peak at 5,364m. A bucket-list adventure through Sherpa villages, ancient monasteries, and breathtaking Himalayan panoramas.', 'Solukhumbu', 'Nepal', 'NP', 27.9881, 86.9250, 'adventure', 'Stunning Himalayan views • Sherpa culture • Kala Patthar viewpoint • Sagarmatha National Park'),
('Pashupatinath Temple', 'One of the most sacred Hindu temples in the world, this UNESCO World Heritage Site on the banks of the Bagmati River is a sprawling complex of temples, ashrams, and cremation ghats.', 'Kathmandu', 'Nepal', 'NP', 27.7109, 85.3487, 'historic', 'Hindu pilgrimage • Cremation ceremonies • Sadhu holy men • Ancient architecture'),
('Boudhanath Stupa', 'One of the largest spherical stupas in the world, Boudhanath is the center of Tibetan Buddhism in Nepal. The all-seeing eyes of Buddha gaze out from every side of the golden tower.', 'Kathmandu', 'Nepal', 'NP', 27.7215, 85.3620, 'landmark', 'Tibetan Buddhism • Prayer wheels • Monastery visits • Sunset views'),
('Chitwan National Park', 'A UNESCO World Heritage Site and one of Asia''s best wildlife-viewing destinations. Home to one-horned rhinos, Bengal tigers, and over 500 species of birds in lush subtropical jungle.', 'Chitwan', 'Nepal', 'NP', 27.5000, 84.3333, 'nature', 'One-horned rhinos • Bengal tigers • Jungle safaris • Canoe rides'),
('Phewa Lake & Pokhara', 'The jewel of Nepal''s lake city, Phewa Lake reflects the majestic Annapurna range in its tranquil waters. Pokhara is the gateway to some of the world''s most famous trekking routes.', 'Pokhara', 'Nepal', 'NP', 28.2096, 83.9856, 'nature', 'Annapurna views • Boating • Paragliding • World Peace Pagoda'),
('Lumbini', 'The birthplace of Lord Buddha and a UNESCO World Heritage Site. This sacred pilgrimage destination features monasteries built by countries from around the world and the ancient Mayadevi Temple.', 'Rupandehi', 'Nepal', 'NP', 27.4833, 83.2833, 'historic', 'Birthplace of Buddha • Mayadevi Temple • International monasteries • Sacred garden');

-- ============ USA ============
INSERT INTO places (name, description, city, country, country_code, lat, lng, category, highlights) VALUES
('Grand Canyon', 'One of the most spectacular natural wonders on Earth. The Colorado River has carved this immense canyon over millions of years, revealing layers of colorful rock that tell two billion years of geological history.', 'Arizona', 'USA', 'US', 36.1069, -112.1129, 'nature', 'South Rim views • Hiking trails • Colorado River rafting • Sunrise/sunset'),
('Statue of Liberty', 'A universal symbol of freedom and democracy, Lady Liberty has welcomed millions to American shores since 1886. The crown offers unrivaled views of New York Harbor and the Manhattan skyline.', 'New York', 'USA', 'US', 40.6892, -74.0445, 'landmark', 'Crown access • Ellis Island • Harbor views • Museum exhibits'),
('Golden Gate Bridge', 'San Francisco''s iconic Art Deco suspension bridge, painted in its signature International Orange. Walk or bike across for stunning views of the bay, Alcatraz, and the city skyline.', 'San Francisco', 'USA', 'US', 37.8199, -122.4783, 'landmark', 'Walking/biking across • Fort Point • Battery Spencer views • Fog photography'),
('Yellowstone National Park', 'America''s first national park spans three states and features the world''s largest collection of geysers, including Old Faithful. A wilderness paradise of hot springs, canyons, and diverse wildlife.', 'Wyoming', 'USA', 'US', 44.4280, -110.5885, 'nature', 'Old Faithful geyser • Grand Prismatic Spring • Wildlife watching • Canyon views'),
('Times Square', 'The dazzling crossroads of the world, Times Square pulses with energy 24/7. Towering LED billboards, Broadway theaters, world-class dining, and the iconic New Year''s Eve celebration make this a must-visit destination.', 'New York', 'USA', 'US', 40.7580, -73.9855, 'landmark', 'Broadway shows • LED billboards • Street performers • Dining & shopping'),
('Central Park', 'An 843-acre urban oasis in the heart of Manhattan. This masterpiece of landscape architecture offers lakes, gardens, walking trails, and iconic landmarks — a peaceful escape from the city that never sleeps.', 'New York', 'USA', 'US', 40.7829, -73.9654, 'park', 'Bethesda Fountain • The Mall • Bow Bridge • Strawberry Fields');

-- ============ FRANCE ============
INSERT INTO places (name, description, city, country, country_code, lat, lng, category, highlights) VALUES
('Eiffel Tower', 'The undisputed icon of Paris and one of the most recognizable structures on Earth. Built for the 1889 World''s Fair, this iron lattice masterpiece offers breathtaking panoramic views from its three observation levels.', 'Paris', 'France', 'FR', 48.8584, 2.2945, 'landmark', 'Three observation levels • Night light show • Seine River views • Fine dining'),
('Louvre Museum', 'The world''s largest and most visited art museum, housed in a historic palace. Home to the Mona Lisa, Venus de Milo, and over 380,000 objects spanning 11,000 years of human civilization.', 'Paris', 'France', 'FR', 48.8606, 2.3376, 'historic', 'Mona Lisa • Glass pyramid • Egyptian antiquities • French Crown Jewels'),
('Mont Saint-Michel', 'A medieval island commune rising dramatically from the tidal flats of Normandy. This UNESCO World Heritage Site features a stunning Gothic abbey perched atop a rocky island, accessible by a modern bridge.', 'Normandy', 'France', 'FR', 48.6361, -1.5115, 'historic', 'Gothic abbey • Tidal island • Medieval streets • Bay walks'),
('Palace of Versailles', 'The opulent royal residence that epitomizes French grandeur. Explore the Hall of Mirrors, the King''s Grand Apartments, and 800 hectares of meticulously manicured gardens and fountains.', 'Versailles', 'France', 'FR', 48.8049, 2.1204, 'landmark', 'Hall of Mirrors • Royal gardens • Grand Trianon • Musical fountains'),
('French Riviera (Nice)', 'The glamorous Côte d''Azur coastline where turquoise waters meet pastel-colored buildings and palm-lined promenades. Nice blends Mediterranean charm, world-class art museums, and vibrant nightlife.', 'Nice', 'France', 'FR', 43.7102, 7.2620, 'nature', 'Promenade des Anglais • Old Town • Beach clubs • Art museums'),
('Château de Chambord', 'The largest château in the Loire Valley, Chambord is a masterpiece of French Renaissance architecture. Its famous double-helix staircase, attributed to Leonardo da Vinci, is an engineering marvel.', 'Loire Valley', 'France', 'FR', 47.6161, 1.5170, 'historic', 'Da Vinci staircase • French Renaissance • 440 rooms • Royal hunting grounds');

-- ============ SAMPLE REVIEWS ============
INSERT INTO reviews (place_id, author, rating, comment) VALUES
((SELECT id FROM places WHERE name='Mount Everest Base Camp'), 'Sarah K.', 5, 'The most incredible trek of my life. The views of Everest from Kala Patthar at sunrise brought me to tears.'),
((SELECT id FROM places WHERE name='Mount Everest Base Camp'), 'Raj P.', 4, 'Challenging but absolutely worth it. Take your time to acclimatize and enjoy the Sherpa hospitality.'),
((SELECT id FROM places WHERE name='Pashupatinath Temple'), 'Anita M.', 5, 'A deeply spiritual experience. The evening aarti ceremony by the river is unforgettable.'),
((SELECT id FROM places WHERE name='Phewa Lake & Pokhara'), 'James W.', 5, 'Pokhara is paradise on earth. Watching the sunrise over the Annapurna range from the lake was magical.'),
((SELECT id FROM places WHERE name='Grand Canyon'), 'Michelle R.', 5, 'No photo can capture the sheer scale of this place. The South Rim trail at sunset is pure magic.'),
((SELECT id FROM places WHERE name='Grand Canyon'), 'David L.', 5, 'Hiked down to the Colorado River — exhausting but one of the best things I have ever done.'),
((SELECT id FROM places WHERE name='Statue of Liberty'), 'Emma T.', 4, 'Book crown tickets months in advance! The views from the top are spectacular.'),
((SELECT id FROM places WHERE name='Golden Gate Bridge'), 'Carlos G.', 5, 'Biked across the bridge on a clear day. The views of Alcatraz and the city are incredible.'),
((SELECT id FROM places WHERE name='Eiffel Tower'), 'Alice', 5, 'Breathtaking views — a must-see! The night light show is absolutely magical.'),
((SELECT id FROM places WHERE name='Louvre Museum'), 'Marco', 4, 'Plan to spend at least a full day. The Mona Lisa is smaller than expected but the rest of the museum is extraordinary.'),
((SELECT id FROM places WHERE name='Mont Saint-Michel'), 'Sophie L.', 5, 'Feels like stepping into a fairytale. Visit early morning to beat the crowds and watch the tides.'),
((SELECT id FROM places WHERE name='Palace of Versailles'), 'Tom H.', 5, 'The Hall of Mirrors took my breath away. The gardens are equally impressive — allow a full day.'),
((SELECT id FROM places WHERE name='Boudhanath Stupa'), 'Lisa M.', 5, 'The peaceful energy here is incredible. Walking around the stupa at sunset with prayer flags is a highlight of Nepal.'),
((SELECT id FROM places WHERE name='Central Park'), 'John', 5, 'Great for a picnic and relaxing. A beautiful green escape in the middle of Manhattan.');
