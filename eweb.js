const { app, BaseWindow, WebContentsView, globalShortcut} = require('electron')
const process = require('process')
let win;
let view;
let url = process.argv[2];

function createWindow () {
  win = new BaseWindow({width: 800, height: 600,autoHideMenuBar: true});

  win.on('closed', function () {
    win = null
  })

  view = new WebContentsView({
    autoResize: true,
    defaultEncoding: "utf-8",
  });
  win.contentView.addChildView(view);
  view.webContents.loadURL(url)

  win.on('resize', () => {
    var wsize = win.getSize();
    view.setBounds({x: 0, y: 0, width: wsize[0], height: wsize[1]});
  })

  globalShortcut.register("CommandOrControl+W", ()=>{
    app.quit();
  });
}

if(!app.requestSingleInstanceLock())
  app.quit()
else {
  app.on('ready', createWindow);
  app.on('second-instance', (event, args) => {
    // 当已经有运行的实例时，我们激活窗口而不是创建新的窗口
    if (win) {
      if (win.isMinimized()) {
        win.restore()
      }
      win.show()
      win.focus()
      url = args[3]
      view.webContents.loadURL(url)
    }else
      createWindow();
  })
}

app.on('window-all-closed', function () {
  app.quit()
})

app.on('activate', function () {
  if (win === null) {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
