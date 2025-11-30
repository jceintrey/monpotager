-- Schema for Mon Potager application

-- Create vegetables table
CREATE TABLE IF NOT EXISTS vegetables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  unit VARCHAR(10) NOT NULL CHECK (unit IN ('g', 'pcs', 'kg')),
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, variety)
);

-- Create harvests table
CREATE TABLE IF NOT EXISTS harvests (
  id SERIAL PRIMARY KEY,
  vegetable_id INTEGER REFERENCES vegetables(id) ON DELETE CASCADE,
  vegetable_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  photo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_harvests_date ON harvests(date DESC);
CREATE INDEX IF NOT EXISTS idx_harvests_vegetable_id ON harvests(vegetable_id);
CREATE INDEX IF NOT EXISTS idx_vegetables_name ON vegetables(name);

-- Insert default vegetables if table is empty
INSERT INTO vegetables (name, unit, image)
SELECT 'carottes', 'pcs', 'https://via.placeholder.com/48?text=Car'
WHERE NOT EXISTS (SELECT 1 FROM vegetables WHERE name = 'carottes' AND variety IS NULL);

INSERT INTO vegetables (name, unit, image)
SELECT 'tomates', 'g', 'https://via.placeholder.com/48?text=Tom'
WHERE NOT EXISTS (SELECT 1 FROM vegetables WHERE name = 'tomates' AND variety IS NULL);

INSERT INTO vegetables (name, unit, image)
SELECT 'haricots', 'g', 'https://via.placeholder.com/48?text=Har'
WHERE NOT EXISTS (SELECT 1 FROM vegetables WHERE name = 'haricots' AND variety IS NULL);

INSERT INTO vegetables (name, unit, image)
SELECT 'salade', 'pcs', 'https://via.placeholder.com/48?text=Sal'
WHERE NOT EXISTS (SELECT 1 FROM vegetables WHERE name = 'salade' AND variety IS NULL);

INSERT INTO vegetables (name, unit, image)
SELECT 'citrouille', 'pcs', 'https://via.placeholder.com/48?text=Cit'
WHERE NOT EXISTS (SELECT 1 FROM vegetables WHERE name = 'citrouille' AND variety IS NULL);
