# NutriTracker

NutriTracker is an application concept for people who want to understand what is in their meals by uploading a photo of their plate.

Users can upload or take a meal picture, review detected food items, adjust quantities, and see estimated nutrition totals.

The intended post-upload layout should follow the reference in `source/sample.png`: a nutrition dashboard with summary totals, target progress, and detailed nutrient tables after the image has been analyzed.

## Target Audience

This app is for men and women ages 18-60 who want a simple way to track meals and understand nutrition without entering every item manually from scratch.

## Core Idea

1. User uploads a meal photo.
2. The app uses AI vision to detect food items on the plate.
3. The app estimates quantity or portion size when possible.
4. The user can manually correct food names and quantities.
5. The app shows nutrition totals for the full meal.
6. The user saves the reviewed meal by date and meal type.

## Post-Upload Result Screen

After a picture is uploaded, the app should show a result screen similar to `source/sample.png`.

The screen should include:

- Uploaded meal photo for reference.
- AI-detected food items.
- Estimated quantity and unit for each item.
- Confidence level for each detected item and quantity.
- Manual edit controls for food name, quantity, and unit.
- Option to add missing food items.
- Option to remove incorrect detected items.
- Meal type selector, such as breakfast, lunch, dinner, snack, or custom.
- Meal date and time.
- Nutrition summary for the full meal.
- Daily target progress where goals exist.
- Detailed nutrient table grouped by useful categories.
- Clear estimate warning because AI and nutrition calculations may be imperfect.

If the AI cannot clearly identify a food item or quantity, the app should show it as low confidence and ask the user to update it manually before saving.

## AI Image Analysis

The upload feature should use an AI vision model or food-recognition service to inspect the meal photo.

The AI result should return structured data such as:

- Food name
- Estimated quantity
- Unit, such as grams, cups, pieces, serving, or tablespoon
- Confidence score
- Notes about uncertainty

The app should not silently trust the AI result. The user should always be able to review, correct, add, or remove items before the meal is saved.

## Food Reference Table

The project includes [foodtable.md](foodtable.md), which should be used as the main reference when the app diagnoses an uploaded meal image.

`foodtable.md` contains 100+ common meals grouped by geography. It includes staple food items, average adult meal quantities, diet configuration, and estimated nutrition metrics such as calories, protein, carbohydrates, fat, fiber, sodium, and micronutrient notes.

The app should use this file as a starting reference when:

- Matching AI-detected food items to likely meals.
- Adjusting expectations based on the user's provided location.
- Estimating likely staple foods and portion ranges.
- Showing nutrition estimates before user correction.
- Identifying when a detected meal is missing from the reference list.

This file should not replace AI image analysis or trusted nutrition databases. It should guide the first estimate, then the user must confirm or edit the result.

## Food Table Updates

`foodtable.md` should be auto-updated only through a controlled flow:

1. User must be registered and signed in.
2. User must have provided location details.
3. User uploads a meal image.
4. AI detects a meal or food item that is not already represented in `foodtable.md`.
5. User manually reviews and saves the corrected meal.
6. App creates a new pending food-table candidate entry.
7. Candidate entry includes location, staple foods, confirmed quantity, diet configuration, nutrition estimates, confidence score, and source.
8. Candidate entry is reviewed before becoming canonical.

Anonymous users and users without location details must not update `foodtable.md`.

No personal user information, health data, or uploaded photo URLs should be written into `foodtable.md`.

## Key Features

- Upload or capture a meal photo.
- Detect food items from the image using AI.
- Estimate food quantities automatically.
- Let users manually edit detected items.
- Let users add missing food items.
- Show nutrition totals for the full meal.
- Show nutrition details per food item.
- Save meal history date wise and meal wise.
- Label meals by time of day, such as breakfast, lunch, dinner, snack, or custom.
- Show confidence levels for automatic detection.
- Clearly explain that nutrition values are estimates.

## Nutrition Measures

The app should show at least these dietary measures:

- Calories
- Protein
- Fat
- Carbohydrates
- Fiber
- Sugar
- Sodium
- Cholesterol
- Saturated fat

Additional useful measures:

