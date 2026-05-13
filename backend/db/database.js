const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const Database = require("better-sqlite3");

const root = path.resolve(__dirname, "../..");
const dataDir = path.join(root, "data");
const dbPath = process.env.NUTRITRACKER_DB || path.join(dataDir, "nutritracker.sqlite");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
ensureMealItemColumns();

const nutrientKeys = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "sodium",
  "cholesterol",
  "saturatedFat",
  "potassium",
  "calcium",
  "iron",
  "vitaminC"
];

const mealColumns = {
  calories: "total_calories",
  protein: "total_protein",
  carbs: "total_carbs",
  fat: "total_fat",
  fiber: "total_fiber",
  sugar: "total_sugar",
  sodium: "total_sodium",
  cholesterol: "total_cholesterol",
  saturatedFat: "total_saturated_fat",
  potassium: "total_potassium",
  calcium: "total_calcium",
  iron: "total_iron",
  vitaminC: "total_vitamin_c"
};

function createMeal(input) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const meal = normalizeMealInput(input, id, now, now);

  const transaction = db.transaction(() => {
    insertMeal(meal);
    insertMealItems(meal.id, meal.items, now);
    if (input.aiDetectionResult) insertAiDetectionResult(meal.id, input.aiDetectionResult, now);
  });
  transaction();

  return getMeal(id);
}

function listMeals(filters = {}) {
  const params = {};
  const clauses = [];
  if (filters.mealType) {
    clauses.push("meal_type = @mealType");
    params.mealType = filters.mealType;
  }
  if (filters.start) {
    clauses.push("eaten_at >= @start");
    params.start = filters.start;
  }
  if (filters.end) {
    clauses.push("eaten_at <= @end");
    params.end = filters.end;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db.prepare(`
    SELECT * FROM meals
    ${where}
    ORDER BY eaten_at DESC, created_at DESC
    LIMIT 100
  `).all(params);

  return rows.map((row) => hydrateMeal(row, getMealItems(row.id)));
}

function getMeal(id) {
  const row = db.prepare("SELECT * FROM meals WHERE id = ?").get(id);
  if (!row) return null;
  return hydrateMeal(row, getMealItems(id));
}

function updateMeal(id, input) {
  if (!getMeal(id)) return null;
  const previous = db.prepare("SELECT created_at FROM meals WHERE id = ?").get(id);
  const now = new Date().toISOString();
  const meal = normalizeMealInput(input, id, previous.created_at, now);

  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM meal_items WHERE meal_id = ?").run(id);
    updateMealRow(meal);
    insertMealItems(meal.id, meal.items, now);
    if (input.aiDetectionResult) insertAiDetectionResult(meal.id, input.aiDetectionResult, now);
  });
  transaction();

  return getMeal(id);
}

function deleteMeal(id) {
  const result = db.prepare("DELETE FROM meals WHERE id = ?").run(id);
  return result.changes > 0;
}

function closeDatabase() {
  db.close();
}

function normalizeMealInput(input, id, createdAt, updatedAt) {
  if (!input || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("At least one reviewed meal item is required.");
  }
  const items = input.items.map(normalizeMealItem);
  const totals = sumItemNutrition(items);
  return {
    id,
    userId: stringOrNull(input.userId),
    mealType: String(input.mealType || "snack").trim() || "snack",
    eatenAt: String(input.eatenAt || new Date().toISOString()),
    location: stringOrNull(input.location),
    city: stringOrNull(input.city),
    photoData: input.photoConsent === true ? stringOrNull(input.photo || input.photoData) : null,
    estimateWarning: "Nutrition values are estimates until verified.",
    totals,
    items,
    createdAt,
    updatedAt
  };
}

function normalizeMealItem(item) {
  const nutrition = item.nutrition || {};
  const foodName = String(item.foodName || "").trim();
  if (!foodName) throw new Error("Every meal item needs a food name.");
  const base = item.base ? { ...item.base, unsupportedUnit: Boolean(item.unsupportedUnit) } : null;
  return {
    id: crypto.randomUUID(),
    foodName,
    quantity: number(item.quantity, 1),
    unit: String(item.unit || "serving"),
    confidence: item.confidence === null || item.confidence === undefined ? null : number(item.confidence, null),
    aiDetected: item.manualEntry ? 0 : 1,
    needsUserReview: item.needsUserReview ? 1 : 0,
    uncertaintyNote: stringOrNull(item.uncertaintyNote),
    sourceName: stringOrNull(item.sourceName),
    base,
    manualEntry: Boolean(item.manualEntry),
    unsupportedUnit: Boolean(item.unsupportedUnit),
    portionSize: stringOrNull(item.portionSize),
    gramsPerUnit: item.gramsPerUnit === null || item.gramsPerUnit === undefined ? null : number(item.gramsPerUnit, null),
    totalGrams: item.totalGrams === null || item.totalGrams === undefined ? null : number(item.totalGrams, null),
    nutritionBasis: stringOrNull(item.nutritionBasis),
    portionEstimateMode: stringOrNull(item.portionEstimateMode),
    diameterValue: item.diameterValue === null || item.diameterValue === undefined ? null : number(item.diameterValue, null),
    diameterUnit: stringOrNull(item.diameterUnit),
    thickness: stringOrNull(item.thickness),
    nutrition: Object.fromEntries(nutrientKeys.map((key) => [key, number(nutrition[key], 0)]))
  };
}

