-- Initial database schema for MonPotager
-- Tables: vegetables, harvests

-- =======================
-- VEGETABLES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS vegetables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  unit VARCHAR(10) NOT NULL CHECK (unit IN ('g', 'kg', 'pcs')),
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, variety)
);

CREATE INDEX idx_vegetables_name ON vegetables(name);

-- =======================
-- HARVESTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS harvests (
  id SERIAL PRIMARY KEY,
  vegetable_id INTEGER REFERENCES vegetables(id) ON DELETE SET NULL,
  vegetable_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(10) NOT NULL CHECK (unit IN ('g', 'kg', 'pcs')),
  date DATE NOT NULL,
  notes TEXT,
  photo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_harvests_date ON harvests(date DESC);
CREATE INDEX idx_harvests_vegetable_name ON harvests(vegetable_name);
CREATE INDEX idx_harvests_vegetable_id ON harvests(vegetable_id);
