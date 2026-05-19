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
ensureAuthColumns();
ensureMealItemColumns();
ensureNutritionPerGramColumns();
seedReferenceTablesFromFoodTable();
applyCuratedSourceOverrides();
updateNutritionPerGramColumns();
seedGeographyReferenceTables();
seedDefaultAdminUser();

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

function createUser(input = {}) {
  const displayName = String(input.displayName || input.name || "").trim();
  const contactEmail = stringOrNull(input.contactEmail || input.email);
  const contactPhone = stringOrNull(input.contactPhone || input.phone);
  if (!displayName) throw new Error("User display name is required.");
  if (!contactEmail && !contactPhone) throw new Error("Add an email or phone for the user.");

  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    displayName,
    contactEmail,
    contactPhone,
    location: stringOrNull(input.location),
    city: stringOrNull(input.city),
    dietaryPreference: stringOrNull(input.dietaryPreference),
    role: normalizeRole(input.role || "user"),
    passwordHash: null,
    passwordSetAt: null,
    status: normalizeUserStatus(input.status || "pending"),
    unsubscribedAt: null,
    deletedAt: null,
    createdByAdminId: stringOrNull(input.createdByAdminId),
    createdAt: now,
    updatedAt: now
  };
  const access = buildAccessTokenRecord(user.id, input.accessLabel || "Initial setup link", now);

  const transaction = db.transaction(() => {
    insertUser(user);
    insertUserAccessToken(access.record);
    upsertUserGoals(user.id, input.goals || {}, now);
  });
  transaction();

  return {
    user: getUser(user.id),
    accessToken: access.token,
    magicLinkPath: `/setup.html?token=${encodeURIComponent(access.token)}`
  };
}

function listUsers(filters = {}) {
  const params = {};
  const clauses = [];
  if (filters.status) {
    clauses.push("status = @status");
    params.status = normalizeUserStatus(filters.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`
    SELECT * FROM users
    ${where}
    ORDER BY created_at DESC
    LIMIT 200
  `).all(params).map(hydrateUser);
}

function getUser(id) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? hydrateUser(row) : null;
}

function updateUser(id, input = {}) {
  const existing = getUser(id);
  if (!existing) return null;
  const displayName = String(input.displayName || input.name || existing.displayName || "").trim();
  const contactEmail = input.contactEmail === undefined && input.email === undefined
    ? existing.contactEmail || null
    : stringOrNull(input.contactEmail || input.email);
  const contactPhone = input.contactPhone === undefined && input.phone === undefined
    ? existing.contactPhone || null
    : stringOrNull(input.contactPhone || input.phone);
  if (!displayName) throw new Error("User display name is required.");
  if (!contactEmail && !contactPhone) throw new Error("Add an email or phone for the user.");

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users SET
      display_name = @displayName,
      contact_email = @contactEmail,
      contact_phone = @contactPhone,
      location = @location,
      city = @city,
      dietary_preference = @dietaryPreference,
      status = @status,
      updated_at = @updatedAt
    WHERE id = @id
  `).run({
    id,
    displayName,
    contactEmail,
    contactPhone,
    location: input.location === undefined ? existing.location || null : stringOrNull(input.location),
    city: input.city === undefined ? existing.city || null : stringOrNull(input.city),
    dietaryPreference: input.dietaryPreference === undefined ? existing.dietaryPreference || null : stringOrNull(input.dietaryPreference),
    status: input.status === undefined ? existing.status : normalizeUserStatus(input.status),
    updatedAt: now
  });
  if (input.goals) upsertUserGoals(id, input.goals, now);
  return getUser(id);
}

function createUserAccessToken(userId, input = {}) {
  const user = getUser(userId);
  if (!user) throw new Error("User not found.");
  const now = new Date().toISOString();
  const access = buildAccessTokenRecord(userId, input.label || "Password setup link", now, input.expiresAt);
  insertUserAccessToken(access.record);
  return {
    user,
    accessToken: access.token,
    magicLinkPath: `/setup.html?token=${encodeURIComponent(access.token)}`
  };
}

function validateMagicLinkToken(token) {
  const tokenHash = hashAccessToken(token);
  if (!tokenHash) return null;
  const row = db.prepare(`
    SELECT
      u.*,
      t.id AS token_id,
      t.status AS token_status,
      t.purpose,
      t.expires_at
    FROM user_access_tokens t
    JOIN users u ON u.id = t.user_id
    WHERE t.token_hash = ?
  `).get(tokenHash);
  if (!row || row.token_status !== "active" || row.purpose !== "password_setup") return null;
  if (["unsubscribed", "deleted"].includes(row.status)) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null;
  const now = new Date().toISOString();
  db.prepare("UPDATE user_access_tokens SET last_used_at = ? WHERE id = ?").run(now, row.token_id);
  return {
    user: hydrateUser(row),
    tokenId: row.token_id
  };
}

function setupUserPassword(input = {}) {
  const token = String(input.token || "").trim();
  const password = String(input.password || "");
  const confirmPassword = String(input.confirmPassword || "");
  validatePassword(password, confirmPassword);
  const session = validateMagicLinkToken(token);
  if (!session) throw new Error("Invalid or expired setup link.");

  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE users SET
        password_hash = @passwordHash,
        password_set_at = @passwordSetAt,
        status = 'active',
        updated_at = @updatedAt
      WHERE id = @id
    `).run({
      id: session.user.id,
      passwordHash,
      passwordSetAt: now,
      updatedAt: now
    });
    db.prepare(`
      UPDATE user_access_tokens
      SET status = 'used', revoked_at = @revokedAt
      WHERE user_id = @userId AND purpose = 'password_setup' AND status = 'active'
    `).run({ userId: session.user.id, revokedAt: now });
  });
  transaction();
  return { user: getUser(session.user.id) };
}

function loginUser(input = {}) {
  const email = String(input.email || input.contactEmail || "").trim();
  const password = String(input.password || "");
  if (!email || !password) throw new Error("Email and password are required.");
  const row = db.prepare("SELECT * FROM users WHERE lower(contact_email) = lower(?) LIMIT 1").get(email);
  if (!row || !row.password_hash || !verifyPassword(password, row.password_hash)) {
    throw new Error("Invalid email or password.");
  }
  if (row.status !== "active" || row.deleted_at || row.unsubscribed_at) {
    throw new Error("This account is not active.");
  }
  return createSession(row.id, row.role || "user");
}

function getSession(token) {
  const tokenHash = hashAccessToken(token);
  if (!tokenHash) return null;
  const row = db.prepare(`
    SELECT
      s.id AS session_id,
      s.role AS session_role,
      s.expires_at,
      s.revoked_at,
      u.*
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenHash);
  if (!row || row.revoked_at || row.status !== "active" || row.deleted_at || row.unsubscribed_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  const now = new Date().toISOString();
  db.prepare("UPDATE auth_sessions SET last_seen_at = ? WHERE id = ?").run(now, row.session_id);
  return {
    token,
    role: row.session_role || row.role || "user",
    user: hydrateUser(row)
  };
}

function revokeSession(token) {
  const tokenHash = hashAccessToken(token);
  if (!tokenHash) return false;
  const result = db.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL").run(new Date().toISOString(), tokenHash);
  return result.changes > 0;
}

function updateUserRole(id, role) {
  const user = getUser(id);
  if (!user) return null;
  const nextRole = normalizeRole(role);
  if (user.role === "admin" && nextRole !== "admin" && activeAdminCount() <= 1) {
    throw new Error("At least one active admin is required.");
  }
  const now = new Date().toISOString();
  db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").run(nextRole, now, id);
  return getUser(id);
}

function unsubscribeUser(id) {
  const user = getUser(id);
  if (!user) return null;
  if (user.role === "admin" && activeAdminCount() <= 1) {
    throw new Error("The last active admin cannot unsubscribe.");
  }
  const now = new Date().toISOString();
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE users SET
        status = 'unsubscribed',
        unsubscribed_at = @now,
        deleted_at = @now,
        updated_at = @now
      WHERE id = @id
    `).run({ id, now });
    db.prepare("UPDATE auth_sessions SET revoked_at = @now WHERE user_id = @id AND revoked_at IS NULL").run({ id, now });
    db.prepare("UPDATE user_access_tokens SET status = 'revoked', revoked_at = @now WHERE user_id = @id AND status = 'active'").run({ id, now });
  });
  transaction();
  return getUser(id);
}

function getUserGoals(userId) {
  const row = db.prepare("SELECT * FROM user_goals WHERE user_id = ?").get(userId);
  return row ? hydrateUserGoals(row) : emptyUserGoals(userId);
}