function insertMeal(meal) {
  db.prepare(`
    INSERT INTO meals (
      id, user_id, meal_type, eaten_at, location, city, photo_data, estimate_warning,
      total_calories, total_protein, total_carbs, total_fat, total_fiber, total_sugar,
      total_sodium, total_cholesterol, total_saturated_fat, total_potassium, total_calcium,
      total_iron, total_vitamin_c, created_at, updated_at
    ) VALUES (
      @id, @userId, @mealType, @eatenAt, @location, @city, @photoData, @estimateWarning,
      @calories, @protein, @carbs, @fat, @fiber, @sugar, @sodium, @cholesterol,
      @saturatedFat, @potassium, @calcium, @iron, @vitaminC, @createdAt, @updatedAt
    )
  `).run(mealParams(meal));
}

function updateMealRow(meal) {
  db.prepare(`
    UPDATE meals SET
      user_id = @userId,
      meal_type = @mealType,
      eaten_at = @eatenAt,
      location = @location,
      city = @city,
      photo_data = @photoData,
      estimate_warning = @estimateWarning,
      total_calories = @calories,
      total_protein = @protein,
      total_carbs = @carbs,
      total_fat = @fat,
      total_fiber = @fiber,
      total_sugar = @sugar,
      total_sodium = @sodium,
      total_cholesterol = @cholesterol,
      total_saturated_fat = @saturatedFat,
      total_potassium = @potassium,
      total_calcium = @calcium,
      total_iron = @iron,
      total_vitamin_c = @vitaminC,
      updated_at = @updatedAt
    WHERE id = @id
  `).run(mealParams(meal));
}

function insertMealItems(mealId, items, now) {
  const statement = db.prepare(`
    INSERT INTO meal_items (
      id, meal_id, food_name, quantity, unit, confidence_score, ai_detected,
      portion_size, grams_per_unit, total_grams, nutrition_basis, needs_user_review,
      portion_estimate_mode, diameter_value, diameter_unit, thickness, uncertainty_note,
      source_name, base_json, calories, protein, carbs, fat, fiber, sugar, sodium,
      cholesterol, saturated_fat, potassium, calcium, iron, vitamin_c, created_at, updated_at
    ) VALUES (
      @id, @mealId, @foodName, @quantity, @unit, @confidence, @aiDetected,
      @portionSize, @gramsPerUnit, @totalGrams, @nutritionBasis, @needsUserReview,
      @portionEstimateMode, @diameterValue, @diameterUnit, @thickness, @uncertaintyNote,
      @sourceName, @baseJson, @calories, @protein, @carbs, @fat, @fiber, @sugar,
      @sodium, @cholesterol, @saturatedFat, @potassium, @calcium, @iron, @vitaminC,
      @createdAt, @updatedAt
    )
  `);
  items.forEach((item) => {
    statement.run({
      id: item.id,
      mealId,
      foodName: item.foodName,
      quantity: item.quantity,
      unit: item.unit,
      confidence: item.confidence,
      aiDetected: item.aiDetected,
      portionSize: item.portionSize,
      gramsPerUnit: item.gramsPerUnit,
      totalGrams: item.totalGrams,
      nutritionBasis: item.nutritionBasis,
      portionEstimateMode: item.portionEstimateMode,
      diameterValue: item.diameterValue,
      diameterUnit: item.diameterUnit,
      thickness: item.thickness,
      needsUserReview: item.needsUserReview,
      uncertaintyNote: item.uncertaintyNote,
      sourceName: item.sourceName,
      baseJson: item.base ? JSON.stringify(item.base) : null,
      ...item.nutrition,
      createdAt: now,
      updatedAt: now
    });
  });
}

