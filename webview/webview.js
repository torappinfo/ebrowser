const { app, BrowserWindow, globalShortcut} = require('electron')
let win;

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
      url = args.slice(3).join(" ");
      win.webContents.executeJavaScript("handleQuery(`"+url+"`)",false);
    }else
      createWindow();
  })
}

const fs = require('fs');
const path = require('path')
const process = require('process')

function createWindow () {
  win = new BrowserWindow(
    {width: 800, height: 600,autoHideMenuBar: true,
     webPreferences: {
       webviewTag: true,
     }});

  win.on('closed', function () {
    win = null
  })

  win.loadFile('index.html');
  {
    let url=process.argv.slice(2).join(" ");
    win.webContents.executeJavaScript("handleQuery(`"+url+"`)",false);
  }

  globalShortcut.register("Ctrl+L", ()=>{
    win.webContents.executeJavaScript("document.forms[0].q.focus()",false);
  });

  globalShortcut.register("Ctrl+T", ()=>{
    win.webContents.executeJavaScript("newTab();switchTab(tabs.children.length-1)",false);
  });

  globalShortcut.register("Ctrl+W", ()=>{
    win.webContents.executeJavaScript("tabClose()",false).then((r)=>{
      if(""===r) win.close();
    });
  });
  
  globalShortcut.register("Ctrl+Tab", ()=>{
    win.webContents.executeJavaScript("tabInc(1)",false);
  });

  globalShortcut.register("Ctrl+Shift+Tab", ()=>{
    win.webContents.executeJavaScript("tabDec(-1)",false);
  });

  globalShortcut.register("Esc", ()=>{
    win.webContents.executeJavaScript("document.activeElement.blur()",false);
  });
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

fs.readFile(path.join(__dirname,'search.json'), 'utf8', (err, jsonString) => {
  if (err) return;
  win.webContents.executeJavaScript("engines=JSON.parse(`"+jsonString+"`)",false);
});
