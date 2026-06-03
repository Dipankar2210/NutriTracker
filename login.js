(function () {
  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    ["loginForm", "email", "password", "loginMessage"].forEach((id) => {
      els[id] = document.getElementById(id);
    });
    els.loginForm.addEventListener("submit", login);
    routeExistingSession();
  }

  async function routeExistingSession() {
    const token = localStorage.getItem("nutritracker.sessionToken") || "";
    if (!token) return;

    try {
      const response = await fetch("/api/auth/me", {
        headers: { "X-Auth-Token": token },
        cache: "no-store"
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Login is required.");
      routeAfterLogin(payload.role);
    } catch {
      localStorage.removeItem("nutritracker.sessionToken");
    }
  }

  async function login(event) {
    event.preventDefault();
    els.loginMessage.textContent = "Signing in...";
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: els.email.value,
          password: els.password.value
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to log in.");
      localStorage.setItem("nutritracker.sessionToken", payload.token);
      routeAfterLogin(payload.role);
    } catch (error) {
      els.loginMessage.textContent = error.message;
    }
  }

  function routeAfterLogin(role) {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && isSafeNext(next, role)) {
      window.location.href = next;
      return;
    }
    window.location.href = role === "admin" ? "admin.html" : "profile.html";
  }

  function isSafeNext(next, role) {
    if (/^https?:\/\//i.test(next) || next.startsWith("//")) return false;
    if (next.includes("admin.html") && role !== "admin") return false;
    return /^(?:\.\/)?(?:admin|profile|index)\.html(?:[?#].*)?$/.test(next);
  }
})();
