const { app, BrowserWindow } = require('electron')
const url = require('url')

function createWindow () {
  var win = new BrowserWindow({
    width: 800, height: 600,
    webPreferences: {
      webviewTag: true,
    }});

  win.setMenuBarVisibility(false)
  win.webContents.openDevTools()

  win.on('closed', function () {
    win = null
  })

  win.loadFile('index.html');


}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  app.quit()
})

app.on('activate', function () {
  if (win === null) {
    createWindow()
  }
})
