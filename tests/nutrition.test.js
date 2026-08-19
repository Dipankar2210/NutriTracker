const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  parseFoodTable,
  parseIngredientNutrition,
  parsePortionSizeReference,
  calculateTotals,
  createItemFromReference,
  createManualAddedItem,
  createItemFromAiComponent,
  applyFoodNameChange,
  normalizeInternetLocation,
  citySuggestionsForLocation,
  unitSupportedByReference,
  runDemoVisionAnalysis
} = require("../app.js");

const markdown = fs.readFileSync(path.resolve(__dirname, "../foodtable.md"), "utf8");
const references = parseFoodTable(markdown);
const ingredients = parseIngredientNutrition(markdown);
const portionSizes = parsePortionSizeReference(markdown);

assert.ok(references.length >= 100, "foodtable.md should parse into common meal references");
assert.ok(ingredients.length >= 150, "foodtable.md should parse into ingredient nutrition references");
assert.ok(portionSizes.length >= 8, "foodtable.md should parse variable portion-size references");

const dalRice = references.find((item) => item.name === "Dal rice");
assert.ok(dalRice, "Dal rice reference should exist");

const totals = calculateTotals([
  createItemFromReference(dalRice, 0.9, "test"),
  { ...createItemFromReference(dalRice, 0.9, "test"), quantity: 0.5 }
]);

assert.equal(Math.round(totals.calories), 840);
assert.equal(Math.round(totals.protein), 30);
assert.equal(Math.round(totals.carbs), 143);

const chicken = ingredients.find((item) => item.name === "Chicken breast");
assert.ok(chicken, "Chicken breast ingredient reference should exist");

const ingredientTotals = calculateTotals([
  {
    id: "test",
    foodName: "Chicken breast",
    quantity: 200,
    unit: "grams",
    confidence: 0.9,
    base: chicken
  }
]);

assert.equal(Math.round(ingredientTotals.calories), 330);
assert.equal(Math.round(ingredientTotals.protein), 62);

const repeatedIngredientTotals = calculateTotals([
  {
    id: "repeat-test",
    foodName: "Chicken breast",
    quantity: 200,
    unit: "grams",
    confidence: 0.4,
    base: chicken
  }
]);

assert.deepEqual(repeatedIngredientTotals, ingredientTotals, "same database food and grams should always calculate the same totals regardless of AI confidence");

const perGramTotals = calculateTotals([
  {
    id: "per-gram-test",
    foodName: "Chicken breast",
    quantity: 200,
    unit: "grams",
    confidence: 0.9,
    base: {
      ...chicken,
      calories: 9999,
      nutritionPerGram: {
        calories: chicken.calories / 100,
        protein: chicken.protein / 100
      }
    }
  }
]);

assert.equal(Math.round(perGramTotals.calories), 330);
assert.equal(Math.round(perGramTotals.protein), 62);

const tomato = ingredients.find((item) => item.name === "Tomato");
assert.ok(tomato, "Tomato ingredient reference should exist");

const cherryTomatoTotals = calculateTotals([
  {
    id: "cherry-tomato-test",
    foodName: "cherry tomatoes",
    quantity: 5,
    unit: "pieces",
    confidence: 0.9,
    base: tomato
  }
]);

assert.equal(Math.round(cherryTomatoTotals.calories), 15);
assert.equal(Math.round(cherryTomatoTotals.carbs), 3);

const roti = ingredients.find((item) => item.name === "Roti");
const rotiPortion = portionSizes.find((item) => item.foodName === "Roti");
assert.ok(roti, "Roti ingredient reference should exist");
assert.equal(rotiPortion.mediumGrams, 35);

const rotiTotals = calculateTotals([
  {
    id: "roti-test",
    foodName: "Roti",
    quantity: 2,
    unit: "pieces",
    portionSize: "medium",
    gramsPerUnit: rotiPortion.mediumGrams,
    totalGrams: 2 * rotiPortion.mediumGrams,
    nutritionBasis: "per_100g",
    confidence: 0.8,
    base: roti
  }
]);

assert.equal(Math.round(rotiTotals.calories), 208);
assert.equal(Math.round(rotiTotals.carbs), 32);