function insertAiDetectionResult(mealId, result, now) {
  db.prepare(`
    INSERT INTO ai_detection_results (
      id, meal_id, provider, model, raw_response, status, error_message, detected_at
    ) VALUES (
      @id, @mealId, @provider, @model, @rawResponse, @status, @errorMessage, @detectedAt
    )
  `).run({
    id: crypto.randomUUID(),
    mealId,
    provider: stringOrNull(result.provider),
    model: stringOrNull(result.model),
    rawResponse: JSON.stringify(result.rawResponse || result),
    status: result.status || "saved",
    errorMessage: stringOrNull(result.errorMessage),
    detectedAt: now
  });
}

function getMealItems(mealId) {
  return db.prepare("SELECT * FROM meal_items WHERE meal_id = ? ORDER BY created_at ASC").all(mealId);
}

function hydrateMeal(row, items) {
  return {
    id: row.id,
    userId: row.user_id,
    mealType: row.meal_type,
    eatenAt: row.eaten_at,
    location: row.location || "",
    city: row.city || "",
    photo: row.photo_data || "",
    estimateWarning: row.estimate_warning,
    totals: {
      calories: row.total_calories,
      protein: row.total_protein,
      carbs: row.total_carbs,
      fat: row.total_fat,
      fiber: row.total_fiber,
      sugar: row.total_sugar,
      sodium: row.total_sodium,
      cholesterol: row.total_cholesterol,
      saturatedFat: row.total_saturated_fat,
      potassium: row.total_potassium,
      calcium: row.total_calcium,
      iron: row.total_iron,
      vitaminC: row.total_vitamin_c
    },
    items: items.map(hydrateMealItem),
    savedAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function hydrateMealItem(row) {
  const parsed = parseBase(row.base_json);
  return {
    foodName: row.food_name,
    quantity: row.quantity,
    unit: row.unit,
    confidence: row.confidence_score,
    sourceName: row.source_name || "",
    uncertaintyNote: row.uncertainty_note || "",
    manualEntry: row.ai_detected === 0,
    needsUserReview: row.needs_user_review === 1,
    unsupportedUnit: parsed.unsupportedUnit || false,
    portionSize: row.portion_size || "",
    gramsPerUnit: row.grams_per_unit,
    totalGrams: row.total_grams,
    nutritionBasis: row.nutrition_basis || "",
    portionEstimateMode: row.portion_estimate_mode || "",
    diameterValue: row.diameter_value,
    diameterUnit: row.diameter_unit || "",
    thickness: row.thickness || "",
    base: parsed.base,
    nutrition: {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
      sugar: row.sugar,
      sodium: row.sodium,
      cholesterol: row.cholesterol,
      saturatedFat: row.saturated_fat,
      potassium: row.potassium,
      calcium: row.calcium,
      iron: row.iron,
      vitaminC: row.vitamin_c
    }
  };
}

function parseBase(baseJson) {
  if (!baseJson) return { base: null, unsupportedUnit: false };
  try {
    const base = JSON.parse(baseJson);
    return { base, unsupportedUnit: Boolean(base && base.unsupportedUnit) };
  } catch {
    return { base: null, unsupportedUnit: false };
  }
}

function mealParams(meal) {
  return {
    id: meal.id,
    userId: meal.userId,
    mealType: meal.mealType,
    eatenAt: meal.eatenAt,
    location: meal.location,
    city: meal.city,
    photoData: meal.photoData,
    estimateWarning: meal.estimateWarning,
    ...meal.totals,
    createdAt: meal.createdAt,
    updatedAt: meal.updatedAt
  };
}

function sumItemNutrition(items) {
  return items.reduce((totals, item) => {
    nutrientKeys.forEach((key) => {
      totals[key] += number(item.nutrition[key], 0);
    });
    return totals;
  }, Object.fromEntries(nutrientKeys.map((key) => [key, 0])));
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringOrNull(value) {
  const text = String(value || "").trim();
  return text ? text : null;
}

function ensureMealItemColumns() {
  const existing = new Set(db.prepare("PRAGMA table_info(meal_items)").all().map((column) => column.name));
  const columns = [
    ["portion_size", "TEXT"],
    ["grams_per_unit", "REAL"],
    ["total_grams", "REAL"],
    ["nutrition_basis", "TEXT"],
    ["portion_estimate_mode", "TEXT"],
    ["diameter_value", "REAL"],
    ["diameter_unit", "TEXT"],
    ["thickness", "TEXT"]
  ];
  columns.forEach(([name, definition]) => {
    if (!existing.has(name)) db.exec(`ALTER TABLE meal_items ADD COLUMN ${name} ${definition}`);
  });
}

module.exports = {
  createMeal,
  listMeals,
  getMeal,
  updateMeal,
  deleteMeal,
  closeDatabase
};