- Potassium
- Calcium
- Iron
- Vitamin C
- Water estimate where useful
- Added sugar when reliable data exists
- Trans fat when reliable data exists

## Useful Extras

Users may also want:

- Daily nutrition summary.
- Weekly nutrition trends.
- Nutrition goals.
- Protein goal tracking.
- Calorie goal tracking.
- Macro breakdown chart.
- Meal history with photos.
- Favorites for common meals.
- Allergen notes.
- Dietary preference tags, such as vegetarian, vegan, keto, halal, or gluten-free.
- Manual food search.
- Barcode scan for packaged food.
- Exportable meal reports.

## MVP Scope

The first version should focus on:

- A photo upload screen.
- AI image analysis for detected food items.
- Matching AI results against `foodtable.md`.
- A detected food list with confidence levels.
- Manual quantity editing.
- Nutrition totals.
- Date-wise and meal-wise save history.

The MVP does not need perfect food detection. It should make it easy for the user to correct mistakes.

## Important Product Notes

Food recognition and portion estimates are not exact. The app should always show nutrition values as estimates unless the values come from verified package data or a trusted food database.

This app should not provide medical advice. Users with medical conditions should consult a qualified health professional.

## Possible Data Model

### Meal

- id
- userId
- photoUrl
- mealType
- eatenAt
- analysisStatus
- estimateWarning
- totalCalories
- totalProtein
- totalFat
- totalCarbs
- totalFiber
- totalSugar
- totalSodium
- createdAt
- updatedAt

### Meal Item

- id
- mealId
- foodName
- quantity
- unit
- confidenceScore
- aiDetected
- needsUserReview
- uncertaintyNote
- calories
- protein
- fat
- carbs
- fiber
- sugar
- sodium
- source
- createdAt
- updatedAt

### AI Detection Result

- id
- mealId
- provider
- rawResponse
- detectedAt
- status
- errorMessage

### Food Table Candidate

- id
- submittedByUserId
- submittedLocation
- detectedMealName
- stapleFoodItems
- averageConfirmedQuantity
- dietConfiguration
- estimatedCalories
- estimatedProtein
- estimatedCarbs
- estimatedFat
- estimatedFiber
- estimatedSodium
- micronutrientNotes
- nutritionSource
- confidenceScore
- reviewStatus
- createdAt
- reviewedAt

### User Goal

- id
- userId
- dailyCalories
- dailyProtein
- dailyFat
- dailyCarbs
- dailyFiber
- createdAt
- updatedAt

## Suggested App Flow

1. Open app dashboard.
2. Upload meal photo.
3. AI analyzes the photo for food items and likely quantities.
4. App checks `foodtable.md` for likely meal and portion matches.
5. App shows the post-upload nutrition dashboard.
6. User reviews detected foods and confidence levels.
7. User edits unclear quantities or adds missing items.
8. Nutrition totals recalculate after edits.
9. User selects date, time, and meal type.
10. User saves the meal.
11. If the meal is missing from `foodtable.md`, the app queues a candidate entry only for registered users with location details.
12. App updates daily progress and meal history.

## Tech Stack

No technical stack has been selected yet.

Good options could include:

- Web app: Next.js or React
- Mobile app: React Native or Flutter
- Backend: Node.js, Python, or serverless functions
- Database: PostgreSQL or Supabase
- Storage: Cloud storage for meal photos
- Food data: USDA FoodData Central or another trusted nutrition database
- Image analysis: an AI vision model or food-recognition service
- Meal reference: `foodtable.md`

## Saving Meals

Meals should be saved by:

- Date
- Time
- Meal type
- Uploaded photo
- Reviewed food items
- Final user-approved quantities
- Nutrition totals

Users should be able to reopen a saved meal, update food items or quantities, and save the corrected version.

## Development Status

Planning stage. The project currently contains documentation only.

## Privacy and Safety

Meal photos and nutrition records can be personal data. The app should:

- Ask for user consent before storing photos.
- Allow users to delete meal history.
- Avoid storing sensitive data longer than needed.
- Never expose API keys in frontend code.
- Make nutrition limits and estimates clear.
