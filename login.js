(function () {
  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    ["loginForm", "email", "password", "loginMessage"].forEach((id) => {
      els[id] = document.getElementById(id);
    });
    els.loginForm.addEventListener("submit", login);
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
      const next = new URLSearchParams(window.location.search).get("next");
      if (next) {
        window.location.href = next;
      } else {
        window.location.href = payload.role === "admin" ? "admin.html" : "profile.html";
      }
    } catch (error) {
      els.loginMessage.textContent = error.message;
    }
  }
})();
