const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const mealsDb = require("../backend/db/database");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
loadEnv(path.join(root, ".env"));

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/auth/login") {
    handleLogin(request, response);
    return;
  }

  if (url.pathname === "/api/auth/logout") {
    handleLogout(request, response, url);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    handleAuthMe(request, response, url);
    return;
  }

  if (url.pathname === "/api/admin/users" || url.pathname.startsWith("/api/admin/users/")) {
    handleAdminUsers(request, response, url);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/magic-link") {
    handleMagicLinkAuth(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/setup-password") {
    handleSetupPassword(request, response);
    return;
  }

  if (url.pathname === "/api/users/me" || url.pathname.startsWith("/api/users/me/")) {
    handleCurrentUser(request, response, url);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/analyze") {
    handleAnalyze(request, response);
    return;
  }

  if (url.pathname === "/api/meals" || url.pathname.startsWith("/api/meals/")) {
    handleMeals(request, response, url);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/food-reference") {
    handleFoodReference(response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/foods/search") {
    handleFoodSearch(url, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/countries") {
    sendJson(response, 200, mealsDb.listCountries());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/regions") {
    sendJson(response, 200, mealsDb.listRegions(url.searchParams.get("country") || ""));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/food-sources") {
    sendJson(response, 200, mealsDb.listFoodSourceReferences(url.searchParams.get("country") || ""));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/regional-foods") {
    handleRegionalFoods(url, response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/reverse-geocode") {
    handleReverseGeocode(url, response);
    return;
  }

  let requested;
  try {
    requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  const filePath = path.resolve(root, `.${requested}`);
  const relativePath = path.relative(root, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (isBlockedStaticPath(relativePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  });
});

server.listen(port, () => {
  console.log(`NutriTracker MVP running at http://127.0.0.1:${port}/`);
});

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  });
}

function isBlockedStaticPath(relativePath) {
  const parts = relativePath.split(path.sep);
  return parts.some((part) => part.startsWith("."))
    || parts.includes("data")
    || /(^|[/\\])(?:package-lock\.json|npm-debug\.log|yarn-error\.log)$/i.test(relativePath)
    || /\.(?:key|pem|crt|p12|pfx|sqlite|sqlite3|db)$/i.test(relativePath);
}

function readJsonBody(request, maxBytes = 9 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Image payload is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("Invalid JSON request."));
      }
    });
    request.on("error", reject);
  });
}

async function handleAnalyze(request, response) {
  try {
    const body = await readJsonBody(request);
    if (!body.imageDataUrl || !String(body.imageDataUrl).startsWith("data:image/")) {
      sendJson(response, 400, { error: "Upload a valid image first." });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      sendJson(response, 503, { error: "Meal photo analysis is not available yet. Please check the server configuration." });
      return;
    }

    const foodReference = buildFoodReferencePrompt();
    const result = await callOpenAIVision({
      imageDataUrl: body.imageDataUrl,
      location: [body.city, body.location].filter(Boolean).join(", ") || "Unknown",
      foodReference
    });
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Unable to analyze image." });
  }
}

