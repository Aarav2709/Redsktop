import { app, BrowserWindow, shell, protocol, Menu } from "electron";
import path from "node:path";

const isDev = process.env.ELECTRON_START_URL !== undefined;
let mainWindow: BrowserWindow | null = null;

const iconPath = app.isPackaged
  ? path.join(process.resourcesPath, "icons", "redsktop.png")
  : path.join(__dirname, "../client/public/redsktop.png");

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL
    ? process.env.ELECTRON_START_URL
    : app.isPackaged
    ? `file://${path.join(process.resourcesPath, "client", "dist", "index.html")}`
    : `file://${path.join(__dirname, "../client/dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const allowAuthPopup = url.startsWith("https://www.reddit.com") || url.startsWith("https://oauth.reddit.com");
    if (allowAuthPopup) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Remove default menu bar (File/Edit/View/Window/Help)
  Menu.setApplicationMenu(null);
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const deepLink = argv.find((arg) => arg.startsWith("redsktop://"));
      if (deepLink) mainWindow.webContents.send("deep-link", deepLink);
    }
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol("redsktop", (request, cb) => {
    const url = request.url.replace("redsktop://", "");
    cb({ path: url });
  });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
