-- ============================================
-- MIGRATION: Calendar Feature for MonPotager
-- Description: Adds sowing and harvest calendar functionality
-- Date: 2025-12-01
-- ============================================

-- ============================================
-- TABLE 1: Climates / Geographic Zones
-- ============================================
CREATE TABLE IF NOT EXISTS climates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO climates (name, description) VALUES
  ('tempéré', 'Climat tempéré océanique (Paris, Bretagne, Nord, Ouest)'),
  ('méditerranéen', 'Climat méditerranéen (Sud de la France, Provence, Côte d''Azur)'),
  ('continental', 'Climat continental (Est de la France, Alsace, Bourgogne)'),
  ('montagnard', 'Climat montagnard (Alpes, Pyrénées, Massif Central)')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TABLE 2: Sowing Types
-- ============================================
CREATE TABLE IF NOT EXISTS sowing_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sowing_types (code, name, description, icon) VALUES
  ('indoor_pots', 'Semis intérieur en godets', 'Semis sous abri chauffé ou en intérieur dans des godets', '🏠'),
  ('outdoor_pots', 'Semis extérieur en godets', 'Semis en extérieur sous châssis ou serre froide dans des godets', '🪴'),
  ('direct_soil', 'Semis en pleine terre', 'Semis direct en pleine terre au potager', '🌱'),
  ('transplant', 'Plantation/Repiquage', 'Plantation de plants achetés ou repiquage de semis', '🌿')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- TABLE 3: Calendar Defaults (Reference Data)
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_defaults (
  id SERIAL PRIMARY KEY,
  vegetable_name VARCHAR(255) NOT NULL,
  climate_id INTEGER REFERENCES climates(id) ON DELETE CASCADE,
  sowing_type_id INTEGER REFERENCES sowing_types(id) ON DELETE CASCADE,

  -- Sowing period (decades: 1-36 for 12 months * 3 decades)
  -- January: 1-3, February: 4-6, March: 7-9, etc.
  sowing_start_decade SMALLINT NOT NULL CHECK (sowing_start_decade BETWEEN 1 AND 36),
  sowing_end_decade SMALLINT NOT NULL CHECK (sowing_end_decade BETWEEN 1 AND 36),

  -- Associated harvest period
  harvest_start_decade SMALLINT NOT NULL CHECK (harvest_start_decade BETWEEN 1 AND 36),
  harvest_end_decade SMALLINT NOT NULL CHECK (harvest_end_decade BETWEEN 1 AND 36),

  -- Growth duration (in days) - for automatic calculation
  growth_duration_days SMALLINT,

  -- Metadata
  notes TEXT,
  source VARCHAR(255), -- Reference source for data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_calendar_entry UNIQUE(vegetable_name, climate_id, sowing_type_id, sowing_start_decade)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_calendar_defaults_vegetable ON calendar_defaults(vegetable_name);
CREATE INDEX IF NOT EXISTS idx_calendar_defaults_climate ON calendar_defaults(climate_id);
CREATE INDEX IF NOT EXISTS idx_calendar_defaults_sowing_period ON calendar_defaults(sowing_start_decade, sowing_end_decade);

-- ============================================
-- TABLE 4: User Settings
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL DEFAULT 'default_user',
  climate_id INTEGER REFERENCES climates(id) ON DELETE SET NULL,
  preferences JSONB DEFAULT '{}', -- For future extensibility
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Default user with temperate climate
INSERT INTO user_settings (user_id, climate_id) VALUES ('default_user', 1)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- TABLE 5: User Calendar Overrides
-- ============================================
CREATE TABLE IF NOT EXISTS user_calendar_overrides (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL DEFAULT 'default_user',
  vegetable_name VARCHAR(255) NOT NULL,
  sowing_type_id INTEGER REFERENCES sowing_types(id) ON DELETE CASCADE,

  -- Custom dates (can override specific fields)
  sowing_start_decade SMALLINT CHECK (sowing_start_decade IS NULL OR (sowing_start_decade BETWEEN 1 AND 36)),
  sowing_end_decade SMALLINT CHECK (sowing_end_decade IS NULL OR (sowing_end_decade BETWEEN 1 AND 36)),
  harvest_start_decade SMALLINT CHECK (harvest_start_decade IS NULL OR (harvest_start_decade BETWEEN 1 AND 36)),
  harvest_end_decade SMALLINT CHECK (harvest_end_decade IS NULL OR (harvest_end_decade BETWEEN 1 AND 36)),

  growth_duration_days SMALLINT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE, -- Allow user to hide entries

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_user_calendar_entry UNIQUE(user_id, vegetable_name, sowing_type_id, sowing_start_decade)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_overrides_vegetable ON user_calendar_overrides(vegetable_name);
CREATE INDEX IF NOT EXISTS idx_user_overrides_user ON user_calendar_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_overrides_active ON user_calendar_overrides(is_active) WHERE is_active = TRUE;

-- ============================================
-- SEED DATA: Calendar defaults for temperate climate
-- 15 common vegetables with realistic data
-- Source: Rustica, Gerbeaud, and experienced gardeners
-- ============================================

-- Helper: Get IDs
DO $$
DECLARE
  temperate_id INTEGER;
  indoor_id INTEGER;
  outdoor_id INTEGER;
  direct_id INTEGER;
  transplant_id INTEGER;
BEGIN
  SELECT id INTO temperate_id FROM climates WHERE name = 'tempéré';
  SELECT id INTO indoor_id FROM sowing_types WHERE code = 'indoor_pots';
  SELECT id INTO outdoor_id FROM sowing_types WHERE code = 'outdoor_pots';
  SELECT id INTO direct_id FROM sowing_types WHERE code = 'direct_soil';
  SELECT id INTO transplant_id FROM sowing_types WHERE code = 'transplant';

-- ============================================
-- 1. TOMATES (Tomatoes)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Tomates', temperate_id, indoor_id, 7, 10, 19, 27, 90, 'Semis au chaud (18-20°C). Repiquer après les saints de glace.', 'Rustica'),
  ('Tomates', temperate_id, transplant_id, 14, 16, 19, 27, 75, 'Plantation des plants après les saints de glace (mi-mai).', 'Rustica');

-- ============================================
-- 2. CAROTTES (Carrots)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Carottes', temperate_id, direct_id, 7, 18, 16, 30, 90, 'Semis échelonnés tous les 15 jours. Sol léger et profond.', 'Gerbeaud');

-- ============================================
-- 3. SALADES / LAITUES (Lettuce)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Salades', temperate_id, outdoor_id, 7, 24, 13, 30, 60, 'Semis échelonnés. Protéger les premiers semis.', 'Rustica'),
  ('Salades', temperate_id, direct_id, 10, 27, 16, 33, 50, 'Semis direct possible dès avril.', 'Gerbeaud');

-- ============================================
-- 4. COURGETTES (Zucchini)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Courgettes', temperate_id, indoor_id, 10, 13, 18, 27, 60, 'Semis au chaud en godets. Craint le gel.', 'Rustica'),
  ('Courgettes', temperate_id, direct_id, 14, 16, 19, 27, 70, 'Semis en pleine terre après les saints de glace.', 'Gerbeaud');

-- ============================================
-- 5. HARICOTS VERTS (Green Beans)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Haricots verts', temperate_id, direct_id, 13, 21, 19, 27, 60, 'Semis échelonnés. Sol réchauffé (>12°C).', 'Rustica');

-- ============================================
-- 6. RADIS (Radishes)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Radis', temperate_id, direct_id, 7, 27, 10, 30, 25, 'Culture rapide. Semis tous les 15 jours pour récolte continue.', 'Gerbeaud');

-- ============================================
-- 7. POIREAUX (Leeks)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Poireaux', temperate_id, outdoor_id, 7, 13, 25, 9, 150, 'Semis en pépinière. Repiquer en juin-juillet.', 'Rustica'),
  ('Poireaux', temperate_id, transplant_id, 16, 21, 30, 12, 120, 'Plantation des plants repiqués.', 'Gerbeaud');

-- ============================================
-- 8. ÉPINARDS (Spinach)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_during_days, notes, source) VALUES
  ('Épinards', temperate_id, direct_id, 7, 15, 13, 21, 60, 'Semis de printemps. Préfère la fraîcheur.', 'Rustica'),
  ('Épinards', temperate_id, direct_id, 24, 30, 33, 9, 90, 'Semis d''automne pour récolte hivernale.', 'Gerbeaud');

-- ============================================
-- 9. BETTERAVES (Beets)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Betteraves', temperate_id, direct_id, 10, 18, 19, 30, 90, 'Semis échelonnés. Sol profond et frais.', 'Gerbeaud');

-- ============================================
-- 10. PETITS POIS (Peas)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Petits pois', temperate_id, direct_id, 7, 13, 16, 21, 90, 'Semis précoce dès février-mars. Variétés à grain rond.', 'Rustica'),
  ('Petits pois', temperate_id, direct_id, 24, 27, 33, 6, 90, 'Semis d''automne pour récolte de printemps (variétés résistantes).', 'Gerbeaud');

-- ============================================
-- 11. POIVRONS (Peppers)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Poivrons', temperate_id, indoor_id, 7, 10, 21, 27, 120, 'Semis au chaud (25°C). Culture longue. Besoin de chaleur.', 'Rustica'),
  ('Poivrons', temperate_id, transplant_id, 14, 16, 21, 27, 90, 'Plantation après les saints de glace.', 'Gerbeaud');

-- ============================================
-- 12. AUBERGINES (Eggplants)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Aubergines', temperate_id, indoor_id, 7, 10, 21, 27, 120, 'Semis au chaud (20-25°C). Exigeant en chaleur.', 'Rustica'),
  ('Aubergines', temperate_id, transplant_id, 14, 16, 21, 27, 90, 'Plantation en sol chaud et riche.', 'Gerbeaud');

-- ============================================
-- 13. CONCOMBRES (Cucumbers)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Concombres', temperate_id, indoor_id, 10, 13, 18, 27, 60, 'Semis au chaud en godets. Craint le froid.', 'Rustica'),
  ('Concombres', temperate_id, direct_id, 14, 16, 19, 27, 70, 'Semis direct possible en mai.', 'Gerbeaud');

-- ============================================
-- 14. CHOUX (Cabbage - general)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Choux', temperate_id, outdoor_id, 7, 13, 19, 30, 120, 'Semis en pépinière. Repiquer après 4-5 semaines.', 'Rustica'),
  ('Choux', temperate_id, transplant_id, 13, 18, 22, 33, 90, 'Plantation des plants repiqués.', 'Gerbeaud');

-- ============================================
-- 15. OIGNONS (Onions)
-- ============================================
INSERT INTO calendar_defaults (vegetable_name, climate_id, sowing_type_id, sowing_start_decade, sowing_end_decade, harvest_start_decade, harvest_end_decade, growth_duration_days, notes, source) VALUES
  ('Oignons', temperate_id, direct_id, 7, 10, 19, 24, 150, 'Semis direct de printemps pour oignons de garde.', 'Rustica'),
  ('Oignons', temperate_id, transplant_id, 8, 10, 19, 24, 120, 'Plantation de bulbilles.', 'Gerbeaud');

END $$;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to convert decade number to month name and period
CREATE OR REPLACE FUNCTION decade_to_display(decade_num INTEGER)
RETURNS TEXT AS $$
DECLARE
  month_names TEXT[] := ARRAY['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                               'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  periods TEXT[] := ARRAY['début', 'mi', 'fin'];
  month_idx INTEGER;
  period_idx INTEGER;
BEGIN
  month_idx := CEIL(decade_num / 3.0)::INTEGER;
  period_idx := ((decade_num - 1) % 3) + 1;

  RETURN periods[period_idx] || ' ' || month_names[month_idx];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

-- View: Combined calendar (defaults + user overrides)
CREATE OR REPLACE VIEW v_user_calendar AS
SELECT
  COALESCE(uo.id, cd.id) as id,
  COALESCE(uo.vegetable_name, cd.vegetable_name) as vegetable_name,
  cd.climate_id,
  c.name as climate_name,
  COALESCE(uo.sowing_type_id, cd.sowing_type_id) as sowing_type_id,
  st.code as sowing_type_code,
  st.name as sowing_type_name,
  st.icon as sowing_type_icon,
  COALESCE(uo.sowing_start_decade, cd.sowing_start_decade) as sowing_start_decade,
  COALESCE(uo.sowing_end_decade, cd.sowing_end_decade) as sowing_end_decade,
  COALESCE(uo.harvest_start_decade, cd.harvest_start_decade) as harvest_start_decade,
  COALESCE(uo.harvest_end_decade, cd.harvest_end_decade) as harvest_end_decade,
  COALESCE(uo.growth_duration_days, cd.growth_duration_days) as growth_duration_days,
  COALESCE(uo.notes, cd.notes) as notes,
  CASE WHEN uo.id IS NOT NULL THEN TRUE ELSE FALSE END as is_customized,
  uo.user_id,
  COALESCE(uo.is_active, TRUE) as is_active
FROM calendar_defaults cd
LEFT JOIN user_calendar_overrides uo
  ON cd.vegetable_name = uo.vegetable_name
  AND cd.sowing_type_id = uo.sowing_type_id
  AND cd.sowing_start_decade = uo.sowing_start_decade
JOIN climates c ON cd.climate_id = c.id
JOIN sowing_types st ON COALESCE(uo.sowing_type_id, cd.sowing_type_id) = st.id
WHERE COALESCE(uo.is_active, TRUE) = TRUE;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
