const { app, BrowserWindow } = require("electron");
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const isKiosk = process.argv.includes('--kiosk');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    kiosk: isKiosk,
    webPreferences: {
      nodeIntegration: true
    }
  });

  const port = 9966;
  if (process.argv[2]) {
    win.loadURL(process.argv[2]);
  } else {
    require("dns").lookup(require("os").hostname(), (err, addr) => {
      if (err) throw err;
      else win.loadURL(`http://${addr}:${port}/`);
    });
  }

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", createWindow);
app.on("window-all-closed", () => {
  app.quit();
});