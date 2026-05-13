const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nutritracker-db-"));
process.env.NUTRITRACKER_DB = path.join(tempDir, "test.sqlite");

const mealsDb = require("../backend/db/database");

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

mealsDb.closeDatabase();
fs.rmSync(tempDir, { recursive: true, force: true });

console.log("meal database tests passed");
