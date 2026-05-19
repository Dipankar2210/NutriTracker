const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nutritracker-db-"));
process.env.NUTRITRACKER_DB = path.join(tempDir, "test.sqlite");

const mealsDb = require("../backend/db/database");

const nutritionReferences = mealsDb.listNutritionReferences();
const portionReferences = mealsDb.listPortionReferences();

assert.ok(nutritionReferences.length >= 150, "nutrition references should seed from foodtable.md");
assert.ok(portionReferences.length >= 8, "portion references should seed from foodtable.md");
assert.ok(mealsDb.searchFoods("plain white rice").some((item) => item.name === "Rice"), "food aliases should resolve plain white rice to Rice");
assert.ok(mealsDb.searchFoods("onion").some((item) => item.name === "Onion"), "food search should return Onion");
assert.ok(mealsDb.searchFoods("fried egg").some((item) => item.name === "Egg"), "food aliases should resolve fried egg to Egg");
assert.ok(mealsDb.searchFoods("dal").some((item) => item.name === "Lentils"), "food aliases should resolve dal to Lentils");

const riceReference = nutritionReferences.find((item) => item.name === "Rice");
const eggReference = nutritionReferences.find((item) => item.name === "Egg");
const chapatiReference = nutritionReferences.find((item) => item.name === "Chapati");
const paneerReference = nutritionReferences.find((item) => item.name === "Paneer");
assert.match(riceReference.sourceName, /ICMR-NIN IFCT 2017/);
assert.equal(riceReference.sourceUrl, "https://www.nin.res.in/ebooks/IFCT2017.pdf");
assert.equal(Math.round(riceReference.calories), 130);
assert.equal(riceReference.nutritionPerGram.calories, riceReference.calories / 100);
assert.equal(riceReference.nutritionPerGram.protein, riceReference.protein / 100);
assert.equal(eggReference.sourceName, "USDA FoodData Central");
assert.equal(Math.round(eggReference.calories), 155);
assert.match(chapatiReference.sourceName, /recipe-derived estimate/);
assert.match(paneerReference.sourceName, /Indian dairy reference estimate/);

const countries = mealsDb.listCountries();
const india = countries.find((country) => country.iso2 === "IN");
assert.ok(india, "India should be seeded as a supported country");

const gujarat = mealsDb.listRegions("IN").find((region) => region.name === "Gujarat");
assert.ok(gujarat, "Gujarat should be seeded as an India region");
assert.equal(mealsDb.listRegions("IN").length, 36, "India should seed 28 states and 8 union territories");

const foodSources = mealsDb.listFoodSourceReferences("IN");
assert.ok(foodSources.some((source) => source.sourceName.includes("Indian Food Composition Tables")), "IFCT should be a seeded India source");
assert.ok(foodSources.some((source) => source.sourceName === "FAOSTAT"), "FAOSTAT should be available as a global source");

const gujaratFoods = mealsDb.listRegionalFoodItems({ countryIso2: "IN", regionName: "Gujarat" });
assert.ok(gujaratFoods.length >= 15, "Gujarat should seed a starter regional food list");
assert.ok(gujaratFoods.some((item) => item.localName === "rotli" && item.sourceBasis === "recipe-derived"), "regional foods should include Gujarati flatbread naming");
assert.ok(gujaratFoods.some((item) => item.localName === "keri" && item.foodGroup === "Fruit"), "regional foods should include local fruit names");

const gujaratStaples = mealsDb.listRegionalStapleRankings({ countryIso2: "IN", regionName: "Gujarat" });
assert.ok(gujaratStaples.length >= 5, "Gujarat should seed staple rankings");
assert.equal(gujaratStaples[0].canonicalFoodName, "Wheat flour");
assert.equal(gujaratStaples[0].stapleRank, 1);

const tamilNaduFoods = mealsDb.listRegionalFoodItems({ countryIso2: "IN", regionName: "Tamil Nadu" });
assert.ok(tamilNaduFoods.some((item) => item.localName === "arisi" && item.canonicalFoodName === "Rice"), "Tamil Nadu should include local rice naming");

const keralaFoods = mealsDb.listRegionalFoodItems({ countryIso2: "IN", regionName: "Kerala" });
assert.ok(keralaFoods.some((item) => item.localName === "thenga" && item.canonicalFoodName === "Coconut"), "Kerala should include coconut as a starter food");

