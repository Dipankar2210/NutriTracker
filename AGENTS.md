# AGENTS.md

## Project Overview
- **Project:** Meal Nutrition Tracker - an app where users upload a meal photo, review detected food items and quantities, then see nutrition estimates for the meal.
- **Target user:** Men and women ages 18-60 who want a simple way to understand protein, fat, calories, and other dietary measures from everyday meals.
- **My skill level:** beginner / intermediate
- **Stack:** Not chosen yet. See package files once the app is scaffolded.

## Product Goals
- Let users upload or take a picture of any meal.
- Let guest users upload a meal picture and manually add food items to estimate nutrition.
- Require login before using AI vision to detect visible food items on the plate.
- Use AI to estimate portions or quantities automatically when possible.
- Let users manually edit food items and quantities.
- Show nutrition totals and per-item nutrition details.
- Make nutrition information clear, practical, and easy to understand.
- Save corrected meal information by date and meal type after the user reviews it.
- Let an admin create user accounts during the early MVP.
- Let users access the app through a personally shared magic link.
- Give each user a profile dashboard with calendar-based meal and calorie history.
- Support Progressive Web App behavior so the app can be installed from mobile browsers and feel usable on phones.

## User Onboarding and Access
- MVP onboarding is admin-led. An admin creates the user profile before the user starts using the app.
- Admin-created users should include only basic required profile fields at first, such as name, contact email or phone, location, dietary preference, and account status.
- The app should generate or store a magic-link token for first-time user setup after the admin creates the profile.
- For now, the admin may share the setup magic link personally outside the app.
- Later, this flow can become automatic registration with email, SMS, or another identity provider.
- A first-time magic link should identify one user and show a password setup screen, not the full dashboard.
- The password setup screen must ask for password and confirm password, validate both fields, and require standard password strength checks.
- After a user sets a password successfully, redirect the user to the login page.
- After setup, users should log in with their own credentials to access profile, meals, goals, and history.
- Magic links should not expose raw personal data in the URL.
- Magic-link tokens should be treated like secrets. Store only what is needed, avoid logging them, expire or revoke them after setup, and allow them to be rotated or disabled later.
- Keep the auth model simple for now, but design it so stronger authentication can replace local password login later.

## Roles and Permissions
- Supported roles are `admin` and `user`.
- Admin users can log in, access the admin area, create users, view users, update profile basics, rotate setup links, and promote or demote other users when allowed.
- A default first admin credential may be seeded for local first-time setup, but it must be clearly marked as temporary and changeable.
- Guest users can manually estimate nutrition from uploaded meal photos and backend food reference data, but cannot use AI vision, save meals, or access dashboards.
- Normal users can use AI vision, add meals, review and save meal nutrition, view their own calendar dashboard, view meal details, update their own profile basics where supported, and unsubscribe from the app.
- Normal users must not access admin pages or admin APIs.
- Admin-only controls must never be exposed in the normal user dashboard.
- Role changes must be made only by an authenticated admin.

## Admin User Management
- Add an admin-only area for creating and viewing user profiles.
- Admin should first go to the login page and authenticate with admin credentials.
- Admin should be able to create a user with basic details and receive a first-time setup magic link for that user.
- Admin should be able to see whether a user is active, inactive, or pending.
- Admin should be able to update basic profile details when needed.
- Admin should be able to assign admin access to another active user so that user can access the same admin area after login.
- Admin should not directly edit a user's reviewed meal nutrition records unless a future admin-review feature is explicitly added.
- Do not expose admin features in the normal user dashboard.

## User Profile Dashboard
- A user profile page should show basic user details, nutrition goals, and saved meal history.
- Show a calendar or date-based view so users can see which dates have saved meals.
- Show daily saved calories and key macro totals as a holistic summary.
- Let users click a date to see meals saved on that date.
- Let users deep dive into each saved meal and see the meal photo, reviewed food items, quantities, confidence labels, nutrition totals, and detailed nutrient table.
- Keep nutrition totals labeled as estimates unless the values come from verified package data or a trusted nutrition database.
- The profile dashboard should be read-first. Editing saved meals can be supported after the viewing flow is stable.

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
- Save only the reviewed or corrected meal record for authenticated users.

