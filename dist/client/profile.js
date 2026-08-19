(function () {
  const GOALS = {
    protein: 90,
    carbs: 275,
    fat: 70
  };

  const state = {
    sessionToken: "",
    dashboard: null,
    selectedDate: "",
    currentUser: null,
    mealTypeFilter: "",
    customMealTypes: []
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    [
      "profileName",
      "profileSummary",
      "addMealLink",
      "totalCalories",
      "totalProtein",
      "totalCarbs",
      "totalFat",
      "activeDays",
      "savedMealCount",
      "proteinBar",
      "carbBar",
      "fatBar",
      "dashboardMessage",
      "refreshDashboardButton",
      "calendarList",
      "mealListLabel",
      "mealTypeFilter",
      "mealList",
      "mealDetailPanel",
      "mealDetailTitle",
      "mealDetailMeta",
      "mealDetail",
      "adminLink",
      "unsubscribeButton",
      "profileMessage"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });

    state.sessionToken = localStorage.getItem("nutritracker.sessionToken") || "";
    els.refreshDashboardButton.addEventListener("click", loadDashboard);
    if (els.mealTypeFilter) els.mealTypeFilter.addEventListener("change", changeMealTypeFilter);
    if (els.unsubscribeButton) els.unsubscribeButton.addEventListener("click", unsubscribe);
    if (!state.sessionToken) {
      window.location.href = "login.html";
      return;
    }
    els.addMealLink.href = "index.html?member=1";
    loadCurrentSession();
  }

  async function loadCurrentSession() {
    try {
      const response = await fetchWithAccess("/api/auth/me", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Login is required.");
      state.currentUser = payload.user;
      if (els.adminLink) els.adminLink.hidden = payload.role !== "admin";
      await loadUserMealTypes();
      loadDashboard();
    } catch {
      localStorage.removeItem("nutritracker.sessionToken");
      window.location.href = "login.html";
    }
  }

  async function loadDashboard() {
    els.dashboardMessage.textContent = "Loading dashboard...";
    try {
      const response = await fetchWithAccess("/api/users/me/dashboard", { cache: "no-store" });
      const dashboard = await response.json();
      if (!response.ok) throw new Error(dashboard.error || "Unable to load dashboard.");
      state.dashboard = dashboard;
      renderDashboard();
    } catch (error) {
      els.dashboardMessage.textContent = error.message;
      els.calendarList.innerHTML = "";
      els.mealList.innerHTML = "";
    }
  }

  async function loadUserMealTypes() {
    try {
      const response = await fetchWithAccess("/api/users/me/meal-types", { cache: "no-store" });
      const mealTypes = await response.json();
      if (!response.ok) throw new Error(mealTypes.error || "Unable to load meal types.");
      state.customMealTypes = Array.isArray(mealTypes) ? mealTypes : [];
      renderMealTypeFilterOptions();
    } catch {
      state.customMealTypes = [];
      renderMealTypeFilterOptions();
    }
  }

  function renderMealTypeFilterOptions() {
    if (!els.mealTypeFilter) return;
    const selected = els.mealTypeFilter.value;
    const standard = ["Breakfast", "Lunch", "Evening snack", "Dinner", "Snack", "Custom"];
    const customOptions = state.customMealTypes.filter((name) => !standard.includes(name));
    els.mealTypeFilter.innerHTML = [
      "<option value=\"\">All meals</option>",
      ...standard.map((name) => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`),
      ...customOptions.map((name) => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`)
    ].join("");
    els.mealTypeFilter.value = ["", ...standard, ...customOptions].includes(selected) ? selected : "";
    state.mealTypeFilter = els.mealTypeFilter.value;
  }

  function renderDashboard() {
    const { user, totals, days, recentMeals } = state.dashboard;
    els.profileName.textContent = user.displayName;
    els.profileSummary.textContent = [user.city, user.location, user.dietaryPreference].filter(Boolean).join(" - ") || "Saved meal and nutrition history.";
    els.dashboardMessage.textContent = days.length ? `${days.length} day${days.length === 1 ? "" : "s"} with saved meals.` : "No meals saved yet.";
    els.totalCalories.textContent = Math.round(totals.calories || 0);
    els.totalProtein.textContent = `${round1(totals.protein)}g`;
    els.totalCarbs.textContent = `${round1(totals.carbs)}g`;
    els.totalFat.textContent = `${round1(totals.fat)}g`;
    if (els.activeDays) els.activeDays.textContent = days.length;
    if (els.savedMealCount) els.savedMealCount.textContent = days.reduce((sum, day) => sum + Number(day.mealCount || 0), 0);
    setBar(els.proteinBar, totals.protein, GOALS.protein);
    setBar(els.carbBar, totals.carbs, GOALS.carbs);
    setBar(els.fatBar, totals.fat, GOALS.fat);
    renderCalendar(days);
    renderMeals(filteredMeals(recentMeals), currentMealListLabel("Recent meals"));
  }

  function renderCalendar(days) {
    if (!days.length) {
      els.calendarList.innerHTML = "<p class=\"warning\">No saved meal dates yet.</p>";
      return;
    }
    els.calendarList.innerHTML = days.map((day) => `
      <button class="calendar-day" data-date="${escapeAttr(day.date)}" type="button">
        <strong>${formatDate(day.date)}</strong>
        <span>${Math.round(day.calories)} kcal</span>
        <small>${day.mealCount} meal${day.mealCount === 1 ? "" : "s"}</small>
      </button>
    `).join("");
    els.calendarList.querySelectorAll("[data-date]").forEach((button) => {
      button.addEventListener("click", () => selectDate(button.dataset.date));
    });
  }

  async function selectDate(date) {
    state.selectedDate = date;
    els.mealListLabel.textContent = currentMealListLabel(`Meals saved on ${formatDate(date)}`);
    els.mealList.innerHTML = "<p class=\"warning\">Loading meals...</p>";
    try {
      const start = `${date}T00:00:00`;
      const end = `${date}T23:59:59`;
      const params = new URLSearchParams({ start, end });
      if (state.mealTypeFilter) params.set("mealType", state.mealTypeFilter);
      const response = await fetchWithAccess(`/api/users/me/meals?${params.toString()}`, { cache: "no-store" });
      const meals = await response.json();
      if (!response.ok) throw new Error(meals.error || "Unable to load meals.");
      renderMeals(meals, currentMealListLabel(`Meals saved on ${formatDate(date)}`));
    } catch (error) {
      els.mealList.innerHTML = `<p class="warning">${escapeHtml(error.message)}</p>`;
    }
  }

  async function changeMealTypeFilter() {
    state.mealTypeFilter = els.mealTypeFilter.value;
    if (state.selectedDate) {
      selectDate(state.selectedDate);
      return;
    }
    if (!state.mealTypeFilter) {
      renderDashboard();
      return;
    }
    els.mealListLabel.textContent = currentMealListLabel("Saved meals");
    els.mealList.innerHTML = "<p class=\"warning\">Loading meals...</p>";
    try {
      const params = new URLSearchParams({ mealType: state.mealTypeFilter });
      const response = await fetchWithAccess(`/api/users/me/meals?${params.toString()}`, { cache: "no-store" });
      const meals = await response.json();
      if (!response.ok) throw new Error(meals.error || "Unable to load meals.");
      renderMeals(meals, currentMealListLabel("Saved meals"));
    } catch (error) {
      els.mealList.innerHTML = `<p class="warning">${escapeHtml(error.message)}</p>`;
    }
  }

  function filteredMeals(meals) {
    if (!state.mealTypeFilter) return meals;
    return meals.filter((meal) => meal.mealType === state.mealTypeFilter);
  }

  function currentMealListLabel(baseLabel) {
    return state.mealTypeFilter ? `${baseLabel} - ${state.mealTypeFilter}` : baseLabel;
  }

  function renderMeals(meals, label) {
    els.mealListLabel.textContent = label;
    if (!meals.length) {
      els.mealList.innerHTML = "<p class=\"warning\">No reviewed meals saved for this view.</p>";
      return;
    }
    els.mealList.innerHTML = meals.map((meal) => `
      <article class="history-item">
        ${meal.photo ? `<img src="${meal.photo}" alt="">` : "<div class=\"avatar\">M</div>"}
        <div>
          <strong>${escapeHtml(meal.mealType)} - ${Math.round(meal.totals.calories)} kcal estimate</strong>
          <span>${formatDateTime(meal.eatenAt)} - ${meal.items.length} items - ${round1(meal.totals.protein)}g protein</span>
        </div>
        <button class="secondary" data-meal="${escapeAttr(meal.id)}" type="button">Open</button>
      </article>
    `).join("");
    els.mealList.querySelectorAll("[data-meal]").forEach((button) => {
      button.addEventListener("click", () => loadMealDetail(button.dataset.meal));
    });
  }

  async function loadMealDetail(mealId) {
    try {
      const response = await fetchWithAccess(`/api/users/me/meals/${encodeURIComponent(mealId)}`, { cache: "no-store" });
      const meal = await response.json();
      if (!response.ok) throw new Error(meal.error || "Unable to load meal.");
      renderMealDetail(meal);
    } catch (error) {
      els.mealDetailPanel.hidden = false;
      els.mealDetail.innerHTML = `<p class="warning">${escapeHtml(error.message)}</p>`;
    }
  }

  function renderMealDetail(meal) {
    els.mealDetailPanel.hidden = false;
    els.mealDetailTitle.textContent = `${meal.mealType} - ${Math.round(meal.totals.calories)} kcal estimate`;
    els.mealDetailMeta.textContent = `${formatDateTime(meal.eatenAt)} - ${meal.location || "Location not saved"}`;
    els.mealDetail.innerHTML = `
      <div class="meal-detail-grid">
        ${meal.photo ? `<img class="detail-photo" src="${meal.photo}" alt="Saved meal">` : "<div class=\"detail-photo empty-photo\">No photo saved</div>"}
        <div class="nutrient-panel">
          <h3>Meal totals</h3>
          ${nutrientRows([
            ["Calories", meal.totals.calories, "kcal"],
            ["Protein", meal.totals.protein, "g"],
            ["Carbs", meal.totals.carbs, "g"],
            ["Fat", meal.totals.fat, "g"],
            ["Fiber", meal.totals.fiber, "g"],
            ["Sodium", meal.totals.sodium, "mg"]
          ])}
        </div>
      </div>
      <div class="items-table-wrap">
        <table class="items-table">
          <thead>
            <tr>
              <th>Food</th>
              <th>Amount</th>
              <th>Nutrition estimate</th>
            </tr>
          </thead>
          <tbody>
            ${meal.items.map((item) => `
              <tr>
                <td>
                  <strong>${escapeHtml(item.foodName)}</strong>
                  <small>${escapeHtml(item.sourceName || "Estimate")}</small>
                  ${item.needsUserReview ? "<small class=\"confidence low\">Needs review</small>" : ""}
                </td>
                <td>${round1(item.quantity)} ${escapeHtml(item.unit)}${item.totalGrams ? `<small>${round1(item.totalGrams)}g used</small>` : ""}</td>
                <td>${Math.round(item.nutrition.calories)} kcal, ${round1(item.nutrition.protein)}g protein</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function nutrientRows(rows) {
    return rows.map(([label, value, unit]) => `
      <div class="nutrient-row">
        <span>${label}</span>
        <strong>${round1(value)} ${unit}</strong>
        <span class="target">Estimate</span>
      </div>
    `).join("");
  }

  function fetchWithAccess(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("X-Auth-Token", state.sessionToken);
    return fetch(url, { ...options, headers });
  }

  async function unsubscribe() {
    if (!window.confirm("Unsubscribe from NutriTracker and disable this account?")) return;
    if (els.profileMessage) els.profileMessage.textContent = "Unsubscribing...";
    try {
      const response = await fetchWithAccess("/api/users/me/unsubscribe", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to unsubscribe.");
      localStorage.removeItem("nutritracker.sessionToken");
      window.location.href = "login.html";
    } catch (error) {
      if (els.profileMessage) els.profileMessage.textContent = error.message;
    }
  }

  function setBar(element, value, goal) {
    element.style.width = `${Math.min(100, Math.round((Number(value) / goal) * 100) || 0)}%`;
  }

  function round1(value) {
    return Math.round((Number(value) || 0) * 10) / 10;
  }

  function formatDate(value) {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatDateTime(value) {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
})();