const punjabStaples = mealsDb.listRegionalStapleRankings({ countryIso2: "IN", regionName: "Punjab" });
assert.equal(punjabStaples[0].canonicalFoodName, "Wheat flour");
assert.ok(mealsDb.listRegionalFoodItems({ countryIso2: "IN" }).length >= 140, "India should seed starter foods across states and union territories");

const saved = mealsDb.createMeal({
  mealType: "lunch",
  eatenAt: "2026-05-13T12:30",
  location: "India",
  city: "Kolkata",
  photoConsent: false,
  photo: "data:image/png;base64,private-photo",
  items: [
    {
      foodName: "Dal rice",
      quantity: 1,
      unit: "serving",
      confidence: 0.82,
      needsUserReview: false,
      uncertaintyNote: "Reviewed by user.",
      sourceName: "Meal nutrition estimate",
      manualEntry: false,
      portionSize: "medium",
      gramsPerUnit: 35,
      totalGrams: 70,
      nutritionBasis: "per_100g",
      portionEstimateMode: "",
      nutrition: {
        calories: 560,
        protein: 20,
        carbs: 95,
        fat: 12,
        fiber: 9,
        sugar: 6,
        sodium: 620,
        cholesterol: 8,
        saturatedFat: 3.84,
        potassium: 1095,
        calcium: 80,
        iron: 3.12,
        vitaminC: 12
      }
    }
  ]
});

assert.equal(saved.mealType, "lunch");
assert.equal(saved.photo, "", "photo should not be saved without explicit consent");
assert.equal(saved.items.length, 1);
assert.equal(saved.items[0].portionSize, "medium");
assert.equal(saved.items[0].totalGrams, 70);
assert.equal(Math.round(saved.totals.calories), 560);

const loaded = mealsDb.getMeal(saved.id);
assert.equal(loaded.city, "Kolkata");
assert.equal(loaded.items[0].foodName, "Dal rice");

const allMeals = mealsDb.listMeals({ mealType: "lunch" });
assert.equal(allMeals.length, 1);
assert.equal(allMeals[0].id, saved.id);

const updated = mealsDb.updateMeal(saved.id, {
  mealType: "dinner",
  eatenAt: "2026-05-13T20:00",
  items: [
    {
      foodName: "Chicken breast",
      quantity: 200,
      unit: "grams",
      confidence: 0.9,
      sourceName: "Ingredient nutrition estimate",
      portionSize: "custom",
      gramsPerUnit: 100,
      totalGrams: 200,
      nutritionBasis: "per_100g",
      portionEstimateMode: "dimensions",
      diameterValue: 7,
      diameterUnit: "in",
      thickness: "medium",
      nutrition: {
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
        fiber: 0,
        sugar: 0,
        sodium: 148,
        cholesterol: 170,
        saturatedFat: 2.24,
        potassium: 744,
        calcium: 30,
        iron: 1.2,
        vitaminC: 0
      }
    }
  ]
});

assert.equal(updated.mealType, "dinner");
assert.equal(updated.items.length, 1);
assert.equal(updated.items[0].portionSize, "custom");
assert.equal(updated.items[0].totalGrams, 200);
assert.equal(updated.items[0].portionEstimateMode, "dimensions");
assert.equal(updated.items[0].diameterValue, 7);
assert.equal(updated.items[0].diameterUnit, "in");
assert.equal(updated.items[0].thickness, "medium");
assert.equal(Math.round(updated.totals.protein), 62);

assert.equal(mealsDb.deleteMeal(saved.id), true);
assert.equal(mealsDb.getMeal(saved.id), null);

const createdUser = mealsDb.createUser({
  displayName: "Asha Patel",
  contactEmail: "asha@example.com",
  location: "India",
  city: "Ahmedabad",
  dietaryPreference: "vegetarian",
  goals: {
    dailyCalories: 1800,
    dailyProtein: 75
  }
});
assert.equal(createdUser.user.displayName, "Asha Patel");
assert.equal(createdUser.user.contactEmail, "asha@example.com");
assert.equal(createdUser.user.status, "pending");
assert.equal(createdUser.user.role, "user");
assert.match(createdUser.accessToken, /^[A-Za-z0-9_-]+$/);
assert.match(createdUser.magicLinkPath, /^\/setup\.html\?token=/);

const session = mealsDb.validateMagicLinkToken(createdUser.accessToken);
assert.equal(session.user.id, createdUser.user.id);
assert.equal(session.user.location, "India");
assert.throws(() => mealsDb.loginUser({ email: "asha@example.com", password: "bad" }), /Invalid email or password|not active/);
assert.throws(() => mealsDb.setupUserPassword({
  token: createdUser.accessToken,
  password: "weak",
  confirmPassword: "weak"
}), /at least 8 characters/);

