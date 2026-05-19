# NutriTracker

NutriTracker is an application concept for people who want to understand what is in their meals by uploading a photo of their plate.

Users can upload or take a meal picture, review detected food items, adjust quantities, and see estimated nutrition totals.

The intended post-upload layout should follow the reference in `source/sample.png`: a nutrition dashboard with summary totals, target progress, and detailed nutrient tables after the image has been analyzed.

For the early MVP, users are created by an admin. The admin personally shares a first-time setup magic link so the user can create a password. After setup, the user logs in to access their own profile, save meals, and review history. Automatic registration can be added later.

## Target Audience

This app is for men and women ages 18-60 who want a simple way to track meals and understand nutrition without entering every item manually from scratch.

## Core Idea

1. Admin creates a basic user profile.
2. Admin shares a user-specific setup magic link.
3. User opens the magic link, creates a password, and confirms the password.
4. The app redirects the user to login.
5. User logs in and accesses their profile.
6. User uploads a meal photo.
7. The app uses AI vision to detect food items on the plate.
8. The app estimates quantity or portion size when possible.
9. The user can manually correct food names and quantities.
10. The app shows nutrition totals for the full meal.
11. The user saves the reviewed meal by date and meal type.
12. The profile dashboard shows daily calories, macros, and saved meals.

## User Onboarding

The first onboarding version should be admin-led:

- Admin creates a user profile.
- Admin enters basic details such as name, contact email or phone, location, dietary preference, and account status.
- App creates or stores a first-time setup magic-link token for that user.
- Admin shares the setup magic link personally outside the app.
- User opens the setup magic link and is asked to create a password and confirm the password.
- Password setup must include standard validation, including required fields, matching confirmation, minimum length, and reasonable complexity checks.
- After password setup succeeds, the app redirects the user to the login page.
- User logs in with their own credentials to access their dashboard and meal flow.

This MVP does not need automatic email/SMS delivery. The magic-link setup and password login flow should be built so it can later be replaced by proper registration, email login, SMS login, or an identity provider.

Magic links should be treated as private setup links. They should not expose personal data in the URL, should expire or be revoked after password setup, and one user's link should never show another user's meals or profile.

## Login, Roles, and Permissions

The app should have a simple login page used by both admins and normal users.

- Admins log in with admin credentials before opening the admin area.
- A default first admin credential may be seeded for local first-time setup, but it should be temporary and changeable.
- Normal users log in after completing password setup from their first-time magic link.
- Supported roles are `admin` and `user`.
- Admins can create users, view users, update basic profile fields, rotate setup links, and assign admin access to another active user.
- Normal users can add meals, review detected food, save meals, view calendar history, view meal details, and unsubscribe.
- Admin features must not appear in the normal user dashboard.
- Normal users must not call admin APIs successfully.
- Unsubscribing should soft-delete or disable the user account instead of immediately hard deleting records.

## User Profile Dashboard

Each user should have a profile page that gives a holistic view before meal-level details.

The profile dashboard should include:

- Basic profile details.
- Daily calorie and macro summary.
- Nutrition goal progress where goals exist.
- Calendar or date-based view showing days with saved meals.
- Saved calories by date.
- Meal count by date.
- Meal type breakdown, such as breakfast, lunch, dinner, and snack.
- Link or action to open saved meals for a selected date.
- Meal detail view with photo, reviewed food items, quantities, confidence labels, nutrition totals, and nutrient table.

The dashboard should be read-first. Editing saved meals can be added after the viewing and filtering flow is stable.

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

## Portion Size Calculation

For variable-size foods, the app should calculate nutrition from grams when possible.

Examples include roti, chapati, paratha, naan, pizza slices, dosa, idli, bread slices, and similar foods where one piece can be small, medium, or large.

Recommended MVP rule:

```text
total_grams = quantity * grams_per_unit
nutrient_total = nutrient_per_100g * total_grams / 100
```

The UI can still show friendly inputs:

- Quantity: `2`
- Unit: `pieces`
- Size: `medium`
- Estimated weight: `70g`

