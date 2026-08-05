const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const server = path.join(dist, "server");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(client, { recursive: true });
fs.mkdirSync(server, { recursive: true });

for (const file of [
  "index.html", "styles.css", "app.js", "pwa.js", "service-worker.js",
  "manifest.webmanifest", "login.html", "login.js", "profile.html", "profile.js",
  "admin.html", "admin.js"
]) {
  fs.copyFileSync(path.join(root, file), path.join(client, file));
}

for (const directory of ["icons", "source"]) {
  fs.cpSync(path.join(root, directory), path.join(client, directory), { recursive: true });
}

fs.writeFileSync(path.join(server, "index.js"), `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'This hosted preview includes the NutriMate marketing experience. Run the local app to use account and meal APIs.' }, { status: 503 });
    }
    return env.ASSETS.fetch(request);
  }
};\n`);

console.log("Sites deployment bundle created.");