## AI Meal Detection Flow
- The guest upload flow should allow manual food entry from backend food reference data without saving the meal.
- The signed-in upload flow must call an AI vision model or food-recognition service to inspect the meal photo.
- The AI result should include food name, estimated quantity, unit, confidence score, and any uncertainty notes.
- Do not treat AI results as final. The user must be able to review and correct them.
- If AI cannot identify an item confidently, show an editable placeholder instead of silently dropping it.
- Nutrition totals should recalculate when the user edits food items or quantities.
- Saved nutrition totals must be calculated from stored food reference values and the user's reviewed measurement, not from AI-provided nutrition numbers.
- If AI detects a food differently across uploads, the user must be able to choose the correct database food and exact measurement such as grams before saving.
- Do not silently save unresolved items. Before saving, the user must choose a database match, enter manual nutrition values, or explicitly save the item as unknown nutrition.
- Items saved as unknown nutrition must remain in the meal record but be excluded from calorie and nutrient totals.
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
- If a signed-in user selects a custom meal type, ask for a custom meal name and save it only for that user.
- User-specific custom meal names should appear in that user's future meal type options and dashboard filters, but never for other users.
- Daily nutrition summary.
- Meal history with photos.
- Nutrition goals and progress.
- Allergen and dietary preference notes.
- Manual food search for items the photo detector misses.
- Confidence level for automatically detected food and quantity estimates.
- Warnings when nutrition values are estimates.
- Export or share meal summaries.
- Admin-created user profiles for the MVP.
- Magic-link password setup for new users.
- Login access after password setup.
- Role-based access for admin and normal users.
- Calendar-based profile dashboard for saved meals and calories.
- User unsubscribe flow that triggers a soft delete of that user's account data.
- PWA install support with a web app manifest, service worker, mobile theme metadata, and offline shell caching for static app assets.

## Data Saving Requirements
- Save every reviewed meal against the correct authenticated user.
- Save meals date wise using the date and time the meal was eaten or uploaded.
- Save meals meal wise using a meal type such as breakfast, lunch, dinner, snack, or custom.
- Store user-defined custom meal type names in user-scoped data, not as global meal type options.
- Store the final user-reviewed food items, quantities, and nutrition totals.
- Store calculation details such as reviewed unit, total grams, grams per unit, and nutrition basis where available so repeated calculations are auditable.
- Keep the original AI detection result when useful for audit or review, but do not expose it as verified truth.
- Allow users to update a saved meal later and recalculate totals after changes.
- When a registered user saves a reviewed meal that is not represented in `foodtable.md`, queue a new food-table candidate entry with the user's provided location.
- Do not show one user's meals, goals, or profile data to another user.
- Keep admin-created user profile data separate from public food reference data.
- When a user unsubscribes, use a soft-delete or disabled status instead of hard deleting records immediately.
- Soft-deleted users should not be able to log in, save meals, or appear as active users.
- Soft-deleted user data should remain isolated and should be excluded from normal dashboards unless an explicit admin recovery or audit feature is added.

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
- Keep user-scoped data isolated when adding profile, dashboard, and magic-link features.
- Make admin-created users, first-time setup links, and password login easy to replace with stronger auth later.
- Keep PWA/mobile support working when adding new pages by linking the manifest, registering the service worker, and preserving responsive tap-friendly controls.

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
- Put personal user details, magic-link tokens, or health records into `foodtable.md`.
- Expose admin-only user creation controls to normal users.
- Treat magic links as permanent public URLs.
- Store plain-text passwords.
- Allow direct dashboard access from a magic link after password setup is required.

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
