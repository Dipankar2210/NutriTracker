CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  password_hash TEXT,
  password_changed_at TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT,
  city TEXT,
  dietary_preference TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT,
  password_set_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  unsubscribed_at TEXT,
  deleted_at TEXT,
  created_by_admin_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_access_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  purpose TEXT NOT NULL DEFAULT 'password_setup',
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  last_seen_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  daily_calories REAL,
  daily_protein REAL,
  daily_fat REAL,
  daily_carbs REAL,
  daily_fiber REAL,
  daily_sodium REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_meal_types (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  meal_type TEXT NOT NULL,
  eaten_at TEXT NOT NULL,
  location TEXT,
  city TEXT,
  photo_data TEXT,
  estimate_warning TEXT NOT NULL DEFAULT 'Nutrition values are estimates until verified.',
  total_calories REAL NOT NULL DEFAULT 0,
  total_protein REAL NOT NULL DEFAULT 0,
  total_carbs REAL NOT NULL DEFAULT 0,
  total_fat REAL NOT NULL DEFAULT 0,
  total_fiber REAL NOT NULL DEFAULT 0,
  total_sugar REAL NOT NULL DEFAULT 0,
  total_sodium REAL NOT NULL DEFAULT 0,
  total_cholesterol REAL NOT NULL DEFAULT 0,
  total_saturated_fat REAL NOT NULL DEFAULT 0,
  total_potassium REAL NOT NULL DEFAULT 0,
  total_calcium REAL NOT NULL DEFAULT 0,
  total_iron REAL NOT NULL DEFAULT 0,
  total_vitamin_c REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meal_items (
  id TEXT PRIMARY KEY,
  meal_id TEXT NOT NULL,
  food_name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'serving',
  portion_size TEXT,
  grams_per_unit REAL,
  total_grams REAL,
  nutrition_basis TEXT,
  portion_estimate_mode TEXT,
  diameter_value REAL,
  diameter_unit TEXT,
  thickness TEXT,
  confidence_score REAL,
  ai_detected INTEGER NOT NULL DEFAULT 0,
  needs_user_review INTEGER NOT NULL DEFAULT 0,
  nutrition_unknown INTEGER NOT NULL DEFAULT 0,
  uncertainty_note TEXT,
  source_name TEXT,
  base_json TEXT,
  calories REAL NOT NULL DEFAULT 0,
  protein REAL NOT NULL DEFAULT 0,
  carbs REAL NOT NULL DEFAULT 0,
  fat REAL NOT NULL DEFAULT 0,
  fiber REAL NOT NULL DEFAULT 0,
  sugar REAL NOT NULL DEFAULT 0,
  sodium REAL NOT NULL DEFAULT 0,
  cholesterol REAL NOT NULL DEFAULT 0,
  saturated_fat REAL NOT NULL DEFAULT 0,
  potassium REAL NOT NULL DEFAULT 0,
  calcium REAL NOT NULL DEFAULT 0,
  iron REAL NOT NULL DEFAULT 0,
  vitamin_c REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_detection_results (
  id TEXT PRIMARY KEY,
  meal_id TEXT,
  provider TEXT,
  model TEXT,
  raw_response TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  detected_at TEXT NOT NULL,
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS food_table_candidates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  geography TEXT NOT NULL,
  food_name TEXT NOT NULL,
  staple_foods TEXT,
  average_quantity TEXT,
  diet_configuration TEXT,
  nutrition_estimates TEXT,
  confidence_score REAL,
  trusted_source TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food_nutrition_references (
  id TEXT PRIMARY KEY,
  food_name TEXT NOT NULL UNIQUE,
  aliases TEXT,
  category TEXT,
  common_state TEXT,
  calories_per_100g REAL NOT NULL DEFAULT 0,
  protein_per_100g REAL NOT NULL DEFAULT 0,
  carbs_per_100g REAL NOT NULL DEFAULT 0,
  fat_per_100g REAL NOT NULL DEFAULT 0,
  fiber_per_100g REAL NOT NULL DEFAULT 0,
  sugar_per_100g REAL NOT NULL DEFAULT 0,
  sodium_per_100g REAL NOT NULL DEFAULT 0,
  cholesterol_per_100g REAL,
  saturated_fat_per_100g REAL,
  potassium_per_100g REAL,
  calcium_per_100g REAL,
  iron_per_100g REAL,
  vitamin_c_per_100g REAL,
  calories_per_g REAL NOT NULL DEFAULT 0,
  protein_per_g REAL NOT NULL DEFAULT 0,
  carbs_per_g REAL NOT NULL DEFAULT 0,
  fat_per_g REAL NOT NULL DEFAULT 0,
  fiber_per_g REAL NOT NULL DEFAULT 0,
  sugar_per_g REAL NOT NULL DEFAULT 0,
  sodium_per_g REAL NOT NULL DEFAULT 0,
  cholesterol_per_g REAL,
  saturated_fat_per_g REAL,
  potassium_per_g REAL,
  calcium_per_g REAL,
  iron_per_g REAL,
  vitamin_c_per_g REAL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food_portion_references (
  id TEXT PRIMARY KEY,
  food_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  small_grams REAL,
  medium_grams REAL,
  large_grams REAL,
  default_size TEXT NOT NULL DEFAULT 'medium',
  default_grams REAL,
  nutrition_basis TEXT NOT NULL DEFAULT 'per_100g',
  notes TEXT,
  source_name TEXT,
  source_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(food_name, unit)
);

CREATE TABLE IF NOT EXISTS food_aliases (
  id TEXT PRIMARY KEY,
  alias TEXT NOT NULL UNIQUE,
  canonical_food_name TEXT NOT NULL,
  match_priority INTEGER NOT NULL DEFAULT 50,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  iso2 TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  region_code TEXT,
  name TEXT NOT NULL,
  region_type TEXT NOT NULL DEFAULT 'state',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(country_id, name),
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS food_source_references (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  country_id TEXT,
  source_type TEXT NOT NULL,
  quality_tier TEXT NOT NULL DEFAULT 'official',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_name, source_url),
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS regional_food_items (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  region_id TEXT,
  food_name TEXT NOT NULL,
  local_name TEXT,
  canonical_food_name TEXT NOT NULL,
  food_group TEXT NOT NULL,
  source_id TEXT,
  source_basis TEXT NOT NULL DEFAULT 'direct',
  confidence TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(country_id, region_id, canonical_food_name, local_name),
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES food_source_references(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS regional_staple_rankings (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  region_id TEXT,
  canonical_food_name TEXT NOT NULL,
  staple_rank INTEGER NOT NULL,
  evidence_source_id TEXT,
  evidence_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(country_id, region_id, canonical_food_name),
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_source_id) REFERENCES food_source_references(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_meals_eaten_at ON meals(eaten_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_eaten_at ON meals(user_id, eaten_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_user_access_tokens_user ON user_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_user_meal_types_user ON user_meal_types(user_id, name);
CREATE INDEX IF NOT EXISTS idx_food_nutrition_name ON food_nutrition_references(food_name);
CREATE INDEX IF NOT EXISTS idx_food_aliases_alias ON food_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_regions_country ON regions(country_id);
CREATE INDEX IF NOT EXISTS idx_regional_food_country_region ON regional_food_items(country_id, region_id);
CREATE INDEX IF NOT EXISTS idx_regional_staples_country_region ON regional_staple_rankings(country_id, region_id);
