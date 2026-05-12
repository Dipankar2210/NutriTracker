const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  parseFoodTable,
  parseIngredientNutrition,
  calculateTotals,
  createItemFromReference,
  applyFoodNameChange,
  normalizeInternetLocation,
  citySuggestionsForLocation,
  runDemoVisionAnalysis
} = require("../app.js");

const markdown = fs.readFileSync(path.resolve(__dirname, "../foodtable.md"), "utf8");
const references = parseFoodTable(markdown);
const ingredients = parseIngredientNutrition(markdown);

assert.ok(references.length >= 100, "foodtable.md should parse into common meal references");
assert.ok(ingredients.length >= 150, "foodtable.md should parse into ingredient nutrition references");

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

const editedItem = createItemFromReference(dalRice, 0.9, "test");
applyFoodNameChange(editedItem, "Unsupported mystery food", () => null);
const editedTotals = calculateTotals([editedItem]);

assert.equal(editedItem.sourceName, "Manual entry, nutrition lookup needed");
assert.equal(editedItem.needsUserReview, true);
assert.equal(Math.round(editedTotals.calories), 0);
assert.equal(Math.round(editedTotals.protein), 0);

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
