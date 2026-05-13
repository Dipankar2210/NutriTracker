# AGENTS.md

## Project Overview
- **Project:** Meal Nutrition Tracker - an app where users upload a meal photo, review detected food items and quantities, then see nutrition estimates for the meal.
- **Target user:** Men and women ages 18-60 who want a simple way to understand protein, fat, calories, and other dietary measures from everyday meals.
- **My skill level:** beginner / intermediate
- **Stack:** Not chosen yet. See package files once the app is scaffolded.

## Product Goals
- Let users upload or take a picture of any meal.
- Use AI vision after upload to detect visible food items on the plate.
- Use AI to estimate portions or quantities automatically when possible.
- Let users manually edit food items and quantities.
- Show nutrition totals and per-item nutrition details.
- Make nutrition information clear, practical, and easy to understand.
- Save corrected meal information by date and meal type after the user reviews it.

## Upload Result Layout
- Use `source/sample.png` as the visual reference for the screen shown after a picture is uploaded and analyzed.
- The result screen should feel like a nutrition dashboard, not only a plain list.
- Show the uploaded meal photo near the detected result so users can compare the AI result with the image.
- Show a clear meal summary area with calories, protein, carbs, fat, and other key totals.
- Show progress bars or target indicators for daily nutrition goals where goals exist.
- Show a detailed nutrient table grouped into useful sections, such as general nutrition, carbohydrates, lipids, vitamins, and minerals.
- Show detected food items with estimated quantities, confidence levels, and edit controls.
- If an item or quantity is unclear, clearly mark it as low confidence and ask the user to confirm or update it manually.
- Let users add missing items, remove incorrect items, and adjust quantity or unit before saving.
- Save only the reviewed or corrected meal record.

## AI Meal Detection Flow
- The upload flow must call an AI vision model or food-recognition service to inspect the meal photo.
- The AI result should include food name, estimated quantity, unit, confidence score, and any uncertainty notes.
- Do not treat AI results as final. The user must be able to review and correct them.
- If AI cannot identify an item confidently, show an editable placeholder instead of silently dropping it.
- Nutrition totals should recalculate when the user edits food items or quantities.
- Always label nutrition totals as estimates unless they come from verified package data or a trusted nutrition database.

## Food Reference Table
- Use `foodtable.md` as the main food reference when diagnosing an uploaded meal image.
- Treat `foodtable.md` as the app's canonical starting reference for common meals, geography, staple ingredients, average quantities, diet configuration, and estimated nutrition metrics.
- Match AI-detected foods against `foodtable.md` using the detected food name, staple ingredients, user location, and visible plate composition.
- If `foodtable.md` contains a likely match, use it only as a starting estimate and still require user review.
- For variable-size foods such as roti, chapati, paratha, naan, pizza, dosa, idli, and bread, calculate nutrition from grams when possible. Use pieces, slices, cups, bowls, and servings as user-friendly inputs, then convert them to grams before calculating totals.
- If variable-size food size is unclear, default to medium, show it as an estimate, and let the user choose small, medium, large, or custom grams.
- If a detected meal or food item is missing from `foodtable.md`, create a candidate entry only after the registered user reviews and saves the meal.
- Only registered users who have provided location details may contribute new candidate entries to `foodtable.md`.
- Anonymous users and users without location details must not update `foodtable.md`.
- New entries should include geography, staple foods, average confirmed quantity, diet configuration, nutrition estimates, confidence score, and trusted nutrition source.
- New entries must be marked as pending review before becoming canonical.
- Do not write personal user data, health data, or meal photo URLs into `foodtable.md`.

## Key Nutrition Measures
- Calories
- Protein
- Fat
- Carbohydrates
- Fiber
- Sugar
- Sodium
- Cholesterol
- Saturated fat
- Micronutrients where reliable data is available, such as potassium, calcium, iron, and vitamin C

## Additional User Features
- Meal time labels, such as breakfast, lunch, dinner, snack, or custom.
- Daily nutrition summary.
- Meal history with photos.
- Nutrition goals and progress.
- Allergen and dietary preference notes.
- Manual food search for items the photo detector misses.
- Confidence level for automatically detected food and quantity estimates.
- Warnings when nutrition values are estimates.
- Export or share meal summaries.

## Data Saving Requirements
- Save meals date wise using the date and time the meal was eaten or uploaded.
- Save meals meal wise using a meal type such as breakfast, lunch, dinner, snack, or custom.
- Store the final user-reviewed food items, quantities, and nutrition totals.
- Keep the original AI detection result when useful for audit or review, but do not expose it as verified truth.
- Allow users to update a saved meal later and recalculate totals after changes.
- When a registered user saves a reviewed meal that is not represented in `foodtable.md`, queue a new food-table candidate entry with the user's provided location.

## Commands
- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Test:** `npm test`
- **Lint:** TBD after stack is selected

## Do
- Read existing code before modifying anything.
- Match existing patterns, naming, and style.
- Handle errors gracefully. Do not allow silent failures.
- Keep changes small and scoped to what was asked.
- Run dev/build after changes to verify nothing broke when commands exist.
- Ask clarifying questions before making risky product or technical assumptions.
- Treat nutrition values as estimates unless verified by a trusted source.
- Prefer per-100g nutrition calculations for variable-size foods when reliable data exists.
- Keep user health and privacy in mind when handling meal photos and nutrition data.
- Build the upload result screen around AI detection, manual correction, and date-wise meal saving.
- Check `foodtable.md` before adding new food or meal reference data.

## Don't
- Install new dependencies without asking.
- Delete or overwrite files without confirming.
- Hardcode secrets, API keys, credentials, or nutrition database keys.
- Rewrite working code unless explicitly asked.
- Push, deploy, or force-push without permission.
- Make changes outside the scope of the request.
- Present estimated nutrition values as medical advice.
- Store user photos or health-related data without clear user consent.
- Hide unclear AI detection results. Show them as uncertain and let the user correct them.
- Allow anonymous users or users without location details to update `foodtable.md`.

## When Stuck
- If a task is large, break it into steps and confirm the plan first.
- If you cannot fix an error in 2 attempts, stop and explain the issue.

## Testing
- Run existing tests after any change when tests exist.
- Add at least one test for new features.
- Never skip or delete tests to make things pass.
- Test nutrition calculations with known example foods and quantities.
- Test manual quantity edits because they directly affect nutrition totals.

## Git
- Small, focused commits with descriptive messages.
- Never force push.

## Response Style
- Always respond with clear and concise messages.
- Use plain English when explaining to the user.
- Avoid long sentences, complex words, or long paragraphs.
