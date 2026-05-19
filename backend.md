# Backend Agent Prompt

```text
You are a senior backend engineer working on my Meal Nutrition Tracker app.

Project context:
- The app lets users upload a meal photo, uses AI vision to detect food items and quantities, lets the user review/edit the result, then saves the corrected meal by date and meal type.
- The next MVP step adds admin login, admin-created users, first-time magic-link password setup, user login, roles, permissions, and unsubscribe soft delete.
- Admin creates a basic user profile, then personally shares a setup magic link with the user.
- User opens the setup magic link to create a password, then logs in to access their own profile dashboard, upload meals, and review saved history.
- Current app has a small Node.js server in scripts/server.js.
- Current backend already has:
  - POST /api/analyze
  - GET /api/meals
  - POST /api/meals
  - GET /api/meals/:id
  - PUT /api/meals/:id
  - DELETE /api/meals/:id
  - GET /api/food-reference
  - GET /api/reverse-geocode
  - static file serving
- Current frontend can use backend meal APIs and localStorage fallback.
- foodtable.md is currently used as the canonical local food reference.
- I want the frontend UI to remain mostly the same, but user-specific saved meal data should come from the backend.

Your task:
Implement user onboarding and profile-dashboard backend support without rewriting the whole app.

Backend goals:
1. Keep the existing frontend working.
2. Add authenticated admin access before admin pages and APIs.
3. Add admin-created user profiles.
4. Add first-time magic-link password setup for users.
5. Add user login after password setup.
6. Add role-based access for admin and normal users.
7. Scope meals, goals, and profile dashboard data by authenticated user.
8. Keep saved meal history in backend APIs.
9. Use SQLite for the MVP unless the repo already has another database setup.
10. Keep AI analysis on the backend only.
11. Keep nutrition values labeled as estimates.
12. Do not store secrets in code.
13. Do not update foodtable.md directly from anonymous users.
14. Do not store personal health data or meal photos without clear user consent.
15. For variable-size foods, calculate from grams when reliable per-100g nutrition data exists.
16. Make the auth design easy to replace later with email, SMS, or an identity provider.
17. Add unsubscribe soft delete for normal users.

User onboarding rules:
- MVP onboarding is admin-led.
- Admin must log in before using the admin area.
- A default first admin credential may be seeded for local setup, but it must be temporary and changeable.
- Admin can create a user profile with basic fields.
- Admin can generate or view a first-time setup magic link for that user.
- Admin shares the setup magic link personally outside the app for now.
- User opens the setup magic link to create a password and confirm password.
- Password setup must validate required fields, matching confirmation, minimum length, and reasonable complexity.
- After password setup succeeds, redirect the user to the login page.
- User logs in with their credentials to access their own profile and meal flow.
- Magic-link tokens must be treated like secrets and should be revoked or marked used after password setup.
- Store token hashes where practical instead of raw tokens.
- Avoid logging raw tokens.
- Allow tokens to be disabled or rotated later.
- A magic link must never expose another user's data.

Role and permission rules:
- Supported roles are `admin` and `user`.
- Admin users can create users, view users, update user basics, rotate setup links, and promote or demote other users where allowed.
- Normal users can add meals, review and save meals, view their own profile dashboard, view calendar history, view meal details, and unsubscribe.
- Normal users must not access admin pages or admin APIs.
- Role changes must require an authenticated admin session.
- Soft-deleted or inactive users must not be able to log in or use meal APIs.

Profile dashboard goals:
- Show basic user profile details.
- Show date-wise meal history.
- Show daily calories and macro totals.
- Show meal count by day.
- Let the user select a date and deep dive into saved meals for that date.
- Return meal detail data with photo, reviewed items, quantities, confidence labels, nutrition totals, and nutrient table values.
- Keep the dashboard read-first for the first implementation. Saved meal editing can build on existing meal update APIs later.

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
- POST /api/auth/login
  - Accept email or configured login identifier and password.
  - Validate password against a stored password hash.
  - Return a session token or secure session payload with role and user basics.
  - Reject inactive, pending without password, or soft-deleted users.

- POST /api/auth/logout
  - Revoke the current session when server-side sessions are used.

- GET /api/auth/me
  - Return the current authenticated user and role from the session.

- POST /api/auth/setup-password
  - Accept setup magic-link token, password, and confirmPassword.
  - Validate the token, password rules, and matching confirmation.
  - Store only the password hash.
  - Mark passwordSetAt.
  - Revoke or mark the setup token as used.
  - Return a success response that tells the frontend to redirect to login.

- POST /api/admin/auth/change-password
  - Let an authenticated admin replace the temporary default password.
  - Store only the new password hash.

- POST /api/admin/users
  - Create a user profile.
  - Required MVP fields: displayName and at least one contact field.
  - Optional fields: contactEmail, contactPhone, location, city, dietaryPreference, status.
  - Require authenticated admin access.
  - Return the created user and a setup magic link or token display value for the admin to share personally.

- GET /api/admin/users
  - Return users for admin review.
  - Support simple status filtering if easy.
  - Require authenticated admin access.

- GET /api/admin/users/:id
  - Return one user profile for admin review.
  - Require authenticated admin access.

- PUT /api/admin/users/:id
  - Update basic profile fields and status.
  - Require authenticated admin access.

- PATCH /api/admin/users/:id/role
  - Promote an active user to admin or change an admin back to normal user where allowed.
  - Require authenticated admin access.
  - Prevent the last active admin from being demoted or disabled.

- POST /api/admin/users/:id/access-links
  - Create or rotate a password setup magic-link token for a user.
  - Return the shareable magic link only at creation time if token hashes are stored.
  - Require authenticated admin access.

- POST /api/auth/magic-link
  - Accept a magic-link token.
  - Validate the token.
  - Return only enough setup context to render the password setup page.
  - Do not return a full dashboard session.
  - Do not expose the raw token back unnecessarily.

- GET /api/users/me
  - Return the current user profile based on the authenticated session.

- GET /api/users/me/dashboard
  - Return holistic profile dashboard data.
  - Include date-wise calories, macro totals, meal counts, and recent meals.
  - Support start/end date filters if easy.

- GET /api/users/me/meals
  - Return current user's saved meals ordered newest first.
  - Support date and meal type filtering.
  - This can call the same meal service as GET /api/meals, but must be user-scoped.

- GET /api/users/me/meals/:id
  - Return one current-user meal with items and nutrition detail.

- POST /api/users/me/unsubscribe
  - Let the current normal user unsubscribe from the app.
  - Soft-delete or disable the account by setting status and unsubscribedAt/deletedAt.
  - Revoke active sessions and setup tokens.
  - Keep records isolated and hidden from normal active dashboards.

- POST /api/analyze
  - Keep existing behavior.
  - Accept uploaded image data.
  - Return AI-detected food items with foodName, quantity, unit, confidence, uncertaintyNote, and evidence.

- POST /api/meals
  - Save only reviewed/corrected meal data.
  - Associate the meal with the current authenticated user.
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
- admin_users
  - id
  - display_name
  - contact_email nullable
  - password_hash
  - password_changed_at nullable
  - role default admin
  - status default active
  - created_at
  - updated_at

- users
  - id
  - display_name
  - contact_email nullable
  - contact_phone nullable
  - location nullable
  - city nullable
  - dietary_preference nullable
  - role default user
  - password_hash nullable until setup
  - password_set_at nullable
  - status default pending, such as pending, active, inactive, unsubscribed, deleted
  - unsubscribed_at nullable
  - deleted_at nullable for soft delete
  - created_by_admin_id nullable
  - created_at
  - updated_at

- user_access_tokens
  - id
  - user_id
  - token_hash
  - label nullable
  - purpose default password_setup
  - status default active, such as active, used, revoked, expired
  - expires_at nullable
  - last_used_at nullable
  - created_at
  - revoked_at nullable

- auth_sessions
  - id
  - user_id
  - token_hash
  - role
  - expires_at
  - created_at
  - revoked_at nullable
  - last_seen_at nullable

- user_goals
  - id
  - user_id
  - daily_calories nullable
  - daily_protein nullable
  - daily_fat nullable
  - daily_carbs nullable
  - daily_fiber nullable
  - daily_sodium nullable
  - created_at
  - updated_at

- meals
  - id
  - user_id nullable only for old or anonymous fallback records
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
- Add a shared login page for admins and normal users.
- Redirect unauthenticated admin users to login before showing the admin section.
- Add a password setup page loaded from a first-time magic link.
- After password setup, redirect to login.
- Add a user profile dashboard page loaded from the authenticated user session.
- Existing meal upload and review flow should work after user login.
- Replace anonymous meal listing with user-scoped backend fetch calls from the auth session.
- Add role-aware navigation so admin links are visible only to admin users.
- Add an unsubscribe action for normal users that calls the soft-delete endpoint.
- Keep localStorage only as fallback if the backend is unavailable, or remove it if backend works reliably.
- Show clear errors if backend save/load fails.
- Do not change the visual design unless required.
- Keep manual correction flow before save.
- Save only reviewed/corrected meal records.
- Do not show meals from other users.

Implementation rules:
- Read the existing code before editing.
- Keep changes small and scoped.
- Match existing style.
- Do not install new dependencies without asking first.
- If SQLite dependency is needed, ask before installing.
- Add at least one backend test for meal saving/loading.
- Add tests for admin login, user creation, setup-link validation, password setup, user login, role restrictions, unsubscribe soft delete, and user-scoped dashboard or meal lookup.
- Run existing tests/build after changes.
- Explain what changed and how to run it.

Expected result:
After implementation, an admin should log in, create a user, get a first-time setup magic link, and share it personally. The user should open the link, create and confirm a valid password, be redirected to login, then log in and see only their own dashboard, saved meal history, and calorie summary. Admins should be able to grant admin access to another active user. Normal users should be able to unsubscribe, which soft-deletes or disables their account without exposing data to others.
```