const mutableItems = [
  {
    id: "rice",
    foodName: "White rice",
    quantity: 150,
    unit: "grams",
    confidence: 0.9,
    base: {
      name: "White rice",
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
      sodium: 1,
      per100: true
    }
  },
  {
    id: "roti",
    foodName: "Roti",
    quantity: 2,
    unit: "pieces",
    portionSize: "medium",
    gramsPerUnit: 35,
    totalGrams: 70,
    nutritionBasis: "per_100g",
    confidence: 0.8,
    base: roti
  }
];

const beforeEditTotals = calculateTotals(mutableItems);
mutableItems[0].quantity = 200;
const afterQuantityEditTotals = calculateTotals(mutableItems);
const afterRemoveTotals = calculateTotals(mutableItems.slice(0, 1));

assert.ok(afterQuantityEditTotals.calories > beforeEditTotals.calories, "quantity edits should increase totals");
assert.ok(afterRemoveTotals.calories < afterQuantityEditTotals.calories, "removing an item should reduce totals");

const editedItem = createItemFromReference(dalRice, 0.9, "test");
applyFoodNameChange(editedItem, "Unsupported mystery food", () => null);
editedItem.base.calories = 120;
editedItem.base.protein = null;
editedItem.base.carbs = 20;
const editedTotals = calculateTotals([editedItem]);

assert.equal(editedItem.sourceName, "Manual entry, nutrition values needed");
assert.equal(editedItem.needsUserReview, true);
assert.equal(editedItem.confidence, null);
assert.equal(Math.round(editedTotals.calories), 120);
assert.equal(Math.round(editedTotals.protein), 0);
assert.equal(Math.round(editedTotals.carbs), 20);

const manualItem = createManualAddedItem();
assert.equal(manualItem.confidence, null);
assert.equal(manualItem.base.calories, null);
assert.equal(manualItem.manualEntry, true);

const aiUnknownItem = createItemFromAiComponent({
  foodName: "fried eggs",
  quantity: 2,
  unit: "pieces",
  confidence: 0.95,
  uncertaintyNote: "Detected by vision.",
  evidence: "Two eggs visible."
});
assert.equal(aiUnknownItem.manualEntry, false);
assert.equal(aiUnknownItem.base.editableNutrition, true);

const matchedManualItem = createManualAddedItem();
applyFoodNameChange(matchedManualItem, "Chicken breast", (name) => ingredients.find((item) => item.name === name));
assert.equal(matchedManualItem.sourceName, "Manual entry, measurement not matched");
assert.ok(matchedManualItem.confidence > 0.8);
assert.equal(matchedManualItem.needsUserReview, true);
matchedManualItem.unit = "grams";
applyFoodNameChange(matchedManualItem, "Chicken breast", (name) => ingredients.find((item) => item.name === name));
assert.equal(matchedManualItem.sourceName, "Ingredient nutrition estimate");
assert.equal(matchedManualItem.needsUserReview, false);
assert.equal(unitSupportedByReference(chicken, "grams"), true);
assert.equal(unitSupportedByReference(chicken, "bowl"), false);

const analysis = runDemoVisionAnalysis({
  fileName: "dal-rice-lunch.jpg",
  location: "India",
  references
});

assert.ok(analysis.items.some((item) => item.foodName === "Dal rice"), "analysis should match food names from filename");

assert.deepEqual(normalizeInternetLocation({
  city: "Kolkata",
  country_code: "IN"
}), { location: "India", city: "Kolkata" });

assert.deepEqual(normalizeInternetLocation({
  address: {
    city: "New York",
    country_code: "us"
  }
}), { location: "North America", city: "New York" });

assert.deepEqual(normalizeInternetLocation({
  city: "Bangkok",
  country_code: "TH"
}), { location: "Southeast Asia", city: "Bangkok" });

assert.ok(citySuggestionsForLocation("India").includes("Kolkata"), "India city suggestions should include Kolkata");
assert.ok(!citySuggestionsForLocation("India").includes("New York"), "India city suggestions should not include North America cities");

console.log("nutrition tests passed");
