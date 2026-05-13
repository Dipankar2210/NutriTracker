# Backend Agent Prompt

```text
You are a senior backend engineer working on my Meal Nutrition Tracker app.

Project context:
- The app lets users upload a meal photo, uses AI vision to detect food items and quantities, lets the user review/edit the result, then saves the corrected meal by date and meal type.
- Current app has a small Node.js server in scripts/server.js.
- Current backend already has:
  - POST /api/analyze
  - GET /api/reverse-geocode
  - static file serving
- Current frontend still stores meal history in localStorage.
- foodtable.md is currently used as the canonical local food reference.
- I want the frontend UI to remain mostly the same, but all saved meal data should come from the backend.

Your task:
Implement a proper backend foundation without rewriting the whole app.

Backend goals:
1. Keep the existing frontend working.
2. Move saved meal history from localStorage to backend APIs.
3. Add database-backed storage.
4. Use SQLite for the MVP unless the repo already has another database setup.
5. Keep AI analysis on the backend only.
6. Keep nutrition values labeled as estimates.
7. Do not store secrets in code.
8. Do not update foodtable.md directly from anonymous users.
9. Do not store personal health data or meal photos without clear user consent.
10. For variable-size foods, calculate from grams when reliable per-100g nutrition data exists.

Portion calculation:
- User-friendly units such as pieces, slices, cups, bowls, and servings should be converted into grams before calculating nutrition when possible.
- Variable-size foods such as roti, chapati, paratha, naan, pizza slice, dosa, idli, and bread should support small, medium, large, and custom grams.
- If size is unknown, default to medium and mark the quantity as an estimate that needs review.
- Use this formula:
  - `total_grams = quantity * grams_per_unit`
  - `nutrient_total = nutrient_per_100g * total_grams / 100`
- Keep the selected display unit for the user, but store the gram conversion used for calculation.

Suggested backend structure:
- backend/server.js or keep scripts/server.js if simpler
- backend/routes/
- backend/controllers/
- backend/services/
- backend/db/
- backend/utils/

Required APIs:
- POST /api/analyze
  - Keep existing behavior.
  - Accept uploaded image data.
  - Return AI-detected food items with foodName, quantity, unit, confidence, uncertaintyNote, and evidence.

- POST /api/meals
  - Save only reviewed/corrected meal data.
  - Save meal type, eatenAt date/time, location/city if provided, totals, items, and optional photo only if user consent is true.
  - Store original AI detection result when useful for audit, but do not present it as verified truth.

- GET /api/meals
  - Return saved meals ordered newest first.
  - Support basic date-wise and meal-wise filtering if easy.

- GET /api/meals/:id
  - Return one saved meal with items.

- PUT /api/meals/:id
  - Update a saved reviewed meal and recalculate totals if needed.

- DELETE /api/meals/:id
  - Delete a saved meal.

- GET /api/food-reference
  - Parse foodtable.md on the backend and return structured meal/ingredient reference data.

Database tables:
- meals
  - id
  - user_id nullable for now
  - meal_type
  - eaten_at
  - location
  - city
  - photo_data nullable
  - estimate_warning
  - total_calories
  - total_protein
  - total_carbs
  - total_fat
  - total_fiber
  - total_sugar
  - total_sodium
  - created_at
  - updated_at

- meal_items
  - id
  - meal_id
  - food_name
  - quantity
  - unit
  - portion_size nullable
  - grams_per_unit nullable
  - total_grams nullable
  - nutrition_basis nullable, such as per_100g, per_serving, or manual
  - confidence_score
  - ai_detected
  - needs_user_review
  - uncertainty_note
  - source_name
  - calories
  - protein
  - carbs
  - fat
  - fiber
  - sugar
  - sodium
  - cholesterol
  - saturated_fat
  - potassium
  - calcium
  - iron
  - vitamin_c
  - created_at
  - updated_at

- ai_detection_results
  - id
  - meal_id nullable
  - provider
  - model
  - raw_response
  - status
  - error_message
  - detected_at

- food_table_candidates
  - id
  - user_id
  - geography
  - food_name
  - staple_foods
  - average_quantity
  - diet_configuration
  - nutrition_estimates
  - confidence_score
  - trusted_source
  - status default pending_review
  - created_at

Frontend integration:
- Replace localStorage meal saving/loading with backend fetch calls.
- Keep localStorage only as fallback if the backend is unavailable, or remove it if backend works reliably.
- Show clear errors if backend save/load fails.
- Do not change the visual design unless required.
- Keep manual correction flow before save.
- Save only reviewed/corrected meal records.

Implementation rules:
- Read the existing code before editing.
- Keep changes small and scoped.
- Match existing style.
- Do not install new dependencies without asking first.
- If SQLite dependency is needed, ask before installing.
- Add at least one backend test for meal saving/loading.
- Run existing tests/build after changes.
- Explain what changed and how to run it.

Expected result:
After implementation, the app should still run locally, but saved meals should be created, loaded, updated, and deleted through backend API endpoints instead of localStorage.
```