async function handleAdminUsers(request, response, url) {
  try {
    const adminSession = currentSession(request, url);
    if (!adminSession || adminSession.role !== "admin") {
      sendJson(response, 403, { error: "Admin login is required." });
      return;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const userId = segments[3] || "";
    const action = segments[4] || "";

    if (request.method === "GET" && url.pathname === "/api/admin/users") {
      sendJson(response, 200, mealsDb.listUsers({ status: url.searchParams.get("status") || "" }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/users") {
      const body = await readJsonBody(request);
      const created = mealsDb.createUser(body);
      sendJson(response, 201, withMagicLink(created, request));
      return;
    }

    if (!userId) {
      sendJson(response, 404, { error: "User not found." });
      return;
    }

    if (request.method === "GET" && segments.length === 4) {
      const user = mealsDb.getUser(userId);
      if (!user) {
        sendJson(response, 404, { error: "User not found." });
        return;
      }
      sendJson(response, 200, user);
      return;
    }

    if (request.method === "PUT" && segments.length === 4) {
      const body = await readJsonBody(request);
      const user = mealsDb.updateUser(userId, body);
      if (!user) {
        sendJson(response, 404, { error: "User not found." });
        return;
      }
      sendJson(response, 200, user);
      return;
    }

    if (request.method === "POST" && action === "access-links") {
      const body = await readJsonBody(request);
      const created = mealsDb.createUserAccessToken(userId, body);
      sendJson(response, 201, withMagicLink(created, request));
      return;
    }

    if (request.method === "PATCH" && action === "role") {
      const body = await readJsonBody(request);
      const user = mealsDb.updateUserRole(userId, body.role);
      if (!user) {
        sendJson(response, 404, { error: "User not found." });
        return;
      }
      sendJson(response, 200, user);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Unable to process admin user request." });
  }
}

async function handleLogin(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  try {
    const body = await readJsonBody(request);
    const session = mealsDb.loginUser(body);
    sendJson(response, 200, session);
  } catch (error) {
    sendJson(response, 401, { error: error.message || "Unable to log in." });
  }
}

function handleLogout(request, response, url) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  const token = authTokenFromRequest(request, url);
  if (token) mealsDb.revokeSession(token);
  sendJson(response, 200, { ok: true });
}

function handleAuthMe(request, response, url) {
  const session = currentSession(request, url);
  if (!session) {
    sendJson(response, 401, { error: "Login is required." });
    return;
  }
  sendJson(response, 200, {
    user: session.user,
    role: session.role
  });
}

async function handleMagicLinkAuth(request, response) {
  try {
    const body = await readJsonBody(request);
    const session = mealsDb.validateMagicLinkToken(body.token);
    if (!session) {
      sendJson(response, 401, { error: "Invalid or expired magic link." });
      return;
    }
    sendJson(response, 200, {
      user: session.user,
      tokenType: "password_setup"
    });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Unable to validate magic link." });
  }
}

async function handleSetupPassword(request, response) {
  try {
    const body = await readJsonBody(request);
    const result = mealsDb.setupUserPassword(body);
    sendJson(response, 200, {
      ok: true,
      user: result.user,
      redirect: "/login.html"
    });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Unable to set password." });
  }
}

function handleCurrentUser(request, response, url) {
  const session = currentSession(request, url);
  if (!session) {
    sendJson(response, 401, { error: "Login is required." });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/users/me") {
    sendJson(response, 200, session.user);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/users/me/dashboard") {
    const dashboard = mealsDb.getUserDashboard(session.user.id, {
      start: url.searchParams.get("start") || "",
      end: url.searchParams.get("end") || ""
    });
    sendJson(response, 200, dashboard);
    return;
  }

  if (url.pathname === "/api/users/me/meals" || url.pathname.startsWith("/api/users/me/meals/")) {
    handleCurrentUserMeals(request, response, url, session.user);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/users/me/unsubscribe") {
    const user = mealsDb.unsubscribeUser(session.user.id);
    sendJson(response, 200, { ok: true, user });
    return;
  }

  sendJson(response, 404, { error: "Current user route not found." });
}

function handleCurrentUserMeals(request, response, url, user) {
  const mealId = decodeURIComponent(url.pathname.replace(/^\/api\/users\/me\/meals\/?/, ""));

  if (request.method === "GET" && url.pathname === "/api/users/me/meals") {
    sendJson(response, 200, mealsDb.listMeals({
      userId: user.id,
      mealType: url.searchParams.get("mealType") || "",
      start: url.searchParams.get("start") || "",
      end: url.searchParams.get("end") || ""
    }));
    return;
  }

  if (request.method === "GET" && mealId) {
    const meal = mealsDb.getMeal(mealId);
    if (!meal || meal.userId !== user.id) {
      sendJson(response, 404, { error: "Meal not found." });
      return;
    }
    sendJson(response, 200, meal);
    return;
  }

  sendJson(response, 405, { error: "Method not allowed." });
}

async function handleMeals(request, response, url) {
  try {
    const mealId = decodeURIComponent(url.pathname.replace(/^\/api\/meals\/?/, ""));
    const session = currentSession(request, url);
    if (!session) {
      sendJson(response, 401, { error: "Login is required." });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/meals") {
      sendJson(response, 200, mealsDb.listMeals({
        userId: session.user.id,
        mealType: url.searchParams.get("mealType") || "",
        start: url.searchParams.get("start") || "",
        end: url.searchParams.get("end") || ""
      }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/meals") {
      const body = await readJsonBody(request);
      const meal = mealsDb.createMeal({ ...body, userId: session.user.id });
      sendJson(response, 201, meal);
      return;
    }

    if (!mealId) {
      sendJson(response, 404, { error: "Meal not found." });
      return;
    }

    if (request.method === "GET") {
      const meal = mealsDb.getMeal(mealId);
      if (!meal || meal.userId !== session.user.id) {
        sendJson(response, 404, { error: "Meal not found." });
        return;
      }
      sendJson(response, 200, meal);
      return;
    }

    if (request.method === "PUT") {
      const body = await readJsonBody(request);
      const existing = mealsDb.getMeal(mealId);
      if (!existing || existing.userId !== session.user.id) {
        sendJson(response, 404, { error: "Meal not found." });
        return;
      }
      const meal = mealsDb.updateMeal(mealId, { ...body, userId: session.user.id });
      if (!meal) {
        sendJson(response, 404, { error: "Meal not found." });
        return;
      }
      sendJson(response, 200, meal);
      return;
    }

    if (request.method === "DELETE") {
      const existing = mealsDb.getMeal(mealId);
      if (!existing || existing.userId !== session.user.id) {
        sendJson(response, 404, { error: "Meal not found." });
        return;
      }
      const deleted = mealsDb.deleteMeal(mealId);
      if (!deleted) {
        sendJson(response, 404, { error: "Meal not found." });
        return;
      }
      sendJson(response, 200, { ok: true });
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Unable to process meal request." });
  }
}

function handleFoodReference(response) {
  const foodtablePath = path.join(root, "foodtable.md");
  if (!fs.existsSync(foodtablePath)) {
    sendJson(response, 404, { error: "foodtable.md unavailable." });
    return;
  }
  const markdown = fs.readFileSync(foodtablePath, "utf8");
  sendJson(response, 200, {
    meals: parseFoodTableRows(markdown),
    ingredients: mealsDb.listNutritionReferences(),
    portionSizes: mealsDb.listPortionReferences()
  });
}

function handleFoodSearch(url, response) {
  const query = url.searchParams.get("q") || "";
  const limit = Number.parseInt(url.searchParams.get("limit") || "25", 10);
  sendJson(response, 200, {
    query,
    results: mealsDb.searchFoods(query, Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 25)
  });
}

function handleRegionalFoods(url, response) {
  sendJson(response, 200, {
    foods: mealsDb.listRegionalFoodItems({
      countryIso2: url.searchParams.get("country") || "",
      regionName: url.searchParams.get("region") || "",
      query: url.searchParams.get("q") || ""
    }),
    staples: mealsDb.listRegionalStapleRankings({
      countryIso2: url.searchParams.get("country") || "",
      regionName: url.searchParams.get("region") || ""
    })
  });
}

function currentSession(request, url) {
  const token = authTokenFromRequest(request, url);
  return token ? mealsDb.getSession(token) : null;
}

function authTokenFromRequest(request, url) {
  const explicit = request.headers["x-auth-token"];
  if (explicit) return Array.isArray(explicit) ? explicit[0] : explicit;
  const auth = request.headers.authorization || "";
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  if (match) return match[1];
  return url.searchParams.get("session") || "";
}

function withMagicLink(payload, request) {
  const origin = `${request.socket.encrypted ? "https" : "http"}://${request.headers.host}`;
  return {
    ...payload,
    magicLink: `${origin}${payload.magicLinkPath}`
  };
}

async function handleReverseGeocode(url, response) {
  const lat = Number.parseFloat(url.searchParams.get("lat") || "");
  const lon = Number.parseFloat(url.searchParams.get("lon") || "");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    sendJson(response, 400, { error: "Valid latitude and longitude are required." });
    return;
  }

  try {
    const query = new URL("https://nominatim.openstreetmap.org/reverse");
    query.searchParams.set("format", "jsonv2");
    query.searchParams.set("lat", String(lat));
    query.searchParams.set("lon", String(lon));
    query.searchParams.set("zoom", "10");
    query.searchParams.set("addressdetails", "1");

    const providerResponse = await fetch(query, {
      headers: {
        "User-Agent": "NutriTrackerMVP/0.1 local development",
        "Accept": "application/json"
      }
    });
    const payload = await providerResponse.json();
    if (!providerResponse.ok) {
      sendJson(response, 502, { error: "Unable to resolve browser location." });
      return;
    }

    const address = payload.address || {};
    sendJson(response, 200, {
      city: address.city || address.town || address.village || address.municipality || "",
      country_code: address.country_code || "",
      source: "browser-geolocation"
    });
  } catch {
    sendJson(response, 502, { error: "Unable to resolve browser location." });
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function buildFoodReferencePrompt() {
  const foodtablePath = path.join(root, "foodtable.md");
  if (!fs.existsSync(foodtablePath)) return "";
  const markdown = fs.readFileSync(foodtablePath, "utf8");
  const mealNames = markdown
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells) => `${cells[3]}: ${cells[4]}`)
    .slice(0, 120);
  const ingredientNames = markdown
    .split(/\r?\n/)
    .filter((line) => /^\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*\d/.test(line))
    .map((line) => line.split("|").map((cell) => cell.trim())[1])
    .filter(Boolean)
    .slice(0, 260);

  return [
    "Known meals and staple ingredients:",
    mealNames.join("; "),
    "Known individual ingredients:",
    ingredientNames.join(", ")
  ].join("\n");
}

function parseFoodTableRows(markdown) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells) => ({
      id: Number(cells[1]),
      region: cells[2],
      name: cells[3],
      staples: cells[4],
      averageQuantity: cells[5],
      dietConfiguration: cells[6],
      calories: Number(cells[7]) || 0,
      protein: Number(cells[8]) || 0,
      carbs: Number(cells[9]) || 0,
      fat: Number(cells[10]) || 0,
      fiber: Number(cells[11]) || 0,
      sodium: Number(cells[12]) || 0,
      notes: cells[13] || ""
    }))
    .filter((item) => item.name);
}

function parseIngredientRows(markdown) {
  const inSection = markdown.split("## Ingredient Nutrition Reference Baseline")[1] || "";
  return inSection
    .split(/\r?\n/)
    .filter((line) => /^\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*\d/.test(line))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells) => ({
      name: cells[1],
      category: cells[2],
      commonState: cells[3],
      calories: Number(cells[4]) || 0,
      protein: Number(cells[5]) || 0,
      carbs: Number(cells[6]) || 0,
      fat: Number(cells[7]) || 0,
      fiber: Number(cells[8]) || 0,
      sugar: Number(cells[9]) || 0,
      sodium: Number(cells[10]) || 0,
      dataConfidence: cells[11],
      notes: cells[12] || ""
    }))
    .filter((item) => item.name);
}

