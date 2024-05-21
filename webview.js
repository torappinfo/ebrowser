const { app, BrowserWindow, globalShortcut, Menu, shell, clipboard,session, protocol, net} = require('electron')
let win;
let wvSession;

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
      win.setTitle(url);
    }else
      createWindow();
  })
}
Menu.setApplicationMenu(null);

const fs = require('fs');
const path = require('path')
const process = require('process')
var gredirects = [];
var gredirect;

function createWindow () {
  wvSession = session.fromPartition("wv");
  win = new BrowserWindow(
    {width: 800, height: 600,autoHideMenuBar: true,
     webPreferences: {
       webviewTag: true,
     }});

  win.on('closed', function () {
    win = null
  })

  win.loadFile('index.html');
  fs.readFile(path.join(__dirname,'search.json'), 'utf8', (err, jsonString) => {
    if (err) return;
    win.webContents.executeJavaScript("engines=JSON.parse(`"+jsonString+"`)",false);
  });

  fs.readFile(path.join(__dirname,'default.autoc'), 'utf8', (err, str) => {
    if(err) return;
    let js = "appendAutoc(`"+str+"`)";
    win.webContents.executeJavaScript(js,false);
  });

  fs.readFile(path.join(__dirname,'redirect.json'), 'utf8', (err, jsonString) => {
    if (err) return;
    try {
      gredirects = JSON.parse(jsonString);
    } catch (e){}
  });

  if(process.argv.length>2){
    let url=process.argv.slice(2).join(" ");
    win.webContents.executeJavaScript("handleQuery(`"+url+"`)",false);
    win.setTitle(url);
  }

  globalShortcut.register("Ctrl+G", ()=>{
    let js="{let q=document.forms[0].q;q.focus();q.value=tabs.children[iTab].src}"
    win.webContents.executeJavaScript(js,false)
  });

  globalShortcut.register("Ctrl+L", ()=>{
    win.webContents.executeJavaScript("document.forms[0].q.select()",false);
  });

  globalShortcut.register("Ctrl+T", ()=>{
    win.webContents.executeJavaScript("newTab();switchTab(tabs.children.length-1)",false);
  });

  globalShortcut.register("Ctrl+R", ()=>{
    gredirect=null;
    win.webContents.executeJavaScript("gredirect=null",false);
  });

  globalShortcut.register("Ctrl+Shift+R", ()=>{
    if(0==gredirects.length) return;
    gredirect=gredirects[0];
    win.webContents.executeJavaScript("gredirect='"+gredirect+"'",false);
  });

  globalShortcut.register("Ctrl+W", ()=>{
    win.webContents.executeJavaScript("tabClose()",false).then((r)=>{
      if(""===r) win.close();
    });
  });

  globalShortcut.register("Ctrl+Tab", ()=>{
    let js="tabInc(1);{let tab=tabs.children[iTab];let t=tab.getTitle();if(t)t;else tab.getURL()}";
    win.webContents.executeJavaScript(js,false).then((r)=>{
      win.setTitle(r);
    });
  });

  globalShortcut.register("Ctrl+Shift+Tab", ()=>{
    let js="tabDec(-1);{let tab=tabs.children[iTab];let t=tab.getTitle();if(t)t;else tab.getURL()}";
    win.webContents.executeJavaScript(js,false).then((r)=>{
      win.setTitle(r);
    });
  });

  globalShortcut.register("Ctrl+Left", ()=>{
    let js="tabs.children[iTab].goBack()";
    win.webContents.executeJavaScript(js,false);
  });

  globalShortcut.register("Ctrl+Right", ()=>{
    let js="tabs.children[iTab].goForward()";
    win.webContents.executeJavaScript(js,false);
  });
  
  globalShortcut.register("Esc", ()=>{
    let js = "document.activeElement.blur();tabs.children[iTab].stopFindInPage('clearSelection')";
    win.webContents.executeJavaScript(js,false);
  });

  globalShortcut.register("F5", ()=>{
    win.webContents.executeJavaScript("tabs.children[iTab].reload()",false);
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

app.on ('web-contents-created', (event, contents) => {
  if (contents.getType () === 'webview') {
    contents.setWindowOpenHandler(cbWindowOpenHandler);
    contents.on('context-menu',onContextMenu);
    contents.on('page-title-updated',cbTitleUpdate);
    /*
    contents.session.webRequest.onBeforeRequest(
      {types: ['script', 'image', 'stylesheet', 'font', 'xhr','media','webSocket']},
      interceptRequest);
    */
    //contents.on('did-finish-load',)
  }
});

/*
function cbScheme_https(request){
  let url;
  if(!gredirect)
    url= request.url;
  else
    url = gredirect+request.url;
  console.log(url)
  return net.fetch(url);
}

function interceptRequest(details, callback){
  if(gredirect){
    if(!details.url.startsWith(gredirect)){
      let newUrl = gredirect + details.url;
      callback({ cancel: false, redirectURL: newUrl });
      return;
    }
  }
  callback({ cancel: false });
}
*/

function cbWindowOpenHandler({url}){
  let js = "newTab();switchTab(tabs.children.length-1);tabs.children[iTab].src='"+
      url+"'";
  win.webContents.executeJavaScript(js,false);
  return { action: "deny" }; 
}
function cbTitleUpdate(event,title){
  win.setTitle(title);
}
function showContextMenu(linkUrl){
  const titleItem = {
    label: linkUrl,
    enabled: false // Disable clicking on the title
  };
  const menuTemplate = [titleItem,
    {
      label: 'Open Link',
      click: () => {
        shell.openExternal(linkUrl);
      }
    },
    {
      label: 'Copy Link',
      click: () => {
        clipboard.writeText(linkUrl);
      }
    },
    {
      label: 'Download',
      click: () => {
        win.contentView.children[i].webContents.downloadURL(linkUrl);
      }
    },
  ];

  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  contextMenu.popup();
}

function onContextMenu(event, params){
  //console.log(params);
  if (params.linkURL) {
    showContextMenu(params.linkURL);
  }
}