const setup = mealsDb.setupUserPassword({
  token: createdUser.accessToken,
  password: "Better123!",
  confirmPassword: "Better123!"
});
assert.equal(setup.user.status, "active");
assert.ok(setup.user.passwordSetAt);
assert.equal(mealsDb.validateMagicLinkToken(createdUser.accessToken), null);

const login = mealsDb.loginUser({ email: "asha@example.com", password: "Better123!" });
assert.equal(login.user.id, createdUser.user.id);
assert.equal(login.role, "user");
assert.ok(login.token);
assert.equal(mealsDb.getSession(login.token).user.id, createdUser.user.id);

const rotatedAccess = mealsDb.createUserAccessToken(createdUser.user.id, { label: "Replacement link" });
assert.notEqual(rotatedAccess.accessToken, createdUser.accessToken);
assert.equal(mealsDb.validateMagicLinkToken(rotatedAccess.accessToken).user.id, createdUser.user.id);
assert.equal(mealsDb.validateMagicLinkToken("bad-token"), null);

const promoted = mealsDb.updateUserRole(createdUser.user.id, "admin");
assert.equal(promoted.role, "admin");
assert.equal(mealsDb.loginUser({ email: "asha@example.com", password: "Better123!" }).role, "admin");
assert.equal(mealsDb.updateUserRole(createdUser.user.id, "user").role, "user");

const secondUser = mealsDb.createUser({
  displayName: "Ben Carter",
  contactPhone: "+15550101010",
  location: "United States"
});

const userMeal = mealsDb.createMeal({
  userId: createdUser.user.id,
  mealType: "breakfast",
  eatenAt: "2026-05-14T08:00",
  items: [
    {
      foodName: "Poha",
      quantity: 1,
      unit: "serving",
      confidence: 0.8,
      sourceName: "Meal nutrition estimate",
      nutrition: {
        calories: 320,
        protein: 8,
        carbs: 55,
        fat: 9,
        fiber: 4,
        sugar: 3,
        sodium: 420,
        cholesterol: 0,
        saturatedFat: 1,
        potassium: 300,
        calcium: 40,
        iron: 2,
        vitaminC: 8
      }
    }
  ]
});

mealsDb.createMeal({
  userId: secondUser.user.id,
  mealType: "snack",
  eatenAt: "2026-05-14T16:00",
  items: [
    {
      foodName: "Apple",
      quantity: 1,
      unit: "piece",
      confidence: 0.9,
      sourceName: "Ingredient nutrition estimate",
      nutrition: {
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4,
        sugar: 19,
        sodium: 2,
        cholesterol: 0,
        saturatedFat: 0,
        potassium: 195,
        calcium: 11,
        iron: 0.2,
        vitaminC: 8
      }
    }
  ]
});

const ashaMeals = mealsDb.listMeals({ userId: createdUser.user.id });
assert.equal(ashaMeals.length, 1);
assert.equal(ashaMeals[0].id, userMeal.id);
assert.equal(ashaMeals[0].userId, createdUser.user.id);

const benMeals = mealsDb.listMeals({ userId: secondUser.user.id });
assert.equal(benMeals.length, 1);
assert.notEqual(benMeals[0].id, userMeal.id);

const dashboard = mealsDb.getUserDashboard(createdUser.user.id);
assert.equal(dashboard.user.displayName, "Asha Patel");
assert.equal(dashboard.goals.dailyCalories, 1800);
assert.equal(dashboard.days.length, 1);
assert.equal(dashboard.days[0].date, "2026-05-14");
assert.equal(dashboard.days[0].mealCount, 1);
assert.equal(Math.round(dashboard.days[0].calories), 320);
assert.equal(Math.round(dashboard.totals.calories), 320);
assert.equal(dashboard.recentMeals.length, 1);

const unsubscribed = mealsDb.unsubscribeUser(createdUser.user.id);
assert.equal(unsubscribed.status, "unsubscribed");
assert.ok(unsubscribed.deletedAt);
assert.equal(mealsDb.getSession(login.token), null);
assert.throws(() => mealsDb.loginUser({ email: "asha@example.com", password: "Better123!" }), /not active/);

mealsDb.closeDatabase();
fs.rmSync(tempDir, { recursive: true, force: true });

console.log("meal database tests passed");
