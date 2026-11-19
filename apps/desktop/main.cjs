// Electron shell: serves the Expo web build from a loopback-only server and opens it
// in a locked-down window. The UI, grammar and generation client are the same code
// as web and mobile; desktop just gets the ≥1024px layout (sidebar + two columns).
const { app, BrowserWindow, shell } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const WEB_ROOT = path.join(__dirname, "web");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".ttf": "font/ttf", ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml" };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
      let file = path.normalize(path.join(WEB_ROOT, urlPath));
      if (!file.startsWith(WEB_ROOT)) { res.writeHead(403).end(); return; } // no path traversal
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB_ROOT, "index.html"); // SPA fallback
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`));
  });
}

async function createWindow() {
  const url = process.env.MOONSHOT_URL ?? (await serve());
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024, // desktop layout breakpoint from the contract
    minHeight: 640,
    title: "Leadership Tools",
    backgroundColor: "#F6F5FA",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, "preload.cjs") },
  });
  // External links open in the system browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url: target }) => { shell.openExternal(target); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, target) => { if (!target.startsWith(url)) { e.preventDefault(); shell.openExternal(target); } });
  await win.loadURL(url);
  // MOONSHOT_SMOKE=out.png: wait for the first screen to generate, save a capture, quit.
  if (process.env.MOONSHOT_SMOKE) {
    setTimeout(async () => {
      const img = await win.webContents.capturePage();
      fs.writeFileSync(process.env.MOONSHOT_SMOKE, img.toPNG());
      app.quit();
    }, 12000);
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