function parsePortionRows(markdown) {
  const section = markdown.split("## Portion Size Reference")[1] || "";
  const beforeNextSection = section.split(/\n##\s+/)[0] || "";
  return beforeNextSection
    .split(/\r?\n/)
    .filter((line) => /^\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*\d/.test(line))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .map((cells) => ({
      foodName: cells[1],
      unit: cells[2],
      smallGrams: Number(cells[3]) || 0,
      mediumGrams: Number(cells[4]) || 0,
      largeGrams: Number(cells[5]) || 0,
      defaultSize: cells[6] || "medium",
      nutritionBasis: cells[7] || "per_100g",
      notes: cells[8] || ""
    }))
    .filter((item) => item.foodName && item.mediumGrams);
}

async function callOpenAIVision({ imageDataUrl, location, foodReference }) {
  const schema = {
    type: "object",
    properties: {
      summary: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            foodName: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string", enum: ["grams", "pieces", "cups", "tbsp", "serving"] },
            confidence: { type: "number" },
            uncertaintyNote: { type: "string" },
            evidence: { type: "string" }
          },
          required: ["foodName", "quantity", "unit", "confidence", "uncertaintyNote", "evidence"],
          additionalProperties: false
        }
      }
    },
    required: ["summary", "items"],
    additionalProperties: false
  };

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You analyze meal photos for a nutrition tracker. Return JSON only. Identify visible meal components separately, not just a dish name. Estimate quantity conservatively. If uncertain, include the visible placeholder as a low-confidence editable item instead of dropping it. Do not provide medical advice."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `User location: ${location}\nUse this local reference only for naming hints, not as final truth:\n${foodReference}\n\nTask: list each visible food component separately. Examples: chicken, rice, potato, apple, sauce, salad, roti. Give quantity, unit, confidence from 0 to 1, and short evidence from the image.`
            },
            {
              type: "input_image",
              image_url: imageDataUrl
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "meal_photo_analysis",
          strict: true,
          schema
        }
      }
    })
  });

  const payload = await apiResponse.json();
  if (!apiResponse.ok) {
    throw new Error(payload.error && payload.error.message ? sanitizeProviderError(payload.error.message) : "Meal photo analysis failed.");
  }

  const text = extractResponseText(payload);
  if (!text) throw new Error("Meal photo analysis returned no result.");
  const parsed = JSON.parse(text);
  return {
    provider: "openai",
    model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
    summary: parsed.summary,
    items: parsed.items
  };
}

function sanitizeProviderError(message) {
  const text = String(message || "");
  if (/quota|billing|api key|authentication|permission|model|openai/i.test(text)) {
    return "Meal photo analysis is temporarily unavailable. Please check the server configuration.";
  }
  return text;
}

function extractResponseText(payload) {
  if (payload.output_text) return payload.output_text;
  return (payload.output || [])
    .flatMap((output) => output.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();
}