function getUserDashboard(userId, filters = {}) {
  const user = getUser(userId);
  if (!user) return null;
  const meals = listMeals({
    userId,
    start: filters.start || "",
    end: filters.end || ""
  });
  const days = new Map();
  const totals = emptyTotals();
  meals.forEach((meal) => {
    const date = String(meal.eatenAt || "").slice(0, 10) || "unknown";
    if (!days.has(date)) {
      days.set(date, {
        date,
        mealCount: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
        mealTypes: {}
      });
    }
    const day = days.get(date);
    day.mealCount += 1;
    day.mealTypes[meal.mealType] = (day.mealTypes[meal.mealType] || 0) + 1;
    ["calories", "protein", "carbs", "fat", "fiber", "sodium"].forEach((key) => {
      day[key] += number(meal.totals[key], 0);
    });
    nutrientKeys.forEach((key) => {
      totals[key] += number(meal.totals[key], 0);
    });
  });

  return {
    user,
    goals: getUserGoals(userId),
    totals,
    days: [...days.values()].sort((a, b) => b.date.localeCompare(a.date)),
    recentMeals: meals.slice(0, 10)
  };
}

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
  if (filters.userId) {
    clauses.push("user_id = @userId");
    params.userId = filters.userId;
  }
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
  const previous = db.prepare("SELECT created_at, user_id FROM meals WHERE id = ?").get(id);
  const now = new Date().toISOString();
  const meal = normalizeMealInput(
    input.userId === undefined ? { ...input, userId: previous.user_id } : input,
    id,
    previous.created_at,
    now
  );

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

function listNutritionReferences() {
  return db.prepare(`
    SELECT * FROM food_nutrition_references
    WHERE status = 'active'
    ORDER BY food_name ASC
  `).all().map(hydrateNutritionReference);
}

function listPortionReferences() {
  return db.prepare(`
    SELECT * FROM food_portion_references
    WHERE status = 'active'
    ORDER BY food_name ASC
  `).all().map(hydratePortionReference);
}

function listCountries() {
  return db.prepare("SELECT * FROM countries ORDER BY name ASC").all().map(hydrateCountry);
}

function listRegions(countryIso2) {
  const params = {};
  const where = countryIso2 ? "WHERE c.iso2 = @countryIso2" : "";
  if (countryIso2) params.countryIso2 = String(countryIso2).toUpperCase();
  return db.prepare(`
    SELECT r.*, c.iso2 AS country_iso2, c.name AS country_name
    FROM regions r
    JOIN countries c ON c.id = r.country_id
    ${where}
    ORDER BY c.name ASC, r.name ASC
  `).all(params).map(hydrateRegion);
}

function listFoodSourceReferences(countryIso2) {
  const params = {};
  const where = countryIso2 ? "WHERE c.iso2 = @countryIso2 OR fs.country_id IS NULL" : "";
  if (countryIso2) params.countryIso2 = String(countryIso2).toUpperCase();
  return db.prepare(`
    SELECT fs.*, c.iso2 AS country_iso2, c.name AS country_name
    FROM food_source_references fs
    LEFT JOIN countries c ON c.id = fs.country_id
    ${where}
    ORDER BY fs.quality_tier ASC, fs.source_name ASC
  `).all(params).map(hydrateFoodSourceReference);
}

function listRegionalFoodItems(filters = {}) {
  const params = {};
  const clauses = ["rfi.status = 'active'"];
  if (filters.countryIso2) {
    clauses.push("c.iso2 = @countryIso2");
    params.countryIso2 = String(filters.countryIso2).toUpperCase();
  }
  if (filters.regionName) {
    clauses.push("LOWER(r.name) = LOWER(@regionName)");
    params.regionName = filters.regionName;
  }
  if (filters.query) {
    clauses.push("(LOWER(rfi.food_name) LIKE @query OR LOWER(rfi.local_name) LIKE @query OR LOWER(rfi.canonical_food_name) LIKE @query)");
    params.query = `%${String(filters.query).toLowerCase()}%`;
  }

  return db.prepare(`
    SELECT
      rfi.*,
      c.iso2 AS country_iso2,
      c.name AS country_name,
      r.name AS region_name,
      r.region_code,
      fs.source_name,
      fs.source_url,
      fs.quality_tier
    FROM regional_food_items rfi
    JOIN countries c ON c.id = rfi.country_id
    LEFT JOIN regions r ON r.id = rfi.region_id
    LEFT JOIN food_source_references fs ON fs.id = rfi.source_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY c.name ASC, r.name ASC, rfi.food_group ASC, rfi.food_name ASC
  `).all(params).map(hydrateRegionalFoodItem);
}

function listRegionalStapleRankings(filters = {}) {
  const params = {};
  const clauses = [];
  if (filters.countryIso2) {
    clauses.push("c.iso2 = @countryIso2");
    params.countryIso2 = String(filters.countryIso2).toUpperCase();
  }
  if (filters.regionName) {
    clauses.push("LOWER(r.name) = LOWER(@regionName)");
    params.regionName = filters.regionName;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db.prepare(`
    SELECT
      rsr.*,
      c.iso2 AS country_iso2,
      c.name AS country_name,
      r.name AS region_name,
      fs.source_name,
      fs.source_url
    FROM regional_staple_rankings rsr
    JOIN countries c ON c.id = rsr.country_id
    LEFT JOIN regions r ON r.id = rsr.region_id
    LEFT JOIN food_source_references fs ON fs.id = rsr.evidence_source_id
    ${where}
    ORDER BY c.name ASC, r.name ASC, rsr.staple_rank ASC
  `).all(params).map(hydrateRegionalStapleRanking);
}

function searchFoods(query, limit = 25) {
  const normalized = normalizeSearch(query);
  const nutrition = listNutritionReferences().map((item) => scoreFoodSearch({
    name: item.name,
    type: "Ingredient",
    category: item.category,
    searchText: `${item.name} ${item.category || ""} ${item.commonState || ""} ${item.aliases || ""}`
  }, normalized)).filter(Boolean);
  const aliases = db.prepare(`
    SELECT alias, canonical_food_name, match_priority
    FROM food_aliases
    ORDER BY match_priority ASC, alias ASC
  `).all().map((item) => scoreFoodSearch({
    name: item.canonical_food_name,
    type: "Alias",
    category: item.alias,
    searchText: `${item.alias} ${item.canonical_food_name}`,
    scoreOffset: item.match_priority || 50
  }, normalized)).filter(Boolean);

  const seen = new Set();
  return [...nutrition, ...aliases]
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ score, searchText, scoreOffset, ...item }) => item);
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

function insertUser(user) {
  db.prepare(`
    INSERT INTO users (
      id, display_name, contact_email, contact_phone, location, city,
      dietary_preference, role, password_hash, password_set_at, status,
      unsubscribed_at, deleted_at, created_by_admin_id, created_at, updated_at
    ) VALUES (
      @id, @displayName, @contactEmail, @contactPhone, @location, @city,
      @dietaryPreference, @role, @passwordHash, @passwordSetAt, @status,
      @unsubscribedAt, @deletedAt, @createdByAdminId, @createdAt, @updatedAt
    )
  `).run(user);
}

function insertUserAccessToken(record) {
  db.prepare(`
    INSERT INTO user_access_tokens (
      id, user_id, token_hash, label, purpose, status, expires_at, last_used_at, created_at, revoked_at
    ) VALUES (
      @id, @userId, @tokenHash, @label, @purpose, @status, @expiresAt, @lastUsedAt, @createdAt, @revokedAt
    )
  `).run(record);
}

