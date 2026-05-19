(function () {
  const GOALS = {
    calories: 2400,
    protein: 90,
    carbs: 275,
    fat: 70,
    fiber: 30,
    sodium: 2300,
    sugar: 50,
    saturatedFat: 20,
    cholesterol: 300,
    potassium: 3400,
    calcium: 1000,
    iron: 18,
    vitaminC: 90
  };

  const UNIT_FACTORS = {
    serving: 1,
    bowl: 1,
    plate: 1,
    cup: 0.5,
    cups: 0.5,
    piece: 0.2,
    pieces: 0.2,
    gram: 1 / 350,
    grams: 1 / 350,
    g: 1 / 350,
    tbsp: 0.06
  };

  const DISPLAY_GRAMS_BY_UNIT = {
    serving: 150,
    bowl: 200,
    plate: 300
  };

  const PIECE_GRAM_ESTIMATES = [
    { pattern: /cherry tomato|grape tomato/, grams: 17 },
    { pattern: /egg/, grams: 50 },
    { pattern: /apple|orange|banana|potato|tomato/, grams: 120 },
    { pattern: /chicken|fish|steak|bread|roti|naan|tortilla/, grams: 80 }
  ];

  const NUTRIENT_FIELDS = [
    ["calories", "Calories", "kcal"],
    ["protein", "Protein", "g"],
    ["carbs", "Carbs", "g"],
    ["fat", "Fat", "g"],
    ["fiber", "Fiber", "g"],
    ["sugar", "Sugar", "g"],
    ["sodium", "Sodium", "mg"],
    ["saturatedFat", "Saturated fat", "g"],
    ["cholesterol", "Cholesterol", "mg"],
    ["potassium", "Potassium", "mg"],
    ["calcium", "Calcium", "mg"],
    ["iron", "Iron", "mg"],
    ["vitaminC", "Vitamin C", "mg"]
  ];

  const PER_100_UNITS = new Set(["gram", "grams", "g", "tbsp", "cup", "cups", "piece", "pieces"]);
  const PORTION_UNITS = new Set(["piece", "pieces", "slice", "slices"]);
  const MEAL_FALLBACK_UNITS = new Set(["serving"]);

  const CITY_OPTIONS_BY_LOCATION = {
    India: ["Ahmedabad", "Bengaluru", "Chennai", "Delhi", "Hyderabad", "Kolkata", "Mumbai", "Pune", "Gujarat", "Kerala", "Punjab", "Tamil Nadu", "West Bengal"],
    "South Asia": ["Colombo", "Dhaka", "Islamabad", "Karachi", "Kathmandu", "Lahore"],
    "North America": ["Chicago", "Los Angeles", "New York", "Phoenix", "Toronto", "Vancouver"],
    "Latin America": ["Bogota", "Buenos Aires", "Lima", "Mexico City", "Rio de Janeiro", "Santiago", "Sao Paulo"],
    Europe: ["Amsterdam", "Berlin", "Dublin", "London", "Madrid", "Paris", "Rome"],
    "East Asia": ["Beijing", "Hong Kong", "Seoul", "Shanghai", "Taipei", "Tokyo"],
    "Southeast Asia": ["Bangkok", "Ho Chi Minh City", "Jakarta", "Kuala Lumpur", "Manila", "Singapore"],
    "Middle East": ["Baghdad", "Dubai", "Istanbul", "Jerusalem", "Riyadh", "Tehran"],
    Africa: ["Cairo", "Cape Town", "Johannesburg", "Lagos", "Nairobi"],
    Oceania: ["Auckland", "Brisbane", "Melbourne", "Perth", "Sydney"]
  };

  const INDIAN_CITY_TO_REGION = {
    ahmedabad: "Gujarat",
    surat: "Gujarat",
    vadodara: "Gujarat",
    rajkot: "Gujarat",
    bengaluru: "Karnataka",
    bangalore: "Karnataka",
    chennai: "Tamil Nadu",
    coimbatore: "Tamil Nadu",
    madurai: "Tamil Nadu",
    delhi: "Delhi",
    "new delhi": "Delhi",
    hyderabad: "Telangana",
    kolkata: "West Bengal",
    mumbai: "Maharashtra",
    pune: "Maharashtra",
    kochi: "Kerala",
    trivandrum: "Kerala",
    thiruvananthapuram: "Kerala",
    chandigarh: "Chandigarh",
    jaipur: "Rajasthan",
    lucknow: "Uttar Pradesh",
    kanpur: "Uttar Pradesh",
    patna: "Bihar",
    bhopal: "Madhya Pradesh",
    indore: "Madhya Pradesh",
    raipur: "Chhattisgarh",
    ranchi: "Jharkhand",
    bhubaneswar: "Odisha",
    guwahati: "Assam",
    panaji: "Goa",
    shimla: "Himachal Pradesh",
    srinagar: "Jammu and Kashmir",
    leh: "Ladakh",
    amritsar: "Punjab",
    ludhiana: "Punjab"
  };

  const state = {
    references: [],
    ingredientReferences: [],
    portionReferences: [],
    regionalFoodItems: [],
    regionalStaples: [],
    regions: [],
    items: [],
    manualDraft: null,
    activePortionEditorId: null,
    activeSuggestKey: null,
    photoDataUrl: "",
    fileName: "",
    history: [],
    currentMealId: null,
    sessionToken: "",
    currentUser: null
  };

  const els = {};

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }

  function init() {
    bindElements();
    initSessionAccess();
    setDefaultTime();
    setDetectedLocation();
    bindEvents();
    renderHistory();
    loadMealHistory();
    loadFoodReference();
  }

  function bindElements() {
    [
      "referenceStatus",
      "photoInput",
      "uploadPanel",
      "workspace",
      "mealPreview",
      "mealType",
      "mealTime",
      "userLocation",
      "locationSuggestions",
      "userCity",
      "citySuggestions",
      "saveConsent",
      "analyzeButton",
      "totalCalories",
      "totalProtein",
      "totalCarbs",
      "totalFat",
      "proteinBar",
      "carbBar",
      "fatBar",
      "analysisNote",
      "addItemButton",
      "itemsBody",
      "itemsFootnote",
      "manualAddPanel",
      "manualDraftBody",
      "confirmAddItemButton",
      "cancelAddItemButton",
      "generalNutrients",
      "carbNutrients",
      "lipidNutrients",
      "microNutrients",
      "saveMealButton",
      "saveMessage",
      "historyList",
      "clearHistoryButton",
      "profileLink"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function initSessionAccess() {
    state.sessionToken = localStorage.getItem("nutritracker.sessionToken") || "";
    if (!state.sessionToken) {
      window.location.href = "login.html";
      return;
    }
    loadCurrentUser();
  }

  async function loadCurrentUser() {
    try {
      const response = await fetchWithAccess("/api/auth/me", { cache: "no-store" });
      if (!response.ok) throw new Error("User profile unavailable.");
      const payload = await response.json();
      state.currentUser = payload.user;
      if (els.referenceStatus) {
        els.referenceStatus.textContent = `${state.currentUser.displayName} profile active`;
      }
    } catch {
      state.currentUser = null;
      localStorage.removeItem("nutritracker.sessionToken");
      state.sessionToken = "";
      window.location.href = "login.html";
    }
  }

  function fetchWithAccess(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (state.sessionToken) headers.set("X-Auth-Token", state.sessionToken);
    return fetch(url, { ...options, headers });
  }

  function bindEvents() {
    els.photoInput.addEventListener("change", handlePhotoUpload);
    els.userLocation.addEventListener("change", handleLocationChange);
    els.userCity.addEventListener("change", analyzeCurrentPhoto);
    els.analyzeButton.addEventListener("click", analyzeCurrentPhoto);
    els.addItemButton.addEventListener("click", () => {
      state.manualDraft = createManualAddedItem();
      els.itemsFootnote.textContent = "Manual items can include foods that were not visible in the photo or were missed by AI.";
      renderManualDraft();
    });
    els.confirmAddItemButton.addEventListener("click", confirmManualDraft);
    els.cancelAddItemButton.addEventListener("click", cancelManualDraft);
    els.saveMealButton.addEventListener("click", saveReviewedMeal);
    els.clearHistoryButton.addEventListener("click", clearHistory);
  }

  function setDefaultTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    els.mealTime.value = now.toISOString().slice(0, 16);
  }

  function setDetectedLocation() {
    detectInternetLocation()
      .then(applyDetectedLocation)
      .catch(() => renderCitySuggestions());
  }

  function applyDetectedLocation(detected) {
    if (!detected) return;
    if (!els.userLocation.value && detected.location) els.userLocation.value = detected.location;
    if (!els.userCity.value && detected.city) els.userCity.value = detected.city;
    renderCitySuggestions();
  }

  async function detectInternetLocation() {
    const coordinates = await getBrowserCoordinates().catch(() => null);
    if (coordinates) {
      const url = `/api/reverse-geocode?lat=${encodeURIComponent(coordinates.latitude)}&lon=${encodeURIComponent(coordinates.longitude)}`;
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return normalizeInternetLocation(await response.json());
    }

    const response = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!response.ok) return { location: "", city: "" };
    return normalizeInternetLocation(await response.json());
  }

  function getBrowserCoordinates() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Browser location unavailable."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        reject,
        { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 6000 }
      );
    });
  }

  function normalizeInternetLocation(payload) {
    const address = payload && payload.address ? payload.address : {};
    const countryCode = String(payload.country_code || address.country_code || "").toUpperCase();
    const city = payload.city
      || payload.town
      || payload.village
      || payload.municipality
      || address.city
      || address.town
      || address.village
      || address.municipality
      || "";
    return {
      location: countryToFoodRegion(countryCode),
      city
    };
  }

  function countryToFoodRegion(country) {
    const regions = {
      IN: "India",
      PK: "South Asia",
      BD: "South Asia",
      LK: "South Asia",
      NP: "South Asia",
      US: "North America",
      CA: "North America",
      MX: "Latin America",
      BR: "Latin America",
      AR: "Latin America",
      CO: "Latin America",
      PE: "Latin America",
      CL: "Latin America",
      GB: "Europe",
      IE: "Europe",
      FR: "Europe",
      DE: "Europe",
      IT: "Europe",
      ES: "Europe",
      NL: "Europe",
      PT: "Europe",
      GR: "Europe",
      CN: "East Asia",
      JP: "East Asia",
      KR: "East Asia",
      TH: "Southeast Asia",
      VN: "Southeast Asia",
      ID: "Southeast Asia",
      MY: "Southeast Asia",
      PH: "Southeast Asia",
      SG: "Southeast Asia",
      AE: "Middle East",
      SA: "Middle East",
      TR: "Middle East",
      IR: "Middle East",
      NG: "Africa",
      KE: "Africa",
      ZA: "Africa",
      EG: "Africa",
      MA: "Africa",
      AU: "Oceania",
      NZ: "Oceania"
    };
    return regions[country] || "";
  }

  async function loadFoodReference() {
    try {
      const response = await fetch("/api/food-reference", { cache: "no-store" });
      if (!response.ok) throw new Error("food reference unavailable");
      const reference = await response.json();
      state.references = reference.meals || [];
      state.ingredientReferences = reference.ingredients || [];
      state.portionReferences = reference.portionSizes || [];
      await loadRegionalFoodReference();
      els.referenceStatus.textContent = "Nutrition data ready";
      renderSuggestionLists();
    } catch (error) {
      try {
        const response = await fetch("foodtable.md", { cache: "no-store" });
        if (!response.ok) throw new Error("foodtable.md unavailable");
        const markdown = await response.text();
        state.references = parseFoodTable(markdown);
        state.ingredientReferences = parseIngredientNutrition(markdown);
        state.portionReferences = parsePortionSizeReference(markdown);
        els.referenceStatus.textContent = "Nutrition data ready";
      } catch {
        state.references = fallbackReferences();
        state.ingredientReferences = fallbackIngredientReferences();
        state.portionReferences = fallbackPortionReferences();
        els.referenceStatus.textContent = "Basic nutrition data ready";
      }
      renderSuggestionLists();
    }
  }

  async function loadRegionalFoodReference() {
    try {
      const [regionsResponse, regionalResponse] = await Promise.all([
        fetch("/api/regions?country=IN", { cache: "no-store" }),
        fetch("/api/regional-foods?country=IN", { cache: "no-store" })
      ]);
      if (!regionsResponse.ok || !regionalResponse.ok) throw new Error("regional reference unavailable");
      state.regions = await regionsResponse.json();
      const regional = await regionalResponse.json();
      state.regionalFoodItems = regional.foods || [];
      state.regionalStaples = regional.staples || [];
    } catch {
      state.regions = [];
      state.regionalFoodItems = [];
      state.regionalStaples = [];
    }
  }

  function renderSuggestionLists() {
    if (!els.locationSuggestions) return;
    const locations = uniqueValues(state.references.flatMap((ref) => splitLocation(ref.region)));
    els.locationSuggestions.innerHTML = locations
      .map((location) => `<option value="${escapeAttr(location)}"></option>`)
      .join("");
    renderCitySuggestions();
  }

  function renderCitySuggestions() {
    if (!els.citySuggestions) return;
    els.citySuggestions.innerHTML = citySuggestionsForLocation(els.userLocation.value, state.regions)
      .map((city) => `<option value="${escapeAttr(city)}"></option>`)
      .join("");
  }

  function handleLocationChange() {
    const options = citySuggestionsForLocation(els.userLocation.value, state.regions);
    if (els.userCity.value && !options.includes(els.userCity.value)) {
      els.userCity.value = "";
    }
    renderCitySuggestions();
    analyzeCurrentPhoto();
  }

  function citySuggestionsForLocation(location, regions = []) {
    const normalized = String(location || "").toLowerCase();
    const key = Object.keys(CITY_OPTIONS_BY_LOCATION).find((entry) => entry.toLowerCase() === normalized)
      || Object.keys(CITY_OPTIONS_BY_LOCATION).find((entry) => normalized.includes(entry.toLowerCase()) || entry.toLowerCase().includes(normalized));
    const base = key ? CITY_OPTIONS_BY_LOCATION[key] : [];
    if (String(location || "").toLowerCase() !== "india") return base;
    const regionNames = regions
      .filter((region) => region.countryIso2 === "IN")
      .map((region) => region.name);
    return uniqueValues([...base, ...regionNames]);
  }

  function parseFoodTable(markdown) {
    return markdown
      .split(/\r?\n/)
      .filter((line) => /^\|\s*\d+\s*\|/.test(line))
      .map((line) => line.split("|").map((cell) => cell.trim()))
      .map((cells) => ({
        id: Number(cells[1]),
        region: cells[2],
        name: cells[3],
        staples: cells[4],
        avgQty: cells[5],
        diet: cells[6],
        calories: number(cells[7]),
        protein: number(cells[8]),
        carbs: number(cells[9]),
        fat: number(cells[10]),
        fiber: number(cells[11]),
        sodium: number(cells[12]),
        notes: cells[13] || ""
      }))
      .filter((item) => item.name && item.calories);
  }

  function parseIngredientNutrition(markdown) {
    const inSection = markdown.split("## Ingredient Nutrition Reference Baseline")[1] || "";
    return inSection
      .split(/\r?\n/)
      .filter((line) => /^\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*\d/.test(line))
      .map((line) => line.split("|").map((cell) => cell.trim()))
      .map((cells) => ({
        name: cells[1],
        category: cells[2],
        commonState: cells[3],
        calories: number(cells[4]),
        protein: number(cells[5]),
        carbs: number(cells[6]),
        fat: number(cells[7]),
        fiber: number(cells[8]),
        sugar: number(cells[9]),
        sodium: number(cells[10]),
        dataConfidence: cells[11],
        notes: cells[12] || "",
        per100: true
      }))
      .filter((item) => item.name && item.calories);
  }

  function parsePortionSizeReference(markdown) {
    const section = markdown.split("## Portion Size Reference")[1] || "";
    const beforeNextSection = section.split(/\n##\s+/)[0] || "";
    return beforeNextSection
      .split(/\r?\n/)
      .filter((line) => /^\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*\d/.test(line))
      .map((line) => line.split("|").map((cell) => cell.trim()))
      .map((cells) => ({
        foodName: cells[1],
        unit: normalizeUnit(cells[2]),
        smallGrams: number(cells[3]),
        mediumGrams: number(cells[4]),
        largeGrams: number(cells[5]),
        defaultSize: cells[6] || "medium",
        nutritionBasis: cells[7] || "per_100g",
        notes: cells[8] || ""
      }))
      .filter((item) => item.foodName && item.mediumGrams);
  }

  function handlePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    state.fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      state.photoDataUrl = reader.result;
      state.currentMealId = null;
      els.mealPreview.src = state.photoDataUrl;
      els.workspace.hidden = false;
      els.analysisNote.textContent = "Photo ready. Run analysis, then review every item.";
      analyzeCurrentPhoto();
    };
    reader.readAsDataURL(file);
  }

  async function analyzeCurrentPhoto() {
    if (!state.photoDataUrl) {
      els.analysisNote.textContent = "Choose a meal photo first.";
      return;
    }
    els.analyzeButton.disabled = true;
    els.analyzeButton.textContent = "Analyzing...";
    els.analysisNote.textContent = "Checking the meal photo and identifying visible foods.";
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: state.photoDataUrl,
          location: els.userLocation.value,
          city: els.userCity.value
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Image analysis failed.");
      state.currentMealId = null;
      state.items = payload.items.map(createItemFromAiComponent);
      els.analysisNote.textContent = `${payload.summary} Review every estimate before saving.`;
      els.itemsFootnote.textContent = state.items.length
        ? "Few items may be missing in the list which you can add manually."
        : "No food items were detected. Few items may be missing in the list which you can add manually.";
    } catch (error) {
      state.items = [];
      els.analysisNote.textContent = `${error.message} No default food items were used. Please try again after analysis is available.`;
      els.itemsFootnote.textContent = "No food items were detected. Few items may be missing in the list which you can add manually.";
    } finally {
      els.analyzeButton.disabled = false;
      els.analyzeButton.textContent = "Analyze photo";
      renderAll();
    }
  }

  function runDemoVisionAnalysis({ fileName, location, references }) {
    const text = `${fileName} ${location}`.toLowerCase();
    const exactMatches = references.filter((ref) => {
      const nameParts = ref.name.toLowerCase().split(/\s+/).filter((part) => part.length > 3);
      return nameParts.some((part) => text.includes(part));
    });
    const regionalMatches = references.filter((ref) => ref.region.toLowerCase().includes(location.toLowerCase()));
    const selected = uniqueByName([...exactMatches, ...regionalMatches]).slice(0, exactMatches.length ? 2 : 1);

    if (!selected.length) {
      return {
        note: "Low confidence: no strong nutrition match. Confirm the placeholder before saving.",
        items: [createUnclearItem()]
      };
    }

    const items = selected.map((ref, index) => createItemFromReference(
      ref,
      exactMatches.length ? 0.82 - index * 0.08 : 0.58,
      exactMatches.length ? "Matched likely meal name." : "Matched likely regional meal pattern; confirm visible foods."
    ));

    if (!exactMatches.length) items.push(createUnclearItem());
    return {
      note: "Meal estimate is ready. Review quantity, unit, and low-confidence rows before saving.",
      items
    };
  }

  function uniqueByName(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function createItemFromReference(ref, confidence, note) {
    const source = ref || fallbackReferences()[0];
    return {
      id: crypto.randomUUID(),
      foodName: source.name,
      quantity: 1,
      unit: "serving",
      confidence,
      uncertaintyNote: note,
      needsUserReview: confidence < 0.7,
      sourceName: "Meal nutrition estimate",
      base: source
    };
  }

  function createManualAddedItem() {
    return applyPortionDefaults({
      id: crypto.randomUUID(),
      foodName: "",
      quantity: 1,
      unit: "serving",
      confidence: null,
      uncertaintyNote: "Type an item name. If it is not in foodtable.md, enter the nutrition values you know.",
      needsUserReview: true,
      sourceName: "Manual entry, waiting for foodtable match",
      manualEntry: true,
      base: createManualNutritionPlaceholder("")
    });
  }

  function createItemFromAiComponent(component) {
    const ingredient = findIngredientReference(component.foodName);
    const meal = findMealReference(component.foodName);
    const base = ingredient || meal || createManualNutritionPlaceholder(component.foodName);
    const confidence = clamp(number(component.confidence), 0.05, 0.95);
    return applyPortionDefaults({
      id: crypto.randomUUID(),
      foodName: component.foodName,
      quantity: number(component.quantity) || 1,
      unit: component.unit || "grams",
      confidence,
      uncertaintyNote: `${component.uncertaintyNote} ${component.evidence ? `Basis: ${component.evidence}` : ""}`.trim(),
      needsUserReview: confidence < 0.72 || !ingredient,
      sourceName: ingredient && ingredient._regional
        ? `Regional nutrition estimate (${ingredient.regionalRegion || "India"})`
        : ingredient ? "Ingredient nutrition estimate" : meal ? "Meal nutrition estimate" : "Needs nutrition lookup",
      manualEntry: false,
      base
    });
  }

  function createUnclearItem() {
    return applyPortionDefaults({
      id: crypto.randomUUID(),
      foodName: "Unclear food item",
      quantity: 1,
      unit: "serving",
      confidence: 0.34,
      uncertaintyNote: "Please identify this item manually.",
      needsUserReview: true,
      sourceName: "User review needed",
      manualEntry: false,
      base: {
        name: "Unclear food item",
        calories: 250,
        protein: 8,
        carbs: 30,
        fat: 10,
        fiber: 3,
        sodium: 400,
        notes: "Placeholder estimate until reviewed."
      }
    });
  }

  function renderAll() {
    renderItems();
    renderManualDraft();
    renderTotals();
  }

  function renderItems() {
    els.itemsBody.innerHTML = "";
    state.items.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="food-review-cell">
          <div class="suggest-wrap">
            <input value="${escapeAttr(item.foodName)}" aria-label="Food name" data-field="foodName" data-suggest-key="item:${item.id}" autocomplete="off" />
            ${suggestionsMarkup(`item:${item.id}`, item.foodName)}
          </div>
          <div class="item-meta">
            ${confidenceMarkup(item)}
            <span>${item.needsUserReview ? "Confirm manually" : "Review optional"}</span>
          </div>
          <p class="review-note">${escapeHtml(item.uncertaintyNote)}</p>
          <p class="review-note calculation-note">${escapeHtml(calculationBasisText(item))}</p>
        </td>
        <td>${amountMarkup(item, "data-field")}</td>
        <td>${portionSummaryMarkup(item, "item")}</td>
        <td><button class="danger" data-remove="${item.id}">Remove</button></td>
      `;
      row.querySelectorAll("[data-field]").forEach((input) => {
        input.addEventListener("input", (event) => updateItem(item.id, event.target.dataset.field, event.target.value));
        if (input.dataset.field === "foodName") {
          input.addEventListener("focus", () => updateSuggestionList(input, (value) => updateItem(item.id, "foodName", value)));
          input.addEventListener("input", () => updateSuggestionList(input, (value) => updateItem(item.id, "foodName", value)));
          input.addEventListener("keydown", (event) => handleSuggestionKeys(event, input.dataset.suggestKey, (value) => updateItem(item.id, "foodName", value)));
        }
        if (["quantity", "totalGrams", "diameterValue"].includes(input.dataset.field)) {
          input.addEventListener("change", renderAll);
          input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              renderAll();
            }
          });
        }
      });
      bindSuggestionClicks(row, (value) => updateItem(item.id, "foodName", value));
      row.querySelector("[data-portion-toggle]")?.addEventListener("click", () => togglePortionEditor(item.id));
      row.querySelector("[data-remove]").addEventListener("click", () => removeItem(item.id));
      els.itemsBody.appendChild(row);
      if (state.activePortionEditorId === item.id && itemHasPortionSizes(item)) {
        const editorRow = document.createElement("tr");
        editorRow.className = "portion-editor-row";
        editorRow.innerHTML = `<td colspan="4">${portionEditorMarkup(item, "data-field")}</td>`;
        bindPortionEditor(editorRow, item.id, updateItem);
        els.itemsBody.appendChild(editorRow);
      }
    });
  }

  function renderManualDraft() {
    if (!els.manualAddPanel || !els.manualDraftBody) return;
    if (!state.manualDraft) {
      els.manualAddPanel.hidden = true;
      els.manualDraftBody.innerHTML = "";
      return;
    }

    const item = state.manualDraft;
    els.manualAddPanel.hidden = false;
    els.manualDraftBody.innerHTML = `
      <tr>
        <td class="food-review-cell">
          <div class="suggest-wrap">
            <input value="${escapeAttr(item.foodName)}" aria-label="Manual food name" data-draft-field="foodName" data-suggest-key="manual:${item.id}" autocomplete="off" />
            ${suggestionsMarkup(`manual:${item.id}`, item.foodName)}
          </div>
          <div class="item-meta">
            ${confidenceMarkup(item)}
            <span>${item.needsUserReview ? "Confirm manually" : "Review optional"}</span>
          </div>
          <p class="review-note">${escapeHtml(item.uncertaintyNote)}</p>
          <p class="review-note calculation-note">${escapeHtml(calculationBasisText(item))}</p>
        </td>
        <td>${amountMarkup(item, "data-draft-field")}</td>
        <td>${portionSummaryMarkup(item, "draft")}</td>
      </tr>
      ${state.activePortionEditorId === item.id && itemHasPortionSizes(item) ? `
        <tr class="portion-editor-row">
          <td colspan="3">${portionEditorMarkup(item, "data-draft-field")}</td>
        </tr>
      ` : ""}
      ${itemNeedsManualNutrition(item) ? `
        <tr class="manual-nutrition-row">
          <td colspan="3">
            ${manualNutritionPanelMarkup(item)}
          </td>
        </tr>
      ` : ""}
    `;
    els.manualDraftBody.querySelectorAll("[data-draft-field]").forEach((input) => {
      if (input.dataset.draftField === "foodName") {
        input.addEventListener("input", (event) => {
          if (state.manualDraft) state.manualDraft.foodName = event.target.value;
          updateSuggestionList(input, (value) => updateManualDraft("foodName", value));
        });
        input.addEventListener("focus", () => updateSuggestionList(input, (value) => updateManualDraft("foodName", value)));
        input.addEventListener("keydown", (event) => handleSuggestionKeys(event, input.dataset.suggestKey, (value) => updateManualDraft("foodName", value)));
        input.addEventListener("change", (event) => updateManualDraft("foodName", event.target.value));
        return;
      }
      const eventName = input.dataset.draftField === "unit" ? "change" : "input";
      input.addEventListener(eventName, (event) => updateManualDraft(event.target.dataset.draftField, event.target.value));
      if (["quantity", "totalGrams", "diameterValue"].includes(input.dataset.draftField)) {
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            renderManualDraft();
          }
        });
      }
    });
    els.manualDraftBody.querySelector("[data-portion-toggle]")?.addEventListener("click", () => togglePortionEditor(item.id));
    bindSuggestionClicks(els.manualDraftBody, (value) => updateManualDraft("foodName", value));
    els.manualDraftBody.querySelectorAll(".portion-editor-row").forEach((row) => {
      bindPortionEditor(row, item.id, (_id, field, value) => updateManualDraft(field, value));
    });
    els.manualDraftBody.querySelectorAll("[data-nutrient]").forEach((input) => {
      input.addEventListener("input", (event) => updateManualNutrient(item.id, event.target.dataset.nutrient, event.target.value));
    });
  }

  function manualNutritionPanelMarkup(item) {
    return `
      <div class="manual-nutrition-panel">
        <p>${escapeHtml(manualNutritionMessage(item))}</p>
        <div class="manual-nutrition-grid">
          ${NUTRIENT_FIELDS.map(([key, label, unit]) => `
            <label>
              ${label}
              <span>
                <input type="number" min="0" step="0.1" value="${nutrientInputValue(item.base[key])}" placeholder="Unknown" data-nutrient="${key}" />
                <small>${unit}</small>
              </span>
            </label>
          `).join("")}
        </div>
      </div>
    `;
  }

  function confidenceMarkup(item) {
    if (item.confidence === null || item.confidence === undefined) {
      return "<span class=\"confidence manual\">Manual</span>";
    }
    const confidence = item.confidence;
    const percent = Math.round(confidence * 100);
    const level = confidence < 0.5 ? "low" : confidence < 0.7 ? "medium" : "";
    const basis = confidenceBasis(item);
    return `<span class="confidence"><i class="dot ${level}"></i>${percent}% <button class="info-button" type="button" title="${escapeAttr(basis)}" aria-label="${escapeAttr(basis)}">i</button></span>`;
  }

  function unitOptions() {
    return ["serving", "cup", "cups", "piece", "pieces", "slice", "slices", "grams", "bowl", "plate", "tbsp"];
  }

  function amountMarkup(item, fieldAttr) {
    return `
      <div class="amount-control">
        <input type="number" min="0" step="0.25" value="${item.quantity}" aria-label="Quantity" ${fieldAttr}="quantity" />
        <select ${fieldAttr}="unit" aria-label="Unit">
          ${unitOptions().map((unit) => `<option ${unit === item.unit ? "selected" : ""}>${unit}</option>`).join("")}
        </select>
      </div>
    `;
  }

  function portionSummaryMarkup(item, mode) {
    refreshPortionTotals(item);
    const calories = itemCalories(item);
    if (!itemUsesGramCalculation(item)) {
      const grams = displayGramsForItem(item);
      return grams.value
        ? `<span class="gram-estimate ${grams.estimated ? "estimated" : ""}">${grams.estimated ? "~" : ""}${round1(grams.value)}g <small>${Math.round(calories)} kcal</small></span>`
        : `<span class="gram-estimate"><small>${Math.round(calories)} kcal</small></span>`;
    }
    if (!itemHasPortionSizes(item)) return `<span class="gram-estimate">${round1(item.totalGrams || 0)}g <small>${Math.round(calories)} kcal</small></span>`;
    const label = item.portionSize ? capitalize(item.portionSize) : "Estimate";
    const grams = `${round1(item.totalGrams || 0)}g`;
    const kcal = `${Math.round(calories)} kcal`;
    const detail = item.portionSize === "custom" && item.portionEstimateMode === "dimensions"
      ? `Size · ${grams} · ${kcal}`
      : `${label} · ${grams} · ${kcal}`;
    return `<button class="portion-pill" type="button" data-portion-toggle="${escapeAttr(mode)}">${escapeHtml(detail)}</button>`;
  }

  function calculationBasisText(item) {
    if (!item || !item.base) return "";
    const quantity = Math.max(0, number(item.quantity));
    const unit = normalizeUnit(item.unit);
    if (item.base.editableNutrition || item.unsupportedUnit) {
      return "Calculation: using manual nutrition values for the quantity shown.";
    }
    if (!item.base.per100) {
      const factor = itemFactor(item);
      return `Calculation: ${round1(quantity)} ${unit || item.unit || "serving"} x ${round1(factor / Math.max(quantity, 1))} meal serving factor.`;
    }

    refreshPortionTotals(item);
    const totalGrams = gramsForCalculation(item);
    const perGramCalories = perGramNutrientValue(item.base, "calories");
    const perGramProtein = perGramNutrientValue(item.base, "protein");
    const perGramText = `${round2(perGramCalories)} kcal/g${perGramProtein ? `, ${round2(perGramProtein)}g protein/g` : ""}`;

    if (["gram", "grams", "g"].includes(unit)) {
      return `Calculation: ${round1(totalGrams)}g entered directly; ${item.base.name || item.foodName} ${perGramText}.`;
    }
    if (["piece", "pieces", "slice", "slices"].includes(unit)) {
      const gramsPerUnit = quantity > 0 ? totalGrams / quantity : item.gramsPerUnit || estimatePieceGrams(item.foodName);
      return `Calculation: ${round1(quantity)} ${unit} x ${round1(gramsPerUnit)}g each = ${round1(totalGrams)}g; ${item.base.name || item.foodName} ${perGramText}.`;
    }
    return `Calculation: ${round1(totalGrams)}g estimated from ${round1(quantity)} ${unit || item.unit}; ${item.base.name || item.foodName} ${perGramText}.`;
  }

  function perGramNutrientValue(base, key) {
    if (!base) return 0;
    if (base.nutritionPerGram && base.nutritionPerGram[key] !== null && base.nutritionPerGram[key] !== undefined) {
      return number(base.nutritionPerGram[key]);
    }
    return nutrientValue(base, key) / 100;
  }

  function portionEditorMarkup(item, fieldAttr) {
    refreshPortionTotals(item);
    if (!itemUsesGramCalculation(item)) return "";
    const supportsSizes = itemHasPortionSizes(item);
    const customMode = item.portionEstimateMode || "grams";
    return `
      <div class="portion-editor">
        <div class="portion-editor-head">
          <strong>Portion estimate</strong>
          <span>${round1(item.totalGrams || 0)}g used for nutrition calculation</span>
        </div>
        ${supportsSizes ? `
          <div class="portion-size-buttons">
            ${["small", "medium", "large", "custom"].map((size) => `
              <button type="button" class="${item.portionSize === size ? "active" : ""}" data-portion-choice="${size}">${capitalize(size)}</button>
            `).join("")}
          </div>
          <p class="portion-reference">${portionReferenceText(item)}</p>
        ` : ""}
        ${item.portionSize === "custom" ? `
          <div class="custom-mode">
            <label>
              Custom by
              <select ${fieldAttr}="portionEstimateMode" aria-label="Custom portion mode">
                <option value="grams" ${customMode === "grams" ? "selected" : ""}>Estimated grams</option>
                ${supportsDimensionEstimate(item) ? `<option value="dimensions" ${customMode === "dimensions" ? "selected" : ""}>Size</option>` : ""}
              </select>
            </label>
          </div>
          ${customMode === "dimensions" && supportsDimensionEstimate(item) ? dimensionInputsMarkup(item, fieldAttr) : customGramInputMarkup(item, fieldAttr)}
        ` : ""}
      </div>
    `;
  }

  function customGramInputMarkup(item, fieldAttr) {
    return `
      <div class="portion-custom-grid">
        <label>
          Total grams
          <input type="number" min="0" step="1" value="${round1(item.totalGrams || 0)}" aria-label="Total grams" ${fieldAttr}="totalGrams" />
        </label>
      </div>
    `;
  }

  function dimensionInputsMarkup(item, fieldAttr) {
    return `
      <div class="portion-custom-grid">
        <label>
          Diameter
          <input type="number" min="0" step="0.25" value="${item.diameterValue || ""}" aria-label="Diameter" ${fieldAttr}="diameterValue" />
        </label>
        <label>
          Unit
          <select ${fieldAttr}="diameterUnit" aria-label="Diameter unit">
            ${["in", "cm"].map((unit) => `<option value="${unit}" ${unit === (item.diameterUnit || "in") ? "selected" : ""}>${unit}</option>`).join("")}
          </select>
        </label>
        <label>
          Thickness
          <select ${fieldAttr}="thickness" aria-label="Thickness">
            ${["thin", "medium", "thick"].map((value) => `<option value="${value}" ${value === (item.thickness || "medium") ? "selected" : ""}>${capitalize(value)}</option>`).join("")}
          </select>
        </label>
      </div>
    `;
  }

  function portionReferenceText(item) {
    const reference = findPortionReference(item.foodName);
    if (!reference) return "";
    if (supportsDimensionEstimate(item)) {
      return [
        `Small ${defaultDiameterFor(reference, "small")} in / ${round1(reference.smallGrams)}g`,
        `Medium ${defaultDiameterFor(reference, "medium")} in / ${round1(reference.mediumGrams)}g`,
        `Large ${defaultDiameterFor(reference, "large")} in / ${round1(reference.largeGrams)}g`
      ].join(" · ");
    }
    return [
      `Small ${round1(reference.smallGrams)}g`,
      `Medium ${round1(reference.mediumGrams)}g`,
      `Large ${round1(reference.largeGrams)}g`
    ].join(" · ");
  }

  function bindPortionEditor(row, itemId, updater) {
    row.querySelectorAll("[data-portion-choice]").forEach((button) => {
      button.addEventListener("click", () => updater(itemId, "portionSize", button.dataset.portionChoice));
    });
    row.querySelectorAll("[data-field], [data-draft-field]").forEach((input) => {
      const attr = input.dataset.field ? "field" : "draftField";
      const eventName = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(eventName, (event) => updater(itemId, event.target.dataset[attr], event.target.value));
    });
  }

  function suggestionsMarkup(key, query) {
    if (state.activeSuggestKey !== key) return "";
    const matches = foodSuggestions(query).slice(0, 25);
    if (!matches.length) return "";
    return `
      <div class="suggest-list" role="listbox">
        ${matches.map((suggestion, index) => `
          <button type="button" role="option" data-suggest-value="${escapeAttr(suggestion.name)}" data-suggest-index="${index}">
            <span>${escapeHtml(suggestion.name)}</span>
            <small>${escapeHtml(suggestion.type)}</small>
          </button>
        `).join("")}
      </div>
    `;
  }

  function showSuggestions(key) {
    state.activeSuggestKey = key;
    renderAll();
  }

  function hideSuggestions() {
    state.activeSuggestKey = null;
  }

  function updateSuggestionList(input, onSelect) {
    state.activeSuggestKey = input.dataset.suggestKey;
    const wrap = input.closest(".suggest-wrap");
    if (!wrap) return;
    const existing = wrap.querySelector(".suggest-list");
    if (existing) existing.remove();
    const matches = foodSuggestions(input.value).slice(0, 25);
    if (!matches.length) return;
    const list = document.createElement("div");
    list.className = "suggest-list";
    list.setAttribute("role", "listbox");
    list.innerHTML = matches.map((suggestion, index) => `
      <button type="button" role="option" data-suggest-value="${escapeAttr(suggestion.name)}" data-suggest-index="${index}">
        <span>${escapeHtml(suggestion.name)}</span>
        <small>${escapeHtml(suggestion.type)}</small>
      </button>
    `).join("");
    wrap.appendChild(list);
    bindSuggestionClicks(wrap, onSelect);
  }

  function bindSuggestionClicks(container, onSelect) {
    container.querySelectorAll("[data-suggest-value]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        onSelect(button.dataset.suggestValue);
        hideSuggestions();
        renderAll();
      });
    });
  }

  function handleSuggestionKeys(event, key, onSelect) {
    if (event.key !== "Enter") return;
    const input = event.target;
    const firstMatch = foodSuggestions(input.value)[0];
    if (!firstMatch) return;
    event.preventDefault();
    onSelect(firstMatch.name);
    hideSuggestions();
    renderAll();
  }

  function togglePortionEditor(id) {
    const item = state.items.find((entry) => entry.id === id) || state.manualDraft;
    if (!item || !itemHasPortionSizes(item)) return;
    state.activePortionEditorId = state.activePortionEditorId === id ? null : id;
    renderAll();
  }

  function displayGramsForItem(item) {
    if (!item) return { value: 0, estimated: false };
    const unit = normalizeUnit(item.unit);
    if (!unit) return { value: 0, estimated: false };
    if (DISPLAY_GRAMS_BY_UNIT[unit]) {
      return { value: Math.max(0, number(item.quantity)) * DISPLAY_GRAMS_BY_UNIT[unit], estimated: true };
    }
    return { value: unitToGrams(item.unit, item.quantity, item.foodName), estimated: false };
  }

  function itemCalories(item) {
    return calculateTotals([{ ...item }]).calories;
  }

  function updateItem(id, field, value) {
    const item = state.items.find((entry) => entry.id === id);
    if (!item) return;
    if (field === "quantity") item.quantity = Math.max(0, number(value));
    if (field === "unit") {
      item.unit = value;
      refreshUnitSupport(item);
    }
    if (field === "portionSize") {
      item.portionSize = value;
      if (value === "custom") {
        item.portionEstimateMode = item.portionEstimateMode || "grams";
      } else {
        item.portionEstimateMode = "";
      }
      item.needsUserReview = item.needsUserReview || value === "custom";
    }
    if (field === "portionEstimateMode") {
      item.portionEstimateMode = value;
      item.needsUserReview = true;
      if (value === "dimensions") seedDimensionDefaults(item);
    }
    if (field === "totalGrams") {
      item.totalGrams = Math.max(0, number(value));
      item.portionSize = "custom";
      item.portionEstimateMode = "grams";
      item.gramsPerUnit = item.quantity > 0 ? item.totalGrams / item.quantity : item.totalGrams;
    }
    if (["diameterValue", "diameterUnit", "thickness"].includes(field)) {
      if (field === "diameterValue") item.diameterValue = Math.max(0, number(value));
      if (field === "diameterUnit") item.diameterUnit = value;
      if (field === "thickness") item.thickness = value;
      item.portionSize = "custom";
      item.portionEstimateMode = "dimensions";
      item.needsUserReview = true;
    }
    if (field === "foodName") {
      applyFoodNameChange(item, value, findReference);
    }
    refreshPortionTotals(item);
    if (["unit", "foodName", "portionSize", "portionEstimateMode", "diameterUnit", "thickness"].includes(field)) {
      renderAll();
    } else {
      renderTotals();
    }
  }

  function updateManualNutrient(id, key, value) {
    const item = state.manualDraft && state.manualDraft.id === id
      ? state.manualDraft
      : state.items.find((entry) => entry.id === id);
    if (!item || !item.base) return;
    item.base[key] = value === "" ? null : Math.max(0, number(value));
    renderTotals();
  }

  function updateManualDraft(field, value) {
    const item = state.manualDraft;
    if (!item) return;
    if (field === "quantity") item.quantity = Math.max(0, number(value));
    if (field === "unit") {
      item.unit = value;
      refreshUnitSupport(item);
    }
    if (field === "portionSize") {
      item.portionSize = value;
      if (value === "custom") {
        item.portionEstimateMode = item.portionEstimateMode || "grams";
      } else {
        item.portionEstimateMode = "";
      }
      item.needsUserReview = item.needsUserReview || value === "custom";
    }
    if (field === "portionEstimateMode") {
      item.portionEstimateMode = value;
      item.needsUserReview = true;
      if (value === "dimensions") seedDimensionDefaults(item);
    }
    if (field === "totalGrams") {
      item.totalGrams = Math.max(0, number(value));
      item.portionSize = "custom";
      item.portionEstimateMode = "grams";
      item.gramsPerUnit = item.quantity > 0 ? item.totalGrams / item.quantity : item.totalGrams;
    }
    if (["diameterValue", "diameterUnit", "thickness"].includes(field)) {
      if (field === "diameterValue") item.diameterValue = Math.max(0, number(value));
      if (field === "diameterUnit") item.diameterUnit = value;
      if (field === "thickness") item.thickness = value;
      item.portionSize = "custom";
      item.portionEstimateMode = "dimensions";
      item.needsUserReview = true;
    }
    if (field === "foodName") {
      applyFoodNameChange(item, value, findReference);
    }
    refreshPortionTotals(item);
    renderManualDraft();
  }

  function confirmManualDraft() {
    if (!state.manualDraft) return;
    if (!state.manualDraft.foodName.trim()) {
      els.itemsFootnote.textContent = "Enter a food name before adding the manual item.";
      return;
    }
    state.items.push({ ...state.manualDraft, id: crypto.randomUUID() });
    state.manualDraft = null;
    els.itemsFootnote.textContent = "Manual item added to the list. Few items may still be missing and can be added manually.";
    renderAll();
  }

  function cancelManualDraft() {
    state.manualDraft = null;
    els.itemsFootnote.textContent = "Few items may be missing in the list which you can add manually.";
    renderManualDraft();
  }

  function removeItem(id) {
    state.items = state.items.filter((item) => item.id !== id);
    renderAll();
  }

  function renderTotals() {
    const totals = calculateTotals(currentCalculationItems());
    els.totalCalories.textContent = Math.round(totals.calories);
    els.totalProtein.textContent = `${round1(totals.protein)}g`;
    els.totalCarbs.textContent = `${round1(totals.carbs)}g`;
    els.totalFat.textContent = `${round1(totals.fat)}g`;
    setBar(els.proteinBar, totals.protein, GOALS.protein);
    setBar(els.carbBar, totals.carbs, GOALS.carbs);
    setBar(els.fatBar, totals.fat, GOALS.fat);

    renderNutrients(els.generalNutrients, [
      ["Energy", totals.calories, "kcal", GOALS.calories],
      ["Protein", totals.protein, "g", GOALS.protein],
      ["Fiber", totals.fiber, "g", GOALS.fiber],
      ["Sodium", totals.sodium, "mg", GOALS.sodium]
    ]);
    renderNutrients(els.carbNutrients, [
      ["Carbs", totals.carbs, "g", GOALS.carbs],
      ["Fiber", totals.fiber, "g", GOALS.fiber],
      ["Sugar", totals.sugar, "g", GOALS.sugar],
      ["Added sugar", totals.addedSugar, "g", null]
    ]);
    renderNutrients(els.lipidNutrients, [
      ["Fat", totals.fat, "g", GOALS.fat],
      ["Saturated fat", totals.saturatedFat, "g", GOALS.saturatedFat],
      ["Trans fat", totals.transFat, "g", null],
      ["Cholesterol", totals.cholesterol, "mg", GOALS.cholesterol]
    ]);
    renderNutrients(els.microNutrients, [
      ["Potassium", totals.potassium, "mg", GOALS.potassium],
      ["Calcium", totals.calcium, "mg", GOALS.calcium],
      ["Iron", totals.iron, "mg", GOALS.iron],
      ["Vitamin C", totals.vitaminC, "mg", GOALS.vitaminC]
    ]);
  }

  function renderNutrients(container, rows) {
    container.innerHTML = rows.map(([label, value, unit, goal]) => {
      const percent = goal ? Math.round((value / goal) * 100) : null;
      const targetClass = percent === null ? "" : percent > 140 ? "high" : percent < 60 ? "warn" : "";
      return `
        <div class="nutrient-row">
          <span>${label}</span>
          <strong>${round1(value)} ${unit}</strong>
          <span class="target ${targetClass}">${percent === null ? "No target" : `${percent}%`}</span>
        </div>
      `;
    }).join("");
  }

  function setBar(element, value, goal) {
    element.style.width = `${Math.min(100, Math.round((value / goal) * 100))}%`;
  }

  function calculateTotals(items) {
    return items.reduce((totals, item) => {
      const factor = itemFactor(item);
      totals.calories += nutrientTotal(item, "calories", factor);
      totals.protein += nutrientTotal(item, "protein", factor);
      totals.carbs += nutrientTotal(item, "carbs", factor);
      totals.fat += nutrientTotal(item, "fat", factor);
      totals.fiber += nutrientTotal(item, "fiber", factor);
      totals.sodium += nutrientTotal(item, "sodium", factor);
      totals.sugar += nutrientTotal(item, "sugar", factor, estimateSugar(item.base));
      totals.addedSugar += estimateAddedSugar(item.base) * factor;
      totals.saturatedFat += nutrientTotal(item, "saturatedFat", factor, nutrientValue(item.base, "fat") * 0.32);
      totals.transFat += nutrientValue(item.base, "fat") > 35 ? 0.2 * factor : 0;
      totals.cholesterol += nutrientTotal(item, "cholesterol", factor, estimateCholesterol(item.base));
      totals.potassium += nutrientTotal(item, "potassium", factor, nutrientValue(item.base, "fiber") * 95 + nutrientValue(item.base, "protein") * 12);
      totals.calcium += nutrientTotal(item, "calcium", factor, estimateCalcium(item.base));
      totals.iron += nutrientTotal(item, "iron", factor, nutrientValue(item.base, "protein") * 0.12 + nutrientValue(item.base, "fiber") * 0.08);
      totals.vitaminC += nutrientTotal(item, "vitaminC", factor, estimateVitaminC(item.base));
      return totals;
    }, emptyTotals());
  }

  function currentCalculationItems() {
    return state.items.map((item) => {
      refreshPortionTotals(item);
      return { ...item };
    });
  }

  function emptyTotals() {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
      sugar: 0,
      addedSugar: 0,
      saturatedFat: 0,
      transFat: 0,
      cholesterol: 0,
      potassium: 0,
      calcium: 0,
      iron: 0,
      vitaminC: 0
    };
  }

  function nutrientTotal(item, key, factor, fallback) {
    if (!item || !item.base) return 0;
    if (item.base.per100 && item.base.nutritionPerGram && item.base.nutritionPerGram[key] !== null && item.base.nutritionPerGram[key] !== undefined) {
      return gramsForCalculation(item) * number(item.base.nutritionPerGram[key]);
    }
    const value = fallback === undefined ? nutrientValue(item.base, key) : fallback;
    return value * factor;
  }

  function itemFactor(item) {
    if (!item.base) return 0;
    if (item.base.editableNutrition || item.unsupportedUnit) {
      return 1;
    }
    if (item.base && item.base.per100) {
      return gramsForCalculation(item) * perGramFactor(item.base);
    }
    const unitFactor = UNIT_FACTORS[item.unit] || 1;
    return Math.max(0, number(item.quantity)) * unitFactor;
  }

  function perGramFactor(base) {
    return base && base.per100 ? 0.01 : 1;
  }

  function unitToGrams(unit, quantity, foodName) {
    const qty = Math.max(0, number(quantity));
    const normalized = String(unit || "").toLowerCase();
    if (["gram", "grams", "g"].includes(normalized)) return qty;
    if (normalized === "tbsp") return qty * 15;
    if (["cup", "cups"].includes(normalized)) return qty * 150;
    if (["piece", "pieces", "slice", "slices"].includes(normalized)) return qty * estimatePieceGrams(foodName);
    return qty * 100;
  }

  function gramsForCalculation(item) {
    if (!item || !item.base || !item.base.per100) return 0;
    if (item.portionSize === "custom" && item.portionEstimateMode === "grams" && item.totalGrams) {
      return item.totalGrams;
    }
    refreshPortionTotals(item);
    return item.totalGrams || unitToGrams(item.unit, item.quantity, item.foodName);
  }

  function estimatePieceGrams(foodName) {
    const name = String(foodName || "").toLowerCase();
    const estimate = PIECE_GRAM_ESTIMATES.find((item) => item.pattern.test(name));
    if (estimate) return estimate.grams;
    return 100;
  }

  function applyPortionDefaults(item, options = {}) {
    const reference = findPortionReference(item.foodName);
    if (!item.base || !item.base.per100) {
      clearPortionData(item);
      return item;
    }

    item.nutritionBasis = "per_100g";
    if (reference && PORTION_UNITS.has(normalizeUnit(item.unit))) {
      item.portionReference = reference;
      if (!options.keepExisting || !item.portionSize) item.portionSize = reference.defaultSize || "medium";
      if (item.portionSize !== "custom") {
        item.gramsPerUnit = gramsForPortionSize(reference, item.portionSize);
      }
      if (item.portionSize === "custom" && item.portionEstimateMode === "dimensions") seedDimensionDefaults(item);
      refreshPortionTotals(item);
      return item;
    }

    item.portionReference = null;
    item.portionSize = "";
    item.gramsPerUnit = null;
    item.totalGrams = unitToGrams(item.unit, item.quantity, item.foodName);
    return item;
  }

  function refreshPortionTotals(item) {
    if (!item || !item.base || !item.base.per100) return;
    const reference = findPortionReference(item.foodName);
    item.nutritionBasis = "per_100g";
    if (reference && PORTION_UNITS.has(normalizeUnit(item.unit))) {
      item.portionReference = reference;
      if (!item.portionSize) item.portionSize = reference.defaultSize || "medium";
      if (item.portionSize !== "custom") {
        item.gramsPerUnit = gramsForPortionSize(reference, item.portionSize);
        item.totalGrams = Math.max(0, number(item.quantity)) * item.gramsPerUnit;
      } else if (item.portionEstimateMode === "dimensions" && supportsDimensionEstimate(item)) {
        seedDimensionDefaults(item);
        item.gramsPerUnit = gramsFromDimensions(item, reference);
        item.totalGrams = Math.max(0, number(item.quantity)) * item.gramsPerUnit;
      } else if (!item.totalGrams) {
        item.portionEstimateMode = "grams";
        item.gramsPerUnit = gramsForPortionSize(reference, reference.defaultSize || "medium");
        item.totalGrams = Math.max(0, number(item.quantity)) * item.gramsPerUnit;
      }
      return;
    }

    item.portionReference = null;
    item.portionSize = "";
    if (item.gramsPerUnit && PORTION_UNITS.has(normalizeUnit(item.unit))) {
      item.totalGrams = Math.max(0, number(item.quantity)) * item.gramsPerUnit;
      return;
    }
    item.gramsPerUnit = null;
    item.totalGrams = unitToGrams(item.unit, item.quantity, item.foodName);
  }

  function clearPortionData(item) {
    item.portionReference = null;
    item.portionSize = "";
    item.gramsPerUnit = null;
    item.totalGrams = null;
    item.nutritionBasis = "";
    item.portionEstimateMode = "";
    item.diameterValue = null;
    item.diameterUnit = "";
    item.thickness = "";
  }

  function itemUsesGramCalculation(item) {
    return Boolean(item && item.base && item.base.per100);
  }

  function itemHasPortionSizes(item) {
    return Boolean(itemUsesGramCalculation(item) && findPortionReference(item.foodName) && PORTION_UNITS.has(normalizeUnit(item.unit)));
  }

  function supportsDimensionEstimate(item) {
    return Boolean(itemHasPortionSizes(item) && /roti|chapati|paratha|naan|pizza|dosa|tortilla/i.test(item.foodName));
  }

  function findPortionReference(foodName) {
    const normalized = normalizeFoodName(foodName);
    if (!normalized) return null;
    return state.portionReferences.find((ref) => normalizeFoodName(ref.foodName) === normalized)
      || state.portionReferences.find((ref) => normalized.includes(normalizeFoodName(ref.foodName)) || normalizeFoodName(ref.foodName).includes(normalized));
  }

  function gramsForPortionSize(reference, size) {
    if (size === "small") return reference.smallGrams;
    if (size === "large") return reference.largeGrams;
    return reference.mediumGrams;
  }

  function seedDimensionDefaults(item) {
    const reference = findPortionReference(item.foodName);
    if (!reference) return;
    item.diameterUnit = item.diameterUnit || "in";
    item.thickness = item.thickness || "medium";
    if (!item.diameterValue) item.diameterValue = defaultDiameterFor(reference, reference.defaultSize || "medium");
  }

  function gramsFromDimensions(item, reference) {
    const defaultDiameter = defaultDiameterFor(reference, reference.defaultSize || "medium");
    const inputDiameter = diameterToInches(item.diameterValue || defaultDiameter, item.diameterUnit || "in");
    const mediumGrams = reference.mediumGrams || gramsForPortionSize(reference, reference.defaultSize || "medium");
    const thicknessFactor = { thin: 0.8, medium: 1, thick: 1.25 }[item.thickness || "medium"] || 1;
    return Math.max(0, mediumGrams * Math.pow(inputDiameter / defaultDiameter, 2) * thicknessFactor);
  }

  function defaultDiameterFor(reference, size) {
    const name = normalizeFoodName(reference.foodName);
    if (name.includes("pizza")) {
      if (size === "small") return 4;
      if (size === "large") return 7;
      return 5.5;
    }
    if (name.includes("dosa")) {
      if (size === "small") return 7;
      if (size === "large") return 12;
      return 9;
    }
    if (size === "small") return 5;
    if (size === "large") return 7.5;
    return 6;
  }

  function diameterToInches(value, unit) {
    const diameter = Math.max(0, number(value));
    return unit === "cm" ? diameter / 2.54 : diameter;
  }

  function normalizeFoodName(value) {
    return String(value || "").toLowerCase().replace(/\bslices?\b/g, "").replace(/\s+/g, " ").trim();
  }

  function capitalize(value) {
    const text = String(value || "");
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  }

  function nutrientValue(base, key) {
    if (!base || base[key] === null || base[key] === undefined || base[key] === "") return 0;
    return number(base[key]);
  }

  function nutrientOrEstimate(base, key, estimate) {
    if (!base || base[key] === null || base[key] === undefined || base[key] === "") return estimate;
    return number(base[key]);
  }

  function estimateSugar(base) {
    if (!base) return 0;
    if (base.sugar !== undefined && base.sugar !== null && base.sugar !== "") return number(base.sugar);
    const text = `${base.name} ${base.staples || ""} ${base.notes || ""}`.toLowerCase();
    if (/fruit|syrup|sweet|pancake|bbq|chutney/.test(text)) return Math.min(42, nutrientValue(base, "carbs") * 0.25);
    return Math.min(18, nutrientValue(base, "carbs") * 0.1);
  }

  function estimateAddedSugar(base) {
    if (!base) return 0;
    return /syrup|bbq|sweet|sauce|chutney/i.test(`${base.name} ${base.notes || ""}`) ? 8 : 0;
  }

  function estimateCholesterol(base) {
    if (!base) return 0;
    return /chicken|beef|egg|fish|pork|mutton|lamb|meat|turkey/i.test(`${base.name} ${base.staples || ""}`) ? 75 : 8;
  }

  function estimateCalcium(base) {
    if (!base) return 0;
    return /paneer|cheese|yogurt|curd|milk|halloumi/i.test(`${base.name} ${base.staples || ""}`) ? 280 : 80;
  }

  function estimateVitaminC(base) {
    if (!base) return 0;
    return /salad|vegetable|tomato|pepper|fruit|salsa|lemon|greens/i.test(`${base.name} ${base.staples || ""} ${base.notes || ""}`) ? 45 : 12;
  }

  async function saveReviewedMeal() {
    if (!state.items.length) {
      els.saveMessage.textContent = "Add or analyze at least one item.";
      return;
    }
    const needsReview = state.items.some((item) => item.needsUserReview && item.foodName.toLowerCase().includes("unclear"));
    if (needsReview) {
      els.saveMessage.textContent = "Update unclear items before saving.";
      return;
    }
    const meal = buildReviewedMealPayload();
    els.saveMealButton.disabled = true;
    els.saveMessage.textContent = "Saving reviewed meal...";
    try {
      const url = state.currentMealId ? `/api/meals/${encodeURIComponent(state.currentMealId)}` : "/api/meals";
      const response = await fetchWithAccess(url, {
        method: state.currentMealId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meal)
      });
      const savedMeal = await response.json();
      if (!response.ok) throw new Error(savedMeal.error || "Meal save failed.");
      state.currentMealId = savedMeal.id;
      state.history = upsertHistoryMeal(savedMeal, state.history).slice(0, 25);
      localStorage.setItem("nutritracker.history", JSON.stringify(state.history));
      els.saveMessage.textContent = "Saved reviewed meal.";
      renderHistory();
    } catch (error) {
      const fallbackMeal = {
        ...meal,
        id: state.currentMealId || crypto.randomUUID(),
        photo: meal.photoConsent ? meal.photo : "",
        savedAt: new Date().toISOString()
      };
      state.currentMealId = fallbackMeal.id;
      state.history = upsertHistoryMeal(fallbackMeal, state.history).slice(0, 25);
      localStorage.setItem("nutritracker.history", JSON.stringify(state.history));
      els.saveMessage.textContent = `${error.message} Saved locally until the backend is available.`;
      renderHistory();
    } finally {
      els.saveMealButton.disabled = false;
    }
  }

  function buildReviewedMealPayload() {
    const calculationItems = currentCalculationItems();
    const totals = calculateTotals(calculationItems);
    return {
      mealType: els.mealType.value,
      eatenAt: els.mealTime.value,
      location: els.userLocation.value,
      city: els.userCity.value,
      photoConsent: els.saveConsent.checked,
      photo: els.saveConsent.checked ? state.photoDataUrl : "",
      items: calculationItems.map((item) => ({
        foodName: item.foodName,
        quantity: item.quantity,
        unit: item.unit,
        confidence: item.confidence,
        needsUserReview: item.needsUserReview,
        uncertaintyNote: item.uncertaintyNote,
        sourceName: item.sourceName,
        manualEntry: item.manualEntry || false,
        base: itemNeedsManualNutrition(item) ? item.base : null,
        unsupportedUnit: item.unsupportedUnit || false,
        portionSize: item.portionSize || "",
        gramsPerUnit: item.gramsPerUnit || null,
        totalGrams: item.totalGrams || null,
        nutritionBasis: item.nutritionBasis || "",
        portionEstimateMode: item.portionEstimateMode || "",
        diameterValue: item.diameterValue || null,
        diameterUnit: item.diameterUnit || "",
        thickness: item.thickness || "",
        nutrition: calculateTotals([item])
      })),
      totals,
    };
  }

  function renderHistory() {
    if (!state.history.length) {
      els.historyList.innerHTML = "<p class=\"warning\">No reviewed meals saved yet.</p>";
      return;
    }
    els.historyList.innerHTML = state.history.map((meal) => `
      <article class="history-item">
        ${meal.photo ? `<img src="${meal.photo}" alt="">` : "<div></div>"}
        <div>
          <strong>${escapeHtml(meal.mealType)} - ${Math.round(meal.totals.calories)} kcal estimate</strong>
          <span>${formatDate(meal.eatenAt)} - ${meal.items.length} items - ${round1(meal.totals.protein)}g protein</span>
        </div>
        <button class="secondary" data-load="${meal.id}">Reopen</button>
      </article>
    `).join("");
    els.historyList.querySelectorAll("[data-load]").forEach((button) => {
      button.addEventListener("click", () => reopenMeal(button.dataset.load));
    });
  }

  async function reopenMeal(id) {
    let meal = state.history.find((entry) => entry.id === id);
    try {
      const response = await fetchWithAccess(`/api/meals/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (response.ok) meal = await response.json();
    } catch {
      // Local fallback below keeps the app usable while the backend is down.
    }
    if (!meal) return;
    state.currentMealId = meal.id;
    state.items = meal.items.map((saved) => {
      const ref = findReference(saved.foodName) || fallbackReferences()[0];
      const base = saved.base || ref;
      const item = {
        id: crypto.randomUUID(),
        foodName: saved.foodName,
        quantity: saved.quantity,
        unit: saved.unit,
        confidence: saved.confidence,
        uncertaintyNote: "Loaded from reviewed history.",
        needsUserReview: Boolean(saved.unsupportedUnit || (base && base.editableNutrition)),
        sourceName: saved.sourceName,
        manualEntry: saved.manualEntry || false,
        unsupportedUnit: saved.unsupportedUnit || false,
        portionSize: saved.portionSize || "",
        gramsPerUnit: saved.gramsPerUnit || null,
        totalGrams: saved.totalGrams || null,
        nutritionBasis: saved.nutritionBasis || "",
        portionEstimateMode: saved.portionEstimateMode || "",
        diameterValue: saved.diameterValue || null,
        diameterUnit: saved.diameterUnit || "",
        thickness: saved.thickness || "",
        base
      };
      return applyPortionDefaults(item, { keepExisting: true });
    });
    els.mealType.value = meal.mealType;
    els.mealTime.value = meal.eatenAt;
    els.userLocation.value = meal.location;
    els.userCity.value = meal.city || "";
    renderCitySuggestions();
    if (meal.photo) {
      state.photoDataUrl = meal.photo;
      els.mealPreview.src = meal.photo;
    } else {
      state.photoDataUrl = "";
      state.fileName = "";
      els.mealPreview.removeAttribute("src");
    }
    els.workspace.hidden = false;
    els.analysisNote.textContent = "Saved meal reopened. Edit and save again if needed.";
    renderAll();
  }

  async function clearHistory() {
    const meals = [...state.history];
    state.history = [];
    localStorage.removeItem("nutritracker.history");
    renderHistory();
    await Promise.all(meals.map((meal) => fetchWithAccess(`/api/meals/${encodeURIComponent(meal.id)}`, {
      method: "DELETE"
    }).catch(() => null)));
    state.currentMealId = null;
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem("nutritracker.history") || "[]");
    } catch {
      return [];
    }
  }

  async function loadMealHistory() {
    try {
      const response = await fetchWithAccess("/api/meals", { cache: "no-store" });
      if (!response.ok) throw new Error("Backend history unavailable.");
      state.history = await response.json();
      localStorage.setItem("nutritracker.history", JSON.stringify(state.history));
    } catch {
      state.history = readHistory();
    }
    renderHistory();
  }

  function upsertHistoryMeal(meal, meals) {
    return [meal, ...meals.filter((entry) => entry.id !== meal.id)];
  }

  function findReference(name) {
    return findIngredientReference(name) || findMealReference(name);
  }

  function applyFoodNameChange(item, value, lookup) {
    item.foodName = value;
    const match = lookup(value);
    if (match) {
      item.base = match;
      item.referenceBase = match;
      item.manualEntry = item.manualEntry || false;
      item.sourceName = match._regional
        ? `Regional nutrition estimate (${match.regionalRegion || "India"})`
        : match.per100 ? "Ingredient nutrition estimate" : "Meal nutrition estimate";
      item.confidence = confidenceFromReference(match, value);
      refreshUnitSupport(item);
      applyPortionDefaults(item);
      item.needsUserReview = item.unsupportedUnit;
      item.uncertaintyNote = item.unsupportedUnit
        ? "Food matched foodtable.md, but the selected measurement is not supported for this reference. Enter nutrient values for this quantity."
        : match._regional
          ? `Matched ${match.regionalName || value} to regional food data and ${match.name} nutrition.`
          : "Matched typed food name to foodtable.md nutrition data.";
      return item;
    }

    item.base = createManualNutritionPlaceholder(value);
    item.sourceName = "Manual entry, nutrition values needed";
    item.confidence = null;
    item.needsUserReview = true;
    item.unsupportedUnit = false;
    item.referenceBase = null;
    item.manualEntry = item.manualEntry || false;
    clearPortionData(item);
    item.uncertaintyNote = "This item is not in foodtable.md. Enter the nutrient values you know; unknown values can stay blank.";
    return item;
  }

  function createManualNutritionPlaceholder(name) {
    const base = {
      name,
      notes: "User-entered nutrition for an item missing from foodtable.md.",
      editableNutrition: true
    };
    NUTRIENT_FIELDS.forEach(([key]) => {
      base[key] = null;
    });
    return base;
  }

  function refreshUnitSupport(item) {
    const reference = item.referenceBase || (item.base && !item.base.editableNutrition ? item.base : null);
    if (!reference) {
      item.unsupportedUnit = false;
      return;
    }
    item.referenceBase = reference;
    item.unsupportedUnit = !unitSupportedByReference(reference, item.unit);
    if (item.unsupportedUnit) {
      item.base = createManualNutritionPlaceholder(item.foodName);
      item.sourceName = "Manual entry, measurement not matched";
      clearPortionData(item);
      return;
    }
    item.base = reference;
    item.sourceName = reference._regional
      ? `Regional nutrition estimate (${reference.regionalRegion || "India"})`
      : reference.per100 ? "Ingredient nutrition estimate" : "Meal nutrition estimate";
    applyPortionDefaults(item, { keepExisting: true });
  }

  function unitSupportedByReference(base, unit) {
    const normalized = normalizeUnit(unit);
    if (!normalized) return false;
    if (base.per100) return PER_100_UNITS.has(normalized) || PORTION_UNITS.has(normalized);
    if (MEAL_FALLBACK_UNITS.has(normalized)) return true;
    return unitsFromAverageQuantity(base.avgQty).has(normalized);
  }

  function unitsFromAverageQuantity(avgQty) {
    const normalized = String(avgQty || "").toLowerCase();
    const units = new Set();
    if (/\bg\b|gram|grams/.test(normalized)) units.add("grams");
    if (/\bcups?\b/.test(normalized)) {
      units.add("cup");
      units.add("cups");
    }
    if (/\bpieces?\b|idli|roti|rotis|paratha|parathas|taco|tacos|slice|slices/.test(normalized)) {
      units.add("piece");
      units.add("pieces");
    }
    if (/\bbowl\b/.test(normalized)) units.add("bowl");
    if (/\bplate\b/.test(normalized)) units.add("plate");
    if (/\btbsp\b|tablespoon/.test(normalized)) units.add("tbsp");
    return units;
  }

  function normalizeUnit(unit) {
    const normalized = String(unit || "").toLowerCase().trim();
    if (normalized === "gram" || normalized === "g") return "grams";
    return normalized;
  }

  function confidenceFromReference(ref, value) {
    if (ref.per100) {
      const text = String(ref.dataConfidence || "").toLowerCase();
      if (text.includes("high")) return 0.88;
      if (text.includes("medium")) return 0.72;
      if (text.includes("low")) return 0.55;
      return 0.7;
    }
    return ref.name.toLowerCase() === String(value || "").toLowerCase().trim() ? 0.78 : 0.68;
  }

  function itemNeedsManualNutrition(item) {
    return Boolean(item.manualEntry && item.base && (item.base.editableNutrition || item.unsupportedUnit));
  }

  function manualNutritionMessage(item) {
    if (item.unsupportedUnit) {
      return "Measurement is not matched for this foodtable.md item. Enter nutrition for the quantity shown above; unknown fields can stay blank.";
    }
    return "This item is not in foodtable.md. Enter nutrient values you know; unknown fields can stay blank.";
  }

  function nutrientInputValue(value) {
    return value === null || value === undefined || value === "" ? "" : String(value);
  }

  function findMealReference(name) {
    const query = String(name || "").toLowerCase().trim();
    if (!query) return null;
    return state.references.find((ref) => ref.name.toLowerCase() === query)
      || state.references.find((ref) => ref.name.toLowerCase().includes(query) || query.includes(ref.name.toLowerCase()));
  }

  function findIngredientReference(name) {
    const query = String(name || "").toLowerCase().trim();
    if (!query) return null;
    const direct = findBaseIngredientReference(query);
    if (direct) return direct;
    const regional = findRegionalFoodReference(query);
    if (!regional) return null;
    const canonical = findBaseIngredientReference(regional.canonicalFoodName);
    if (!canonical) return null;
    return {
      ...canonical,
      regionalName: regional.localName || regional.foodName,
      regionalRegion: regional.regionName,
      sourceName: regional.sourceName || canonical.sourceName,
      sourceUrl: regional.sourceUrl || canonical.sourceUrl,
      sourceBasis: regional.sourceBasis,
      dataConfidence: regional.confidence || canonical.dataConfidence,
      _regional: true
    };
  }

  function foodSuggestions(query) {
    const normalized = String(query || "").toLowerCase().trim();
    const scoredRegional = currentRegionalFoodItems()
      .map((ref) => scoreSuggestion({
        name: ref.localName || ref.foodName,
        type: ref.regionName ? `${ref.regionName} food` : "Regional food",
        searchText: `${ref.foodName} ${ref.localName || ""} ${ref.canonicalFoodName} ${ref.foodGroup} ${ref.regionName}`,
        scoreOffset: -12
      }, normalized))
      .filter(Boolean);
    const scoredIngredients = state.ingredientReferences
      .map((ref) => scoreSuggestion({
        name: ref.name,
        type: "Ingredient",
        searchText: `${ref.name} ${ref.category} ${ref.commonState || ""}`
      }, normalized))
      .filter(Boolean);
    const scoredMeals = state.references
      .map((ref) => scoreSuggestion({
        name: ref.name,
        type: "Meal",
        searchText: `${ref.name} ${ref.staples} ${ref.region}`
      }, normalized))
      .filter(Boolean);
    const seen = new Set();
    return [...scoredRegional, ...scoredIngredients, ...scoredMeals]
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
      .filter((suggestion) => {
        const key = suggestion.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function scoreSuggestion(suggestion, query) {
    const name = suggestion.name.toLowerCase();
    const text = suggestion.searchText.toLowerCase();
    if (!query || query.length < 2) {
      return { ...suggestion, score: (suggestion.type === "Ingredient" ? 50 : 70) + (suggestion.scoreOffset || 0) };
    }
    const terms = query.split(/\s+/).filter(Boolean);
    const allTermsMatch = terms.every((term) => text.includes(term));
    if (!allTermsMatch) return null;
    let score = 100;
    if (name === query) score = 0;
    else if (name.startsWith(query)) score = 5;
    else if (name.split(/\s+/).some((word) => word.startsWith(query))) score = 10;
    else if (name.includes(query)) score = 20;
    else score = 40;
    score += suggestion.type === "Meal" ? 4 : 0;
    score += suggestion.scoreOffset || 0;
    score += Math.min(20, name.length / 4);
    return { ...suggestion, score };
  }

  function findBaseIngredientReference(query) {
    const normalized = String(query || "").toLowerCase().trim();
    if (!normalized) return null;
    return state.ingredientReferences.find((ref) => ref.name.toLowerCase() === normalized)
      || state.ingredientReferences.find((ref) => ref.name.toLowerCase().includes(normalized) || normalized.includes(ref.name.toLowerCase()));
  }

  function findRegionalFoodReference(query) {
    const normalized = String(query || "").toLowerCase().trim();
    if (!normalized) return null;
    const foods = currentRegionalFoodItems();
    return foods.find((ref) => regionalFoodMatches(ref, normalized, true))
      || foods.find((ref) => regionalFoodMatches(ref, normalized, false));
  }

  function regionalFoodMatches(ref, query, exact) {
    const values = [ref.localName, ref.foodName, ref.canonicalFoodName].filter(Boolean).map((value) => value.toLowerCase());
    if (exact) return values.some((value) => value === query);
    return values.some((value) => value.includes(query) || query.includes(value));
  }

  function currentRegionalFoodItems() {
    if (!state.regionalFoodItems.length || String(els.userLocation && els.userLocation.value || "").toLowerCase() !== "india") {
      return [];
    }
    const regionName = selectedIndianRegionName();
    const regional = regionName
      ? state.regionalFoodItems.filter((item) => item.regionName === regionName)
      : [];
    return uniqueRegionalFoods([...regional, ...state.regionalFoodItems]);
  }

  function selectedIndianRegionName() {
    const city = String(els.userCity && els.userCity.value || "").trim();
    if (!city) return "";
    const normalized = city.toLowerCase();
    const directRegion = state.regions.find((region) => region.name.toLowerCase() === normalized);
    if (directRegion) return directRegion.name;
    return INDIAN_CITY_TO_REGION[normalized] || "";
  }

  function uniqueRegionalFoods(foods) {
    const seen = new Set();
    return foods.filter((food) => {
      const key = `${food.regionName}:${food.localName || food.foodName}:${food.canonicalFoodName}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function confidenceBasis(item) {
    if (item.confidence >= 0.75) {
      return "High confidence: the visible food has a strong nutrition match.";
    }
    if (item.confidence >= 0.5) {
      return "Medium confidence: partial food or meal pattern match. Please review quantity.";
    }
    return "Low confidence: unclear image result or no strong nutrition match. Manual confirmation needed.";
  }

  function splitLocation(region) {
    return String(region || "")
      .split(/\s*\/\s*|\s*,\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function uniqueValues(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function fallbackReferences() {
    return [
      {
        id: 80,
        region: "North America",
        name: "Grilled chicken salad",
        staples: "Chicken, greens, vegetables, dressing",
        avgQty: "150 g chicken + large salad",
        diet: "Omnivore",
        calories: 520,
        protein: 42,
        carbs: 24,
        fat: 28,
        fiber: 8,
        sodium: 850,
        notes: "Vitamin A, K, C; dressing matters"
      },
      {
        id: 1,
        region: "India / South Asia",
        name: "Dal rice",
        staples: "Lentils, rice, tempering oil",
        avgQty: "1.5 cups rice + 1 cup dal",
        diet: "Vegetarian",
        calories: 560,
        protein: 20,
        carbs: 95,
        fat: 12,
        fiber: 13,
        sodium: 800,
        notes: "Iron, folate, potassium; oil changes calories"
      }
    ];
  }

  function fallbackIngredientReferences() {
    return [
      {
        name: "Chicken breast",
        category: "Poultry",
        commonState: "Cooked skinless",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74,
        dataConfidence: "High",
        notes: "Fallback per 100 g",
        per100: true
      },
      {
        name: "Potato",
        category: "Vegetable",
        commonState: "Baked",
        calories: 93,
        protein: 2.5,
        carbs: 21.2,
        fat: 0.1,
        fiber: 2.2,
        sugar: 1.2,
        sodium: 10,
        dataConfidence: "High",
        notes: "Fallback per 100 g",
        per100: true
      }
    ];
  }

  function fallbackPortionReferences() {
    return [
      {
        foodName: "Roti",
        unit: "piece",
        smallGrams: 25,
        mediumGrams: 35,
        largeGrams: 50,
        defaultSize: "medium",
        nutritionBasis: "per_100g",
        notes: "Fallback variable-size flatbread portion"
      },
      {
        foodName: "Pizza slice",
        unit: "slice",
        smallGrams: 80,
        mediumGrams: 110,
        largeGrams: 150,
        defaultSize: "medium",
        nutritionBasis: "per_100g",
        notes: "Fallback variable-size pizza portion"
      }
    ];
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function formatDate(value) {
    if (!value) return "No date";
    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function number(value) {
    const parsed = Number.parseFloat(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  if (typeof module !== "undefined") {
    module.exports = {
      parseFoodTable,
      parseIngredientNutrition,
      parsePortionSizeReference,
      calculateTotals,
      fallbackReferences,
      fallbackIngredientReferences,
      fallbackPortionReferences,
      createItemFromReference,
      createManualAddedItem,
      createItemFromAiComponent,
      applyFoodNameChange,
      normalizeInternetLocation,
      citySuggestionsForLocation,
      createManualNutritionPlaceholder,
      unitSupportedByReference,
      createUnclearItem,
      applyPortionDefaults,
      runDemoVisionAnalysis
    };
  }
})();
