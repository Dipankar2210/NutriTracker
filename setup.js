(function () {
  const state = {
    token: ""
  };
  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    ["setupSummary", "setupForm", "password", "confirmPassword", "setupMessage"].forEach((id) => {
      els[id] = document.getElementById(id);
    });
    state.token = new URLSearchParams(window.location.search).get("token") || "";
    els.setupForm.addEventListener("submit", setPassword);
    validateLink();
  }

  async function validateLink() {
    if (!state.token) {
      els.setupSummary.textContent = "This setup link is missing a token.";
      return;
    }
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Invalid setup link.");
      els.setupSummary.textContent = `Create a password for ${payload.user.displayName}.`;
      els.setupForm.hidden = false;
    } catch (error) {
      els.setupSummary.textContent = error.message;
    }
  }

  async function setPassword(event) {
    event.preventDefault();
    const password = els.password.value;
    const confirmPassword = els.confirmPassword.value;
    const validation = validatePassword(password, confirmPassword);
    if (validation) {
      els.setupMessage.textContent = validation;
      return;
    }

    els.setupMessage.textContent = "Saving password...";
    try {
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: state.token, password, confirmPassword })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to set password.");
      window.location.href = "login.html";
    } catch (error) {
      els.setupMessage.textContent = error.message;
    }
  }

  function validatePassword(password, confirmPassword) {
    if (!password || !confirmPassword) return "Both password fields are required.";
    if (password !== confirmPassword) return "Passwords must match.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must include a number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a symbol.";
    return "";
  }
})();
