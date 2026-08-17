import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(__dirname, "public", "icon.ico"),
        autoHideMenuBar: true
    });

    win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);