The backend should use the gram estimate for calculation. If the size is unclear, default to medium, label it as an estimate, and let the user choose small, medium, large, or custom grams.

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

- Admin can create user profiles for the MVP.
- Admin can log in before using the admin area.
- Admin can generate or view a first-time setup magic link for a user.
- Admin can promote another active user to admin.
- User can create a password from a personally shared setup magic link.
- User can log in after password setup.
- Upload or capture a meal photo.
- Detect food items from the image using AI.
- Estimate food quantities automatically.
- Let users manually edit detected items.
- Let users add missing food items.
- Show nutrition totals for the full meal.
- Show nutrition details per food item.
- Save meal history date wise and meal wise.
- Show a user profile dashboard with calendar-based meal and calorie history.
- Let users open saved meal details from the dashboard.
- Let users unsubscribe, which soft-deletes or disables their account.
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

- Admin-created user profiles.
- Admin login.
- First-time magic-link password setup.
- User login after setup.
- Role-based access for admin and normal users.
- User profile dashboard with date-wise calories and meal history.
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

### User

- id
- displayName
- contactEmail
- contactPhone
- location
- city
- dietaryPreference
- role
- passwordHash
- passwordSetAt
- status
- unsubscribedAt
- deletedAt
- createdByAdminId
- createdAt
- updatedAt

### User Access Token

- id
- userId
- tokenHash
- label
- status
- purpose, such as password_setup
- expiresAt
- lastUsedAt
- createdAt
- revokedAt

### Auth Session

- id
- userId
- tokenHash
- role
- expiresAt
- createdAt
- revokedAt

### Admin User

- id
- displayName
- contactEmail
- role
- passwordHash
- passwordChangedAt
- status
- createdAt
- updatedAt

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
- portionSize
- gramsPerUnit
- totalGrams
- nutritionBasis
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

1. Admin opens the admin area.
2. App redirects unauthenticated admin users to login.
3. Admin logs in with admin credentials.
4. Admin creates a user profile.
5. App creates a first-time setup magic link for that user.
6. Admin shares the link personally.
7. User opens the setup magic link.
8. App validates the setup link and asks for password and confirm password.
9. User creates a valid password.
10. App revokes or marks the setup link as used and redirects the user to login.
11. User logs in.
12. User uploads meal photo.
13. AI analyzes the photo for food items and likely quantities.
14. App checks `foodtable.md` and local nutrition references for likely meal and portion matches.
15. App shows the post-upload nutrition dashboard.
16. User reviews detected foods and confidence levels.
17. User edits unclear quantities or adds missing items.
18. Nutrition totals recalculate after edits.
19. User selects date, time, and meal type.
20. User saves the meal.
21. If the meal is missing from `foodtable.md`, the app queues a candidate entry only for registered users with location details.
22. App updates the user's daily progress and meal history.
23. User can open the profile calendar, select a date, and deep dive into saved meal details.
24. User can unsubscribe, which disables login and hides the account from active user flows while preserving soft-deleted records.

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

- User
- Date
- Time
- Meal type
- Uploaded photo
- Reviewed food items
- Final user-approved quantities
- Nutrition totals

Users should be able to reopen a saved meal, update food items or quantities, and save the corrected version.

Profile and meal history views should always filter by the current authenticated user session.

## Development Status

Early MVP implementation. The project has a local Node.js server, SQLite-backed meal storage, food reference data, and frontend screens for meal analysis and history. Admin-created users and magic-link dashboard access exist in an early form, but the next auth step is to add login, first-time password setup, roles, permissions, and unsubscribe soft delete.

## Privacy and Safety

Meal photos and nutrition records can be personal data. The app should:

- Ask for user consent before storing photos.
- Allow users to delete meal history.
- Allow users to unsubscribe through a soft-delete or disabled account state.
- Avoid storing sensitive data longer than needed.
- Never expose API keys in frontend code.
- Never expose raw magic-link tokens in logs or public records.
- Never store plain-text passwords.
- Keep each user's meal history and profile data isolated.
- Make nutrition limits and estimates clear.
