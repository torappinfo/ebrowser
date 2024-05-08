const { app, BaseWindow, WebContentsView} = require('electron')
const process = require('process')

function createWindow () {
  var win = new BaseWindow({width: 800, height: 600,autoHideMenuBar: true});

  win.on('closed', function () {
    win = null
  })

  const view = new WebContentsView({autoResize: true,});
  win.contentView.addChildView(view);
  view.webContents.loadURL(process.argv[2])

  win.on('resize', () => {
    var wsize = win.getSize();
    view.setBounds({x: 0, y: 0, width: wsize[0], height: wsize[1]});
  })
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
