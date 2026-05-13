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
  updated_at TEXT NOT NULL
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

CREATE INDEX IF NOT EXISTS idx_meals_eaten_at ON meals(eaten_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);
