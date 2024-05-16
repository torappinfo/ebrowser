const { app, BaseWindow, WebContentsView, globalShortcut} = require('electron')
const fs = require('fs');
const path = require('path')
const process = require('process')
let win;
let iTab = 1;
let url = process.argv[2];
let addrBar;
let engines = {};

fs.readFile(path.join(__dirname,'search.json'), 'utf8', (err, jsonString) => {
  if (err) {
    console.error("search.json:", err);
    return;
  }

  try {
    engines = JSON.parse(jsonString);
  } catch (parseError) {
    console.error("Error parsing search.JSON:", parseError);
  }
});

function resize(){
  var wsize = win.getSize();
  addrBar.setBounds({x: 0, y: 0, width: wsize[0], height: 30});
  win.contentView.children[iTab].setBounds({x: 0, y: 30, width: wsize[0], height: wsize[1]-30});
}

function switchTab(i){
  win.contentView.children[iTab].setVisible(false);
  iTab = i;
  win.contentView.children[iTab].setVisible(true);
  resize();
}

function newTab(){
  let view = new WebContentsView({
    webPreferences: {
    defaultEncoding: "utf-8",
    }});
  win.contentView.addChildView(view);
  iTab = win.contentView.children.length -1;
  view.webContents.setWindowOpenHandler(handleNewWindow);
}

function handleNewWindow(urlInfo){
  newTab();
  win.contentView.children[iTab].setVisible(false);
  let url = urlInfo["url"];
  const options = { httpReferrer: urlInfo["referer"] };
  win.contentView.children[iTab].webContents.loadURL(url,options);
  return { action: 'deny' }
}

function bang(query){
  let iS = query.indexOf(' ');
  let name = query.slice(0,iS);
  let engine = engines[name];
  if(engine)
    return engine+query.substring(iS+1);
  return "https://www.bing.com/search?q="+query;
}

function handleQuery(q){
  var url=q;
  var iColon=q.indexOf('://');
  if(4==iColon||5==iColon){//http
  }else if(q.indexOf('.')>0&&q.indexOf(' ')<0)
    url = 'http://'+q;
  else
    url = bang(q);
  win.contentView.children[iTab].webContents.loadURL(url);
}

function addrInputEvent(event, inputEvent){
  if (inputEvent.key === 'Enter') {
    event.preventDefault();
    addrBar.webContents.executeJavaScript('document.body.firstElementChild.value',false).then((query) => handleQuery(query));
  }
}

function createWindow () {
  win = new BaseWindow({width: 800, height: 600,autoHideMenuBar: true});
  
  win.on('closed', function () {
    win = null
  })

  addrBar = new WebContentsView({
    webPreferences: {
      defaultEncoding: "utf-8",
      javascript: false,
    }});
  win.contentView.addChildView(addrBar);
  addrBar.webContents.loadFile('addressbar.html');
  addrBar.webContents.on('before-input-event',addrInputEvent);

  newTab();
  if(url)
    win.contentView.children[iTab].webContents.loadURL(url)

  win.on('resize', resize)

  globalShortcut.register("Ctrl+T", ()=>{
    win.contentView.children[iTab].setVisible(false);
    newTab();
  });
  
  globalShortcut.register("Ctrl+L", ()=>{
    addrBar.webContents.focus();
  });

  globalShortcut.register("Ctrl+W", ()=>{
    if(!win.isFocused()){
      BaseWindow.getFocusedWindow().close();
      return;
    }
    let nTabs = win.contentView.children.length;
    if(nTabs<=2) {
      win.close();
      return;
    }
    win.contentView.removeChildView(win.contentView.children[iTab]);
    if(iTab>=nTabs-1) iTab=iTab-1;
    win.contentView.children[iTab].setVisible(true);
    resize();
  });

  globalShortcut.register("Ctrl+Tab", ()=>{
    let nTabs = win.contentView.children.length;
    if(nTabs<=2) return;
    let i = iTab +1;
    if(i>=nTabs) i=1;
    switchTab(i);
  });

  globalShortcut.register("Ctrl+Left", ()=>{
    win.contentView.children[iTab].webContents.goBack();
  });

  globalShortcut.register("Ctrl+Right", ()=>{
    win.contentView.children[iTab].webContents.goForward();
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
      win.contentView.children[iTab].webContents.loadURL(url)
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
