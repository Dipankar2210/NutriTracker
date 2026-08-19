(function () {
  const els = {};
  let sessionToken = "";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    [
      "userForm",
      "displayName",
      "contactEmail",
      "contactPhone",
      "location",
      "city",
      "dietaryPreference",
      "dailyCalories",
      "dailyProtein",
      "formMessage",
      "magicLink",
      "copyLinkButton",
      "linkMessage",
      "usersList",
      "refreshUsersButton"
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });

    sessionToken = localStorage.getItem("nutritracker.sessionToken") || "";
    if (!sessionToken) {
      window.location.href = "login.html?next=admin.html";
      return;
    }
    els.userForm.addEventListener("submit", createUser);
    els.copyLinkButton.addEventListener("click", copyMagicLink);
    els.refreshUsersButton.addEventListener("click", loadUsers);
    verifyAdmin();
  }

  async function verifyAdmin() {
    try {
      const response = await fetchWithAuth("/api/auth/me", { cache: "no-store" });
      const payload = await readJsonResponse(response);
      if (!response.ok || payload.role !== "admin") throw new Error("Admin login is required.");
      loadUsers();
    } catch {
      window.location.href = "login.html?next=admin.html";
    }
  }

  async function createUser(event) {
    event.preventDefault();
    els.formMessage.textContent = "Creating user...";
    try {
      const response = await fetchWithAuth("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: els.displayName.value,
          contactEmail: els.contactEmail.value,
          contactPhone: els.contactPhone.value,
          location: els.location.value,
          city: els.city.value,
          dietaryPreference: els.dietaryPreference.value,
          goals: {
            dailyCalories: els.dailyCalories.value,
            dailyProtein: els.dailyProtein.value
          }
        })
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Unable to create user.");
      els.magicLink.value = payload.magicLink || "";
      els.linkMessage.textContent = `Setup link ready for ${payload.user.displayName}.`;
      els.formMessage.textContent = "User created.";
      els.userForm.reset();
      await loadUsers();
    } catch (error) {
      els.formMessage.textContent = error.message;
    }
  }

  async function loadUsers() {
    els.usersList.innerHTML = "<p class=\"warning\">Loading users...</p>";
    try {
      const response = await fetchWithAuth("/api/admin/users", { cache: "no-store" });
      const users = await readJsonResponse(response);
      if (!response.ok) throw new Error(users.error || "Unable to load users.");
      renderUsers(users);
    } catch (error) {
      els.usersList.innerHTML = `<p class="warning">${escapeHtml(error.message)}</p>`;
    }
  }

  function renderUsers(users) {
    if (!users.length) {
      els.usersList.innerHTML = "<p class=\"warning\">No users created yet.</p>";
      return;
    }
    els.usersList.innerHTML = users.map((user) => `
      <article class="history-item user-row">
        <div class="avatar">${initials(user.displayName)}</div>
        <div class="user-row-main">
          <div class="user-title-line">
            <strong>${escapeHtml(user.displayName)}</strong>
            <span class="role-pill ${user.role === "admin" ? "admin" : ""}">${escapeHtml(user.role)}</span>
            <span class="status-mini">${escapeHtml(user.status)}</span>
          </div>
          <span>${escapeHtml(contactLine(user))}</span>
          <span>${escapeHtml([user.city, user.location, user.dietaryPreference].filter(Boolean).join(" - ") || "No location or preference saved")}</span>
        </div>
        <div class="user-row-actions">
          <button class="secondary compact-action" data-token="${escapeAttr(user.id)}" type="button">New setup link</button>
          <details class="role-change">
            <summary>Change role</summary>
            <label>
              Role
              <select data-role-select="${escapeAttr(user.id)}">
                <option value="user"${user.role === "user" ? " selected" : ""}>User</option>
                <option value="admin"${user.role === "admin" ? " selected" : ""}>Admin</option>
              </select>
            </label>
          </details>
        </div>
      </article>
    `).join("");
    els.usersList.querySelectorAll("[data-token]").forEach((button) => {
      button.addEventListener("click", () => rotateMagicLink(button.dataset.token));
    });
    els.usersList.querySelectorAll("[data-role-select]").forEach((select) => {
      select.addEventListener("change", () => updateRole(select.dataset.roleSelect, select.value));
    });
  }

  async function rotateMagicLink(userId) {
    els.linkMessage.textContent = "Creating a new magic link...";
    try {
      const response = await fetchWithAuth(`/api/admin/users/${encodeURIComponent(userId)}/access-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Admin generated link" })
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Unable to create link.");
      els.magicLink.value = payload.magicLink || "";
      els.linkMessage.textContent = `New setup link ready for ${payload.user.displayName}.`;
    } catch (error) {
      els.linkMessage.textContent = error.message;
    }
  }

  async function updateRole(userId, role) {
    try {
      const response = await fetchWithAuth(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Unable to update role.");
      els.linkMessage.textContent = `${payload.displayName} is now ${payload.role}.`;
      await loadUsers();
    } catch (error) {
      els.linkMessage.textContent = error.message;
    }
  }

  async function copyMagicLink() {
    if (!els.magicLink.value) {
      els.linkMessage.textContent = "No magic link to copy yet.";
      return;
    }
    try {
      await navigator.clipboard.writeText(els.magicLink.value);
      els.linkMessage.textContent = "Magic link copied.";
    } catch {
      els.magicLink.select();
      els.linkMessage.textContent = "Select and copy the link manually.";
    }
  }

  function contactLine(user) {
    return user.contactEmail || user.contactPhone || "No contact saved";
  }

  async function readJsonResponse(response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {
        error: response.ok
          ? "Server returned an unreadable response."
          : `Server route unavailable (${response.status}). Restart npm run dev and try again.`
      };
    }
  }

  function fetchWithAuth(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("X-Auth-Token", sessionToken);
    return fetch(url, { ...options, headers });
  }

  function initials(name) {
    return String(name || "U")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";
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