function upsertUserGoals(userId, goals = {}, now = new Date().toISOString()) {
  db.prepare(`
    INSERT INTO user_goals (
      id, user_id, daily_calories, daily_protein, daily_fat,
      daily_carbs, daily_fiber, daily_sodium, created_at, updated_at
    ) VALUES (
      @id, @userId, @dailyCalories, @dailyProtein, @dailyFat,
      @dailyCarbs, @dailyFiber, @dailySodium, @createdAt, @updatedAt
    )
    ON CONFLICT(user_id) DO UPDATE SET
      daily_calories = excluded.daily_calories,
      daily_protein = excluded.daily_protein,
      daily_fat = excluded.daily_fat,
      daily_carbs = excluded.daily_carbs,
      daily_fiber = excluded.daily_fiber,
      daily_sodium = excluded.daily_sodium,
      updated_at = excluded.updated_at
  `).run({
    id: crypto.randomUUID(),
    userId,
    dailyCalories: nullableNumber(goals.dailyCalories),
    dailyProtein: nullableNumber(goals.dailyProtein),
    dailyFat: nullableNumber(goals.dailyFat),
    dailyCarbs: nullableNumber(goals.dailyCarbs),
    dailyFiber: nullableNumber(goals.dailyFiber),
    dailySodium: nullableNumber(goals.dailySodium),
    createdAt: now,
    updatedAt: now
  });
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

function hydrateUser(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    contactEmail: row.contact_email || "",
    contactPhone: row.contact_phone || "",
    location: row.location || "",
    city: row.city || "",
    dietaryPreference: row.dietary_preference || "",
    role: row.role || "user",
    passwordSetAt: row.password_set_at || "",
    status: row.status,
    unsubscribedAt: row.unsubscribed_at || "",
    deletedAt: row.deleted_at || "",
    createdByAdminId: row.created_by_admin_id || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function hydrateUserGoals(row) {
  return {
    userId: row.user_id,
    dailyCalories: row.daily_calories,
    dailyProtein: row.daily_protein,
    dailyFat: row.daily_fat,
    dailyCarbs: row.daily_carbs,
    dailyFiber: row.daily_fiber,
    dailySodium: row.daily_sodium,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function emptyUserGoals(userId) {
  return {
    userId,
    dailyCalories: null,
    dailyProtein: null,
    dailyFat: null,
    dailyCarbs: null,
    dailyFiber: null,
    dailySodium: null
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

function emptyTotals() {
  return Object.fromEntries(nutrientKeys.map((key) => [key, 0]));
}

function buildAccessTokenRecord(userId, label, now, expiresAt) {
  const token = crypto.randomBytes(32).toString("base64url");
  return {
    token,
    record: {
      id: crypto.randomUUID(),
      userId,
      tokenHash: hashAccessToken(token),
      label: stringOrNull(label),
      purpose: "password_setup",
      status: "active",
      expiresAt: stringOrNull(expiresAt),
      lastUsedAt: null,
      createdAt: now,
      revokedAt: null
    }
  };
}

function hashAccessToken(token) {
  const value = String(token || "").trim();
  if (!value) return "";
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const parts = String(storedHash || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const expected = Buffer.from(parts[2], "base64url");
  const actual = crypto.scryptSync(String(password), parts[1], expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function validatePassword(password, confirmPassword) {
  if (!password || !confirmPassword) throw new Error("Password and confirmation are required.");
  if (password !== confirmPassword) throw new Error("Password and confirmation must match.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (!/[A-Z]/.test(password)) throw new Error("Password must include an uppercase letter.");
  if (!/[a-z]/.test(password)) throw new Error("Password must include a lowercase letter.");
  if (!/[0-9]/.test(password)) throw new Error("Password must include a number.");
  if (!/[^A-Za-z0-9]/.test(password)) throw new Error("Password must include a symbol.");
}

function createSession(userId, role) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
  const user = getUser(userId);
  db.prepare(`
    INSERT INTO auth_sessions (
      id, user_id, token_hash, role, expires_at, created_at, revoked_at, last_seen_at
    ) VALUES (
      @id, @userId, @tokenHash, @role, @expiresAt, @createdAt, NULL, @lastSeenAt
    )
  `).run({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashAccessToken(token),
    role: normalizeRole(role),
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString()
  });
  return {
    token,
    user,
    role: user.role,
    expiresAt: expires.toISOString()
  };
}

function activeAdminCount() {
  return db.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active' AND deleted_at IS NULL").get().total;
}

function normalizeRole(role) {
  const value = String(role || "user").toLowerCase().trim();
  return value === "admin" ? "admin" : "user";
}

function normalizeUserStatus(status) {
  const value = String(status || "active").toLowerCase().trim();
  return ["pending", "active", "inactive", "unsubscribed", "deleted"].includes(value) ? value : "active";
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringOrNull(value) {
  const text = String(value || "").trim();
  return text ? text : null;
}

function ensureAuthColumns() {
  addMissingColumns("users", [
    ["role", "TEXT NOT NULL DEFAULT 'user'"],
    ["password_hash", "TEXT"],
    ["password_set_at", "TEXT"],
    ["unsubscribed_at", "TEXT"],
    ["deleted_at", "TEXT"]
  ]);
  addMissingColumns("user_access_tokens", [
    ["purpose", "TEXT NOT NULL DEFAULT 'password_setup'"]
  ]);
  addMissingColumns("admin_users", [
    ["password_hash", "TEXT"],
    ["password_changed_at", "TEXT"]
  ]);
  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_contact_email ON users(contact_email);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
  `);
}

function addMissingColumns(table, columns) {
  const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name));
  columns.forEach(([name, definition]) => {
    if (!existing.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  });
}

function seedDefaultAdminUser() {
  if (activeAdminCount() > 0) return;
  const now = new Date().toISOString();
  const email = String(process.env.NUTRITRACKER_ADMIN_EMAIL || "admin@example.com").trim();
  const password = String(process.env.NUTRITRACKER_ADMIN_PASSWORD || "ChangeMe123!");
  const user = {
    id: crypto.randomUUID(),
    displayName: "Default Admin",
    contactEmail: email,
    contactPhone: null,
    location: null,
    city: null,
    dietaryPreference: null,
    role: "admin",
    passwordHash: hashPassword(password),
    passwordSetAt: now,
    status: "active",
    unsubscribedAt: null,
    deletedAt: null,
    createdByAdminId: null,
    createdAt: now,
    updatedAt: now
  };
  insertUser(user);
}

function ensureMealItemColumns() {
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
  addMissingColumns("meal_items", columns);
}

function ensureNutritionPerGramColumns() {
  const columns = nutrientDbColumns().map((column) => [
    `${column}_per_g`,
    columnAllowsNull(column) ? "REAL" : "REAL NOT NULL DEFAULT 0"
  ]);
  addMissingColumns("food_nutrition_references", columns);
  updateNutritionPerGramColumns();
}

function updateNutritionPerGramColumns() {
  db.exec(`
    UPDATE food_nutrition_references SET
      calories_per_g = calories_per_100g / 100.0,
      protein_per_g = protein_per_100g / 100.0,
      carbs_per_g = carbs_per_100g / 100.0,
      fat_per_g = fat_per_100g / 100.0,
      fiber_per_g = fiber_per_100g / 100.0,
      sugar_per_g = sugar_per_100g / 100.0,
      sodium_per_g = sodium_per_100g / 100.0,
      cholesterol_per_g = CASE WHEN cholesterol_per_100g IS NULL THEN NULL ELSE cholesterol_per_100g / 100.0 END,
      saturated_fat_per_g = CASE WHEN saturated_fat_per_100g IS NULL THEN NULL ELSE saturated_fat_per_100g / 100.0 END,
      potassium_per_g = CASE WHEN potassium_per_100g IS NULL THEN NULL ELSE potassium_per_100g / 100.0 END,
      calcium_per_g = CASE WHEN calcium_per_100g IS NULL THEN NULL ELSE calcium_per_100g / 100.0 END,
      iron_per_g = CASE WHEN iron_per_100g IS NULL THEN NULL ELSE iron_per_100g / 100.0 END,
      vitamin_c_per_g = CASE WHEN vitamin_c_per_100g IS NULL THEN NULL ELSE vitamin_c_per_100g / 100.0 END
  `);
}

function nutrientDbColumns() {
  return [
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "sugar",
    "sodium",
    "cholesterol",
    "saturated_fat",
    "potassium",
    "calcium",
    "iron",
    "vitamin_c"
  ];
}

function columnAllowsNull(column) {
  return ["cholesterol", "saturated_fat", "potassium", "calcium", "iron", "vitamin_c"].includes(column);
}

function seedReferenceTablesFromFoodTable() {
  const foodtablePath = path.join(root, "foodtable.md");
  if (!fs.existsSync(foodtablePath)) return;
  const hasNutrition = db.prepare("SELECT COUNT(*) AS count FROM food_nutrition_references").get().count > 0;
  const hasPortions = db.prepare("SELECT COUNT(*) AS count FROM food_portion_references").get().count > 0;
  const hasAliases = db.prepare("SELECT COUNT(*) AS count FROM food_aliases").get().count > 0;
  if (hasNutrition && hasPortions && hasAliases) return;

  const markdown = fs.readFileSync(foodtablePath, "utf8");
  const now = new Date().toISOString();
  const transaction = db.transaction(() => {
    if (!hasNutrition) seedNutritionReferences(parseIngredientRows(markdown), now);
    if (!hasPortions) seedPortionReferences(parsePortionRows(markdown), now);
    if (!hasAliases) seedAliasReferences(now);
  });
  transaction();
}

function seedNutritionReferences(rows, now) {
  const statement = db.prepare(`
    INSERT INTO food_nutrition_references (
      id, food_name, aliases, category, common_state, calories_per_100g,
      protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g,
      sugar_per_100g, sodium_per_100g, source_name, confidence, created_at, updated_at
    ) VALUES (
      @id, @foodName, @aliases, @category, @commonState, @calories, @protein,
      @carbs, @fat, @fiber, @sugar, @sodium, @sourceName, @confidence, @createdAt, @updatedAt
    )
    ON CONFLICT(food_name) DO UPDATE SET
      category = excluded.category,
      common_state = excluded.common_state,
      calories_per_100g = excluded.calories_per_100g,
      protein_per_100g = excluded.protein_per_100g,
      carbs_per_100g = excluded.carbs_per_100g,
      fat_per_100g = excluded.fat_per_100g,
      fiber_per_100g = excluded.fiber_per_100g,
      sugar_per_100g = excluded.sugar_per_100g,
      sodium_per_100g = excluded.sodium_per_100g,
      source_name = excluded.source_name,
      confidence = excluded.confidence,
      updated_at = excluded.updated_at
  `);
  rows.forEach((row) => {
    statement.run({
      id: crypto.randomUUID(),
      foodName: row.name,
      aliases: defaultAliasesFor(row.name).join(", "),
      category: row.category,
      commonState: row.commonState,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
      sugar: row.sugar,
      sodium: row.sodium,
      sourceName: "foodtable.md seed",
      confidence: String(row.dataConfidence || "medium").toLowerCase(),
      createdAt: now,
      updatedAt: now
    });
  });
}

function seedPortionReferences(rows, now) {
  const statement = db.prepare(`
    INSERT INTO food_portion_references (
      id, food_name, unit, small_grams, medium_grams, large_grams, default_size,
      default_grams, nutrition_basis, notes, source_name, confidence, created_at, updated_at
    ) VALUES (
      @id, @foodName, @unit, @smallGrams, @mediumGrams, @largeGrams, @defaultSize,
      @defaultGrams, @nutritionBasis, @notes, @sourceName, @confidence, @createdAt, @updatedAt
    )
    ON CONFLICT(food_name, unit) DO UPDATE SET
      small_grams = excluded.small_grams,
      medium_grams = excluded.medium_grams,
      large_grams = excluded.large_grams,
      default_size = excluded.default_size,
      default_grams = excluded.default_grams,
      nutrition_basis = excluded.nutrition_basis,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `);
  rows.forEach((row) => {
    statement.run({
      id: crypto.randomUUID(),
      foodName: row.foodName,
      unit: row.unit,
      smallGrams: row.smallGrams,
      mediumGrams: row.mediumGrams,
      largeGrams: row.largeGrams,
      defaultSize: row.defaultSize,
      defaultGrams: row[row.defaultSize ? `${row.defaultSize}Grams` : "mediumGrams"] || row.mediumGrams,
      nutritionBasis: row.nutritionBasis,
      notes: row.notes,
      sourceName: "foodtable.md seed",
      confidence: "medium",
      createdAt: now,
      updatedAt: now
    });
  });
}

function seedAliasReferences(now) {
  const aliases = [
    ["plain white rice", "Rice", 10],
    ["white rice", "Rice", 10],
    ["cooked white rice", "Rice", 10],
    ["dal", "Lentils", 10],
    ["lentil curry", "Lentils", 10],
    ["lentils", "Lentils", 10],
    ["roti", "Roti", 10],
    ["chapati", "Chapati", 10],
    ["phulka", "Chapati", 20],
    ["wheat flatbread", "Chapati", 20],
    ["egg", "Egg", 10],
    ["eggs", "Egg", 10],
    ["fried egg", "Egg", 15],
    ["sunny side egg", "Egg", 20],
    ["curd", "Yogurt", 10],
    ["yoghurt", "Yogurt", 10],
    ["plain yogurt", "Yogurt", 10],
    ["salad onion", "Onion", 20],
    ["onion slices", "Onion", 10],
    ["sliced onion", "Onion", 10]
  ];
  const statement = db.prepare(`
    INSERT INTO food_aliases (id, alias, canonical_food_name, match_priority, created_at)
    VALUES (@id, @alias, @canonicalFoodName, @matchPriority, @createdAt)
    ON CONFLICT(alias) DO UPDATE SET
      canonical_food_name = excluded.canonical_food_name,
      match_priority = excluded.match_priority
  `);
  aliases.forEach(([alias, canonicalFoodName, matchPriority]) => {
    statement.run({
      id: crypto.randomUUID(),
      alias,
      canonicalFoodName,
      matchPriority,
      createdAt: now
    });
  });
}

function applyCuratedSourceOverrides() {
  const now = new Date().toISOString();
  const sourceUrl = "https://fdc.nal.usda.gov/";
  const ifctSourceUrl = "https://www.nin.res.in/ebooks/IFCT2017.pdf";
  const rows = [
    {
      foodName: "Rice",
      aliases: "rice, white rice, plain white rice, cooked white rice",
      category: "Grain",
      commonState: "Cooked white rice",
      calories: 130,
      protein: 2.69,
      carbs: 28.17,
      fat: 0.28,
      fiber: 0.4,
      sugar: 0.05,
      sodium: 1,
      potassium: 35,
      calcium: 10,
      iron: 0.2,
      vitaminC: 0,
      sourceName: "USDA FoodData Central",
      sourceUrl,
      confidence: "high"
    },
    {
      foodName: "Onion",
      aliases: "onion, onions, raw onion, onion slices, sliced onion, salad onion",
      category: "Vegetable",
      commonState: "Raw",
      calories: 40,
      protein: 1.1,
      carbs: 9.34,
      fat: 0.1,
      fiber: 1.7,
      sugar: 4.24,
      sodium: 4,
      potassium: 146,
      calcium: 23,
      iron: 0.21,
      vitaminC: 7.4,
      sourceName: "USDA FoodData Central",
      sourceUrl,
      confidence: "high"
    },
    {
      foodName: "Yogurt",
      aliases: "yogurt, yoghurt, curd, plain yogurt, plain curd",
      category: "Dairy",
      commonState: "Plain whole milk",
      calories: 61,
      protein: 3.47,
      carbs: 4.66,
      fat: 3.25,
      fiber: 0,
      sugar: 4.66,
      sodium: 46,
      cholesterol: 13,
      saturatedFat: 2.1,
      potassium: 155,
      calcium: 121,
      iron: 0.05,
      vitaminC: 0.5,
      sourceName: "USDA FoodData Central",
      sourceUrl,
      confidence: "high"
    },
    {
      foodName: "Chicken breast",
      aliases: "chicken breast, cooked chicken breast, grilled chicken breast",
      category: "Protein",
      commonState: "Cooked skinless",
      calories: 165,
      protein: 31.02,
      carbs: 0,
      fat: 3.57,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      cholesterol: 85,
      saturatedFat: 1.01,
      potassium: 256,
      calcium: 15,
      iron: 1.04,
      vitaminC: 0,
      sourceName: "USDA FoodData Central",
      sourceUrl,
      confidence: "high"
    },
    {
      foodName: "Potato",
      aliases: "potato, baked potato, boiled potato",
      category: "Vegetable",
      commonState: "Baked flesh and skin",
      calories: 93,
      protein: 2.5,
      carbs: 21.15,
      fat: 0.13,
      fiber: 2.2,
      sugar: 1.18,
      sodium: 10,
      potassium: 535,
      calcium: 10,
      iron: 1.08,
      vitaminC: 9.6,
      sourceName: "USDA FoodData Central",
      sourceUrl,
      confidence: "high"
    },
    {
      foodName: "Apple",
      aliases: "apple, raw apple, apple with skin",
      category: "Fruit",
      commonState: "Raw with skin",
      calories: 52,
      protein: 0.26,
      carbs: 13.81,
      fat: 0.17,
      fiber: 2.4,
      sugar: 10.39,
      sodium: 1,
      potassium: 107,
      calcium: 6,
      iron: 0.12,
      vitaminC: 4.6,
      sourceName: "USDA FoodData Central",
      sourceUrl,
      confidence: "high"
    },
    {
      foodName: "Lentils",
      aliases: "lentils, cooked lentils, dal, lentil curry",
      category: "Legume",
      commonState: "Cooked",
      calories: 116,
      protein: 9.02,
      carbs: 20.13,
      fat: 0.38,
      fiber: 7.9,
      sugar: 1.8,
      sodium: 2,
      potassium: 369,
      calcium: 19,
      iron: 3.33,
      vitaminC: 1.5,
      sourceName: "USDA FoodData Central",
      sourceUrl,
      confidence: "high"
    },
    {
      foodName: "Egg",
      aliases: "egg, eggs, whole egg, cooked egg, fried egg, sunny side egg",
      category: "Protein",
      commonState: "Whole cooked",
      calories: 155,
      protein: 12.58,
      carbs: 1.12,
      fat: 10.61,
      fiber: 0,
      sugar: 1.12,
      sodium: 124,
      cholesterol: 373,
      saturatedFat: 3.27,
      potassium: 126,
      calcium: 50,
      iron: 1.19,
      vitaminC: 0,
      sourceName: "USDA FoodData Central",
      sourceUrl,
      confidence: "high"
    },
    {
      foodName: "Chapati",
      sourceName: "ICMR-NIN IFCT 2017; recipe-derived estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "medium"
    },
    {
      foodName: "Roti",
      sourceName: "ICMR-NIN IFCT 2017; recipe-derived estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "medium"
    },
    {
      foodName: "White rice",
      sourceName: "ICMR-NIN IFCT 2017; cooked-yield estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "high"
    },
    {
      foodName: "Brown rice",
      sourceName: "ICMR-NIN IFCT 2017; cooked-yield estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "high"
    },
    {
      foodName: "Rice",
      sourceName: "ICMR-NIN IFCT 2017; cooked-yield estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "high"
    },
    {
      foodName: "Curd",
      sourceName: "ICMR-NIN IFCT 2017; Indian dairy reference estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "medium"
    },
    {
      foodName: "Paneer",
      sourceName: "ICMR-NIN IFCT 2017; Indian dairy reference estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "medium"
    },
    {
      foodName: "Idli",
      sourceName: "ICMR-NIN IFCT 2017; recipe-derived estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "medium"
    },
    {
      foodName: "Dosa",
      sourceName: "ICMR-NIN IFCT 2017; recipe-derived estimate",
      sourceUrl: ifctSourceUrl,
      confidence: "medium"
    },
    {
      foodName: "Curry leaves",
      sourceName: "ICMR-NIN IFCT 2017; Indian ingredient reference",
      sourceUrl: ifctSourceUrl,
      confidence: "medium"
    }
  ];

  const statement = db.prepare(`
    INSERT INTO food_nutrition_references (
      id, food_name, aliases, category, common_state, calories_per_100g,
      protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g,
      sugar_per_100g, sodium_per_100g, cholesterol_per_100g,
      saturated_fat_per_100g, potassium_per_100g, calcium_per_100g,
      iron_per_100g, vitamin_c_per_100g, source_name, source_url,
      confidence, status, created_at, updated_at
    ) VALUES (
      @id, @foodName, @aliases, @category, @commonState, @calories, @protein,
      @carbs, @fat, @fiber, @sugar, @sodium, @cholesterol, @saturatedFat,
      @potassium, @calcium, @iron, @vitaminC, @sourceName, @sourceUrl,
      @confidence, 'active', @createdAt, @updatedAt
    )
    ON CONFLICT(food_name) DO UPDATE SET
      aliases = COALESCE(excluded.aliases, food_nutrition_references.aliases),
      category = COALESCE(excluded.category, food_nutrition_references.category),
      common_state = COALESCE(excluded.common_state, food_nutrition_references.common_state),
      calories_per_100g = COALESCE(excluded.calories_per_100g, food_nutrition_references.calories_per_100g),
      protein_per_100g = COALESCE(excluded.protein_per_100g, food_nutrition_references.protein_per_100g),
      carbs_per_100g = COALESCE(excluded.carbs_per_100g, food_nutrition_references.carbs_per_100g),
      fat_per_100g = COALESCE(excluded.fat_per_100g, food_nutrition_references.fat_per_100g),
      fiber_per_100g = COALESCE(excluded.fiber_per_100g, food_nutrition_references.fiber_per_100g),
      sugar_per_100g = COALESCE(excluded.sugar_per_100g, food_nutrition_references.sugar_per_100g),
      sodium_per_100g = COALESCE(excluded.sodium_per_100g, food_nutrition_references.sodium_per_100g),
      cholesterol_per_100g = COALESCE(excluded.cholesterol_per_100g, food_nutrition_references.cholesterol_per_100g),
      saturated_fat_per_100g = COALESCE(excluded.saturated_fat_per_100g, food_nutrition_references.saturated_fat_per_100g),
      potassium_per_100g = COALESCE(excluded.potassium_per_100g, food_nutrition_references.potassium_per_100g),
      calcium_per_100g = COALESCE(excluded.calcium_per_100g, food_nutrition_references.calcium_per_100g),
      iron_per_100g = COALESCE(excluded.iron_per_100g, food_nutrition_references.iron_per_100g),
      vitamin_c_per_100g = COALESCE(excluded.vitamin_c_per_100g, food_nutrition_references.vitamin_c_per_100g),
      source_name = excluded.source_name,
      source_url = excluded.source_url,
      confidence = excluded.confidence,
      status = 'active',
      updated_at = excluded.updated_at
  `);

  const transaction = db.transaction(() => {
    rows.filter((row) => row.calories !== undefined).forEach((row) => {
      statement.run({
        id: crypto.randomUUID(),
        aliases: null,
        category: null,
        commonState: null,
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
        fiber: null,
        sugar: null,
        sodium: null,
        cholesterol: null,
        saturatedFat: null,
        potassium: null,
        calcium: null,
        iron: null,
        vitaminC: null,
        createdAt: now,
        updatedAt: now,
        ...row
      });
    });
    rows.filter((row) => row.calories === undefined).forEach((row) => {
      db.prepare(`
        UPDATE food_nutrition_references
        SET source_name = @sourceName,
            source_url = @sourceUrl,
            confidence = @confidence,
            updated_at = @updatedAt
        WHERE food_name = @foodName
      `).run({
        foodName: row.foodName,
        sourceName: row.sourceName,
        sourceUrl: row.sourceUrl,
        confidence: row.confidence,
        updatedAt: now
      });
    });
    seedAliasReferences(now);
  });
  transaction();
}

function seedGeographyReferenceTables() {
  const now = new Date().toISOString();
  const transaction = db.transaction(() => {
    const indiaId = upsertCountry({ iso2: "IN", name: "India", now });
    const gujaratId = upsertRegion({
      countryId: indiaId,
      regionCode: "GJ",
      name: "Gujarat",
      regionType: "state",
      now
    });
    const ifctId = upsertFoodSourceReference({
      sourceName: "ICMR-NIN Indian Food Composition Tables 2017",
      sourceUrl: "https://www.nin.res.in/ebooks/IFCT2017.pdf",
      countryId: indiaId,
      sourceType: "food_composition_database",
      qualityTier: "official",
      notes: "Primary India-specific food composition source for raw ingredients and base foods.",
      now
    });
    const faostatId = upsertFoodSourceReference({
      sourceName: "FAOSTAT",
      sourceUrl: "https://www.fao.org/statistics/en/",
      countryId: null,
      sourceType: "production_and_food_supply_statistics",
      qualityTier: "official",
      notes: "Use for staple relevance, crop production, and food supply signals by country.",
      now
    });
    upsertFoodSourceReference({
      sourceName: "FAO/INFOODS food composition database directory",
      sourceUrl: "https://www.fao.org/infoods/infoods/tables-and-databases/en/",
      countryId: null,
      sourceType: "source_directory",
      qualityTier: "official",
      notes: "Use to discover country-specific food composition tables before adding new countries.",
      now
    });
    upsertFoodSourceReference({
      sourceName: "FAO/WHO GIFT",
      sourceUrl: "https://www.fao.org/gift-individual-food-consumption/en",
      countryId: null,
      sourceType: "food_consumption_surveys",
      qualityTier: "official",
      notes: "Use for dietary pattern and food consumption survey context where available.",
      now
    });

    [
      ["Wheat flour", "gehu atta", "Wheat flour", "Grain", "direct", "high"],
      ["Rice", "chokha", "Rice", "Grain", "cooked-yield", "high"],
      ["Chapati", "rotli", "Chapati", "Flatbread", "recipe-derived", "medium"],
      ["Roti", "rotli", "Roti", "Flatbread", "recipe-derived", "medium"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Chickpea", "chana", "Chickpea", "Legume", "direct", "medium"],
      ["Peanut", "singdana", "Peanut", "Nut and seed", "direct", "medium"],
      ["Curd", "dahi", "Curd", "Dairy", "direct", "medium"],
      ["Milk", "doodh", "Milk", "Dairy", "direct", "medium"],
      ["Paneer", "paneer", "Paneer", "Dairy", "direct", "medium"],
      ["Potato", "bataka", "Potato", "Vegetable", "direct", "high"],
      ["Onion", "dungli", "Onion", "Vegetable", "direct", "high"],
      ["Tomato", "tameta", "Tomato", "Vegetable", "direct", "medium"],
      ["Banana", "kela", "Banana", "Fruit", "direct", "medium"],
      ["Mango", "keri", "Mango", "Fruit", "direct", "medium"],
      ["Apple", "safarjan", "Apple", "Fruit", "direct", "high"],
      ["Pearl millet", "bajra", "Pearl millet", "Millet", "direct", "medium"],
      ["Sorghum", "jowar", "Sorghum", "Millet", "direct", "medium"],
      ["Fenugreek leaves", "methi", "Fenugreek leaves", "Leafy vegetable", "direct", "medium"],
      ["Curry leaves", "limdo", "Curry leaves", "Herb", "direct", "medium"]
    ].forEach(([foodName, localName, canonicalFoodName, foodGroup, sourceBasis, confidence]) => {
      upsertRegionalFoodItem({
        countryId: indiaId,
        regionId: gujaratId,
        foodName,
        localName,
        canonicalFoodName,
        foodGroup,
        sourceId: ifctId,
        sourceBasis,
        confidence,
        now
      });
    });

    [
      ["Wheat flour", 1, "Core staple grain for Gujarati flatbreads; confirm ranking with FAOSTAT and regional consumption surveys."],
      ["Rice", 2, "Common staple grain; confirm rank from food balance and regional consumption evidence."],
      ["Lentils", 3, "Common pulse base for dal; regional recipe and pulse type varies."],
      ["Pearl millet", 4, "Important regional millet staple; season and district patterns vary."],
      ["Potato", 5, "Common vegetable in Gujarati meals; rank is MVP estimate pending source refinement."],
      ["Onion", 6, "Common vegetable and garnish; rank is MVP estimate pending source refinement."],
      ["Curd", 7, "Common dairy side; rank is MVP estimate pending source refinement."],
      ["Peanut", 8, "Common regional oilseed and snack ingredient; rank is MVP estimate pending source refinement."]
    ].forEach(([canonicalFoodName, stapleRank, evidenceNote]) => {
      upsertRegionalStapleRanking({
        countryId: indiaId,
        regionId: gujaratId,
        canonicalFoodName,
        stapleRank,
        evidenceSourceId: faostatId,
        evidenceNote,
        now
      });
    });

    seedIndianStateStarterData({ countryId: indiaId, ifctId, faostatId, now });
  });
  transaction();
}

function seedIndianStateStarterData({ countryId, ifctId, faostatId, now }) {
  const regions = [
    ["AP", "Andhra Pradesh", "state"],
    ["AR", "Arunachal Pradesh", "state"],
    ["AS", "Assam", "state"],
    ["BR", "Bihar", "state"],
    ["CT", "Chhattisgarh", "state"],
    ["GA", "Goa", "state"],
    ["GJ", "Gujarat", "state"],
    ["HR", "Haryana", "state"],
    ["HP", "Himachal Pradesh", "state"],
    ["JH", "Jharkhand", "state"],
    ["KA", "Karnataka", "state"],
    ["KL", "Kerala", "state"],
    ["MP", "Madhya Pradesh", "state"],
    ["MH", "Maharashtra", "state"],
    ["MN", "Manipur", "state"],
    ["ML", "Meghalaya", "state"],
    ["MZ", "Mizoram", "state"],
    ["NL", "Nagaland", "state"],
    ["OD", "Odisha", "state"],
    ["PB", "Punjab", "state"],
    ["RJ", "Rajasthan", "state"],
    ["SK", "Sikkim", "state"],
    ["TN", "Tamil Nadu", "state"],
    ["TG", "Telangana", "state"],
    ["TR", "Tripura", "state"],
    ["UP", "Uttar Pradesh", "state"],
    ["UT", "Uttarakhand", "state"],
    ["WB", "West Bengal", "state"],
    ["AN", "Andaman and Nicobar Islands", "union_territory"],
    ["CH", "Chandigarh", "union_territory"],
    ["DN", "Dadra and Nagar Haveli and Daman and Diu", "union_territory"],
    ["DL", "Delhi", "union_territory"],
    ["JK", "Jammu and Kashmir", "union_territory"],
    ["LA", "Ladakh", "union_territory"],
    ["LD", "Lakshadweep", "union_territory"],
    ["PY", "Puducherry", "union_territory"]
  ];
  const regionIds = Object.fromEntries(regions.map(([regionCode, name, regionType]) => [
    name,
    upsertRegion({ countryId, regionCode, name, regionType, now })
  ]));

  const stateFoodSeeds = {
    "Andhra Pradesh": [
      ["Rice", "biyyam", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "pappu", "Lentils", "Legume", "direct", "high"],
      ["Tamarind", "chintapandu", "Tamarind", "Fruit", "direct", "medium"],
      ["Chili pepper", "mirapakaya", "Chili pepper", "Vegetable", "direct", "medium"]
    ],
    "Arunachal Pradesh": [
      ["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"],
      ["Millet", "millet", "Millet", "Millet", "direct", "medium"],
      ["Leafy greens", "leafy greens", "Leafy greens", "Leafy vegetable", "direct", "low"],
      ["Fish", "fish", "Fish", "Protein", "direct", "medium"]
    ],
    "Assam": [
      ["Rice", "bhaat", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Fish", "maas", "Fish", "Protein", "direct", "medium"],
      ["Mustard oil", "soriyoh tel", "Mustard oil", "Oil", "direct", "medium"]
    ],
    "Bihar": [
      ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"],
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Potato", "aloo", "Potato", "Vegetable", "direct", "high"]
    ],
    "Chhattisgarh": [
      ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Leafy greens", "bhaji", "Leafy greens", "Leafy vegetable", "direct", "low"],
      ["Chickpea", "chana", "Chickpea", "Legume", "direct", "medium"]
    ],
    "Goa": [
      ["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"],
      ["Fish", "fish", "Fish", "Protein", "direct", "medium"],
      ["Coconut", "coconut", "Coconut", "Nut and seed", "direct", "medium"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"]
    ],
    "Gujarat": [
      ["Wheat flour", "gehu atta", "Wheat flour", "Grain", "direct", "high"],
      ["Rice", "chokha", "Rice", "Grain", "cooked-yield", "high"],
      ["Pearl millet", "bajra", "Pearl millet", "Millet", "direct", "medium"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"]
    ],
    "Haryana": [
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Milk", "doodh", "Milk", "Dairy", "direct", "medium"],
      ["Curd", "dahi", "Curd", "Dairy", "direct", "medium"],
      ["Pearl millet", "bajra", "Pearl millet", "Millet", "direct", "medium"]
    ],
    "Himachal Pradesh": [
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Apple", "seb", "Apple", "Fruit", "direct", "high"]
    ],
    "Jharkhand": [
      ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Leafy greens", "saag", "Leafy greens", "Leafy vegetable", "direct", "low"],
      ["Potato", "aloo", "Potato", "Vegetable", "direct", "high"]
    ],
    "Karnataka": [
      ["Rice", "akki", "Rice", "Grain", "cooked-yield", "high"],
      ["Ragi", "ragi", "Ragi", "Millet", "direct", "medium"],
      ["Lentils", "bele", "Lentils", "Legume", "direct", "high"],
      ["Coconut", "tengina kai", "Coconut", "Nut and seed", "direct", "medium"]
    ],
    "Kerala": [
      ["Rice", "ari", "Rice", "Grain", "cooked-yield", "high"],
      ["Coconut", "thenga", "Coconut", "Nut and seed", "direct", "medium"],
      ["Fish", "meen", "Fish", "Protein", "direct", "medium"],
      ["Banana", "pazham", "Banana", "Fruit", "direct", "medium"]
    ],
    "Madhya Pradesh": [
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Soybean", "soybean", "Soybean", "Legume", "direct", "medium"]
    ],
    "Maharashtra": [
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Sorghum", "jowar", "Sorghum", "Millet", "direct", "medium"],
      ["Rice", "tandul", "Rice", "Grain", "cooked-yield", "high"],
      ["Peanut", "shengdana", "Peanut", "Nut and seed", "direct", "medium"]
    ],
    "Manipur": [
      ["Rice", "chak", "Rice", "Grain", "cooked-yield", "high"],
      ["Fish", "nga", "Fish", "Protein", "direct", "medium"],
      ["Leafy greens", "greens", "Leafy greens", "Leafy vegetable", "direct", "low"],
      ["Bamboo shoot", "bamboo shoot", "Bamboo shoot", "Vegetable", "direct", "low"]
    ],
    "Meghalaya": [
      ["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"],
      ["Millet", "millet", "Millet", "Millet", "direct", "medium"],
      ["Pork", "pork", "Pork", "Protein", "direct", "medium"],
      ["Leafy greens", "greens", "Leafy greens", "Leafy vegetable", "direct", "low"]
    ],
    "Mizoram": [
      ["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"],
      ["Leafy greens", "greens", "Leafy greens", "Leafy vegetable", "direct", "low"],
      ["Pork", "pork", "Pork", "Protein", "direct", "medium"],
      ["Bamboo shoot", "bamboo shoot", "Bamboo shoot", "Vegetable", "direct", "low"]
    ],
    "Nagaland": [
      ["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"],
      ["Pork", "pork", "Pork", "Protein", "direct", "medium"],
      ["Bamboo shoot", "bamboo shoot", "Bamboo shoot", "Vegetable", "direct", "low"],
      ["Leafy greens", "greens", "Leafy greens", "Leafy vegetable", "direct", "low"]
    ],
    "Odisha": [
      ["Rice", "chaula", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Fish", "machha", "Fish", "Protein", "direct", "medium"],
      ["Potato", "aloo", "Potato", "Vegetable", "direct", "high"]
    ],
    "Punjab": [
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"],
      ["Milk", "dudh", "Milk", "Dairy", "direct", "medium"],
      ["Chickpea", "chana", "Chickpea", "Legume", "direct", "medium"]
    ],
    "Rajasthan": [
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Pearl millet", "bajra", "Pearl millet", "Millet", "direct", "medium"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Curd", "dahi", "Curd", "Dairy", "direct", "medium"]
    ],
    "Sikkim": [
      ["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"],
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Leafy greens", "greens", "Leafy greens", "Leafy vegetable", "direct", "low"],
      ["Milk", "milk", "Milk", "Dairy", "direct", "medium"]
    ],
    "Tamil Nadu": [
      ["Rice", "arisi", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "paruppu", "Lentils", "Legume", "direct", "high"],
      ["Coconut", "thengai", "Coconut", "Nut and seed", "direct", "medium"],
      ["Tamarind", "puli", "Tamarind", "Fruit", "direct", "medium"]
    ],
    "Telangana": [
      ["Rice", "biyyam", "Rice", "Grain", "cooked-yield", "high"],
      ["Sorghum", "jowar", "Sorghum", "Millet", "direct", "medium"],
      ["Lentils", "pappu", "Lentils", "Legume", "direct", "high"],
      ["Chili pepper", "mirapakaya", "Chili pepper", "Vegetable", "direct", "medium"]
    ],
    "Tripura": [
      ["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"],
      ["Fish", "fish", "Fish", "Protein", "direct", "medium"],
      ["Leafy greens", "greens", "Leafy greens", "Leafy vegetable", "direct", "low"],
      ["Bamboo shoot", "bamboo shoot", "Bamboo shoot", "Vegetable", "direct", "low"]
    ],
    "Uttar Pradesh": [
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Potato", "aloo", "Potato", "Vegetable", "direct", "high"]
    ],
    "Uttarakhand": [
      ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"],
      ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"],
      ["Finger millet", "mandua", "Ragi", "Millet", "direct", "medium"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"]
    ],
    "West Bengal": [
      ["Rice", "bhaat", "Rice", "Grain", "cooked-yield", "high"],
      ["Fish", "machh", "Fish", "Protein", "direct", "medium"],
      ["Lentils", "dal", "Lentils", "Legume", "direct", "high"],
      ["Mustard oil", "shorsher tel", "Mustard oil", "Oil", "direct", "medium"]
    ]
  };

  const unionTerritoryFallbacks = {
    "Andaman and Nicobar Islands": [["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"], ["Fish", "fish", "Fish", "Protein", "direct", "medium"], ["Coconut", "coconut", "Coconut", "Nut and seed", "direct", "medium"]],
    "Chandigarh": [["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"], ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"], ["Milk", "doodh", "Milk", "Dairy", "direct", "medium"]],
    "Dadra and Nagar Haveli and Daman and Diu": [["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"], ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"], ["Fish", "fish", "Fish", "Protein", "direct", "medium"]],
    "Delhi": [["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"], ["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"], ["Lentils", "dal", "Lentils", "Legume", "direct", "high"]],
    "Jammu and Kashmir": [["Rice", "chawal", "Rice", "Grain", "cooked-yield", "high"], ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"], ["Apple", "seb", "Apple", "Fruit", "direct", "high"]],
    "Ladakh": [["Barley", "nas", "Barley", "Grain", "direct", "medium"], ["Wheat flour", "atta", "Wheat flour", "Grain", "direct", "high"], ["Milk", "milk", "Milk", "Dairy", "direct", "medium"]],
    "Lakshadweep": [["Rice", "rice", "Rice", "Grain", "cooked-yield", "high"], ["Fish", "fish", "Fish", "Protein", "direct", "medium"], ["Coconut", "coconut", "Coconut", "Nut and seed", "direct", "medium"]],
    "Puducherry": [["Rice", "arisi", "Rice", "Grain", "cooked-yield", "high"], ["Lentils", "paruppu", "Lentils", "Legume", "direct", "high"], ["Coconut", "thengai", "Coconut", "Nut and seed", "direct", "medium"]]
  };

  Object.entries({ ...stateFoodSeeds, ...unionTerritoryFallbacks }).forEach(([regionName, foods]) => {
    const regionId = regionIds[regionName];
    if (!regionId) return;
    foods.forEach(([foodName, localName, canonicalFoodName, foodGroup, sourceBasis, confidence], index) => {
      upsertRegionalFoodItem({
        countryId,
        regionId,
        foodName,
        localName,
        canonicalFoodName,
        foodGroup,
        sourceId: ifctId,
        sourceBasis,
        confidence,
        now
      });
      upsertRegionalStapleRanking({
        countryId,
        regionId,
        canonicalFoodName,
        stapleRank: index + 1,
        evidenceSourceId: faostatId,
        evidenceNote: "Starter regional staple candidate. Verify and refine with state-level consumption surveys, FAOSTAT signals, and official food composition data before treating as complete.",
        now
      });
    });
  });
}

function upsertCountry({ iso2, name, now }) {
  db.prepare(`
    INSERT INTO countries (id, iso2, name, created_at, updated_at)
    VALUES (@id, @iso2, @name, @createdAt, @updatedAt)
    ON CONFLICT(iso2) DO UPDATE SET
      name = excluded.name,
      updated_at = excluded.updated_at
  `).run({
    id: crypto.randomUUID(),
    iso2,
    name,
    createdAt: now,
    updatedAt: now
  });
  return db.prepare("SELECT id FROM countries WHERE iso2 = ?").get(iso2).id;
}

function upsertRegion({ countryId, regionCode, name, regionType, now }) {
  db.prepare(`
    INSERT INTO regions (id, country_id, region_code, name, region_type, created_at, updated_at)
    VALUES (@id, @countryId, @regionCode, @name, @regionType, @createdAt, @updatedAt)
    ON CONFLICT(country_id, name) DO UPDATE SET
      region_code = excluded.region_code,
      region_type = excluded.region_type,
      updated_at = excluded.updated_at
  `).run({
    id: crypto.randomUUID(),
    countryId,
    regionCode,
    name,
    regionType,
    createdAt: now,
    updatedAt: now
  });
  return db.prepare("SELECT id FROM regions WHERE country_id = ? AND name = ?").get(countryId, name).id;
}

function upsertFoodSourceReference({ sourceName, sourceUrl, countryId, sourceType, qualityTier, notes, now }) {
  db.prepare(`
    INSERT INTO food_source_references (
      id, source_name, source_url, country_id, source_type, quality_tier,
      notes, created_at, updated_at
    ) VALUES (
      @id, @sourceName, @sourceUrl, @countryId, @sourceType, @qualityTier,
      @notes, @createdAt, @updatedAt
    )
    ON CONFLICT(source_name, source_url) DO UPDATE SET
      country_id = excluded.country_id,
      source_type = excluded.source_type,
      quality_tier = excluded.quality_tier,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `).run({
    id: crypto.randomUUID(),
    sourceName,
    sourceUrl,
    countryId,
    sourceType,
    qualityTier,
    notes,
    createdAt: now,
    updatedAt: now
  });
  return db.prepare("SELECT id FROM food_source_references WHERE source_name = ? AND source_url = ?").get(sourceName, sourceUrl).id;
}

function upsertRegionalFoodItem({ countryId, regionId, foodName, localName, canonicalFoodName, foodGroup, sourceId, sourceBasis, confidence, now }) {
  db.prepare(`
    INSERT INTO regional_food_items (
      id, country_id, region_id, food_name, local_name, canonical_food_name,
      food_group, source_id, source_basis, confidence, status, created_at, updated_at
    ) VALUES (
      @id, @countryId, @regionId, @foodName, @localName, @canonicalFoodName,
      @foodGroup, @sourceId, @sourceBasis, @confidence, 'active', @createdAt, @updatedAt
    )
    ON CONFLICT(country_id, region_id, canonical_food_name, local_name) DO UPDATE SET
      food_name = excluded.food_name,
      food_group = excluded.food_group,
      source_id = excluded.source_id,
      source_basis = excluded.source_basis,
      confidence = excluded.confidence,
      status = 'active',
      updated_at = excluded.updated_at
  `).run({
    id: crypto.randomUUID(),
    countryId,
    regionId,
    foodName,
    localName,
    canonicalFoodName,
    foodGroup,
    sourceId,
    sourceBasis,
    confidence,
    createdAt: now,
    updatedAt: now
  });
}

function upsertRegionalStapleRanking({ countryId, regionId, canonicalFoodName, stapleRank, evidenceSourceId, evidenceNote, now }) {
  db.prepare(`
    INSERT INTO regional_staple_rankings (
      id, country_id, region_id, canonical_food_name, staple_rank,
      evidence_source_id, evidence_note, created_at, updated_at
    ) VALUES (
      @id, @countryId, @regionId, @canonicalFoodName, @stapleRank,
      @evidenceSourceId, @evidenceNote, @createdAt, @updatedAt
    )
    ON CONFLICT(country_id, region_id, canonical_food_name) DO UPDATE SET
      staple_rank = excluded.staple_rank,
      evidence_source_id = excluded.evidence_source_id,
      evidence_note = excluded.evidence_note,
      updated_at = excluded.updated_at
  `).run({
    id: crypto.randomUUID(),
    countryId,
    regionId,
    canonicalFoodName,
    stapleRank,
    evidenceSourceId,
    evidenceNote,
    createdAt: now,
    updatedAt: now
  });
}

function parseIngredientRows(markdown) {
  const inSection = markdown.split("## Ingredient Nutrition Reference Baseline")[1] || "";
  return inSection
    .split(/\r?\n/)
    .filter((line) => /^\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*\d/.test(line))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells) => ({
      name: cells[1],
      category: cells[2],
      commonState: cells[3],
      calories: number(cells[4]),
      protein: number(cells[5]),
      carbs: number(cells[6]),
      fat: number(cells[7]),
      fiber: number(cells[8]),
      sugar: number(cells[9]),
      sodium: number(cells[10]),
      dataConfidence: cells[11],
      notes: cells[12] || ""
    }))
    .filter((item) => item.name && item.calories);
}

function parsePortionRows(markdown) {
  const section = markdown.split("## Portion Size Reference")[1] || "";
  const beforeNextSection = section.split(/\n##\s+/)[0] || "";
  return beforeNextSection
    .split(/\r?\n/)
    .filter((line) => /^\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*\d/.test(line))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells) => ({
      foodName: cells[1],
      unit: normalizeUnit(cells[2]),
      smallGrams: number(cells[3]),
      mediumGrams: number(cells[4]),
      largeGrams: number(cells[5]),
      defaultSize: cells[6] || "medium",
      nutritionBasis: cells[7] || "per_100g",
      notes: cells[8] || ""
    }))
    .filter((item) => item.foodName && item.mediumGrams);
}

function hydrateNutritionReference(row) {
  return {
    id: row.id,
    name: row.food_name,
    aliases: row.aliases || "",
    category: row.category || "",
    commonState: row.common_state || "",
    calories: row.calories_per_100g,
    protein: row.protein_per_100g,
    carbs: row.carbs_per_100g,
    fat: row.fat_per_100g,
    fiber: row.fiber_per_100g,
    sugar: row.sugar_per_100g,
    sodium: row.sodium_per_100g,
    cholesterol: row.cholesterol_per_100g,
    saturatedFat: row.saturated_fat_per_100g,
    potassium: row.potassium_per_100g,
    calcium: row.calcium_per_100g,
    iron: row.iron_per_100g,
    vitaminC: row.vitamin_c_per_100g,
    nutritionPerGram: {
      calories: row.calories_per_g,
      protein: row.protein_per_g,
      carbs: row.carbs_per_g,
      fat: row.fat_per_g,
      fiber: row.fiber_per_g,
      sugar: row.sugar_per_g,
      sodium: row.sodium_per_g,
      cholesterol: row.cholesterol_per_g,
      saturatedFat: row.saturated_fat_per_g,
      potassium: row.potassium_per_g,
      calcium: row.calcium_per_g,
      iron: row.iron_per_g,
      vitaminC: row.vitamin_c_per_g
    },
    dataConfidence: row.confidence,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    per100: true
  };
}

function hydratePortionReference(row) {
  return {
    id: row.id,
    foodName: row.food_name,
    unit: row.unit,
    smallGrams: row.small_grams,
    mediumGrams: row.medium_grams,
    largeGrams: row.large_grams,
    defaultSize: row.default_size,
    defaultGrams: row.default_grams,
    nutritionBasis: row.nutrition_basis,
    notes: row.notes || "",
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    confidence: row.confidence
  };
}

function hydrateCountry(row) {
  return {
    id: row.id,
    iso2: row.iso2,
    name: row.name
  };
}

function hydrateRegion(row) {
  return {
    id: row.id,
    countryId: row.country_id,
    countryIso2: row.country_iso2,
    countryName: row.country_name,
    regionCode: row.region_code || "",
    name: row.name,
    type: row.region_type
  };
}

function hydrateFoodSourceReference(row) {
  return {
    id: row.id,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    countryIso2: row.country_iso2 || "",
    countryName: row.country_name || "",
    sourceType: row.source_type,
    qualityTier: row.quality_tier,
    notes: row.notes || ""
  };
}

function hydrateRegionalFoodItem(row) {
  return {
    id: row.id,
    countryIso2: row.country_iso2,
    countryName: row.country_name,
    regionName: row.region_name || "",
    regionCode: row.region_code || "",
    foodName: row.food_name,
    localName: row.local_name || "",
    canonicalFoodName: row.canonical_food_name,
    foodGroup: row.food_group,
    sourceBasis: row.source_basis,
    confidence: row.confidence,
    sourceName: row.source_name || "",
    sourceUrl: row.source_url || "",
    sourceQuality: row.quality_tier || ""
  };
}

function hydrateRegionalStapleRanking(row) {
  return {
    id: row.id,
    countryIso2: row.country_iso2,
    countryName: row.country_name,
    regionName: row.region_name || "",
    canonicalFoodName: row.canonical_food_name,
    stapleRank: row.staple_rank,
    evidenceSourceName: row.source_name || "",
    evidenceSourceUrl: row.source_url || "",
    evidenceNote: row.evidence_note || ""
  };
}

function scoreFoodSearch(suggestion, query) {
  const name = suggestion.name.toLowerCase();
  const text = suggestion.searchText.toLowerCase();
  if (!query || query.length < 2) return { ...suggestion, score: 50 + (suggestion.scoreOffset || 0) };
  const terms = query.split(/\s+/).filter(Boolean);
  if (!terms.every((term) => text.includes(term))) return null;
  let score = 100;
  if (name === query) score = 0;
  else if (name.startsWith(query)) score = 5;
  else if (name.split(/\s+/).some((word) => word.startsWith(query))) score = 10;
  else if (name.includes(query)) score = 20;
  else score = 40;
  score += suggestion.scoreOffset || 0;
  score += Math.min(20, name.length / 4);
  return { ...suggestion, score };
}

function defaultAliasesFor(foodName) {
  const normalized = foodName.toLowerCase();
  const aliases = new Set();
  aliases.add(normalized);
  if (normalized === "rice") {
    aliases.add("white rice");
    aliases.add("plain white rice");
    aliases.add("cooked white rice");
  }
  return [...aliases];
}

function normalizeSearch(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeUnit(unit) {
  const normalized = String(unit || "").toLowerCase().trim();
  if (normalized === "gram" || normalized === "g") return "grams";
  return normalized;
}

module.exports = {
  createUser,
  listUsers,
  getUser,
  updateUser,
  updateUserRole,
  createUserAccessToken,
  validateMagicLinkToken,
  setupUserPassword,
  loginUser,
  getSession,
  revokeSession,
  unsubscribeUser,
  getUserGoals,
  getUserDashboard,
  createMeal,
  listMeals,
  getMeal,
  updateMeal,
  deleteMeal,
  listNutritionReferences,
  listPortionReferences,
  listCountries,
  listRegions,
  listFoodSourceReferences,
  listRegionalFoodItems,
  listRegionalStapleRankings,
  searchFoods,
  closeDatabase
};
