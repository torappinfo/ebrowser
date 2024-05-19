const { app, BaseWindow, WebContentsView, globalShortcut, Menu, MenuItem, shell, clipboard} = require('electron')
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
      let url = args.slice(3).join(" ")
      handleQuery(url)
    }else
      createWindow();
  })
}

const fs = require('fs');
const path = require('path')
const process = require('process')
let iTab = 1;
let addrBar;
let engines = {};
let autocompleteStrA;
const optionsTemplate = [
  {
    label: 'Redirect',
    type: 'checkbox',
  },
];
const optMenu = Menu.buildFromTemplate(optionsTemplate);
Menu.setApplicationMenu(null);

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

fs.readFile(path.join(__dirname,'default.autoc'), 'utf8', (err, str) => {
  if(err) return;
  autocompleteStrA = str.split('\n');
});

function resize(){
  var wsize = win.getSize();
  addrBar.setBounds({x: 0, y: 0, width: wsize[0], height: 50});
  win.contentView.children[iTab].setBounds({x: 0, y: 30, width: wsize[0], height: wsize[1]-50});
}

function callbackWithHTMLString(request){//"html:" scheme
  const url = request.url;
  const html = url.slice(5);
  return new Response(html,
    { status: 200,
      headers: {'content-type': 'text/html' } }); 
}

function switchTab(i){
  win.contentView.children[iTab].setVisible(false);
  iTab = i;
  win.contentView.children[iTab].setVisible(true);
  resize();
  let title = win.contentView.children[i].webContents.getTitle();
  win.setTitle(title);
}

function newTab(){
  let view = new WebContentsView({
    webPreferences: {
    defaultEncoding: "utf-8",
    }});
  win.contentView.addChildView(view);
  iTab = win.contentView.children.length -1;
  view.webContents.setWindowOpenHandler(handleNewWindow);
  view.webContents.on('context-menu',onContextMenu);
}

function handleNewWindow(urlInfo){
  newTab();
  win.contentView.children[iTab].setVisible(false);
  let url = urlInfo.url;
  const options = { httpReferrer: urlInfo.referer };
  win.contentView.children[iTab].webContents.loadURL(url,options);
  return { action: 'deny' }
}

function bang(query, iSpace){
  let name = query.slice(0,iSpace);
  let engine = engines[name];
  if(engine)
    return engine+query.substring(iSpace+1);
  return "https://www.bing.com/search?q="+query;
}

function handleQuery(q){
  var url=q;
  do {
    if(q.length>9){
      let c6 = q.charCodeAt(6);
      if(47==c6){// '/'
        let c5 = q.charCodeAt(5);
        if(47==c5 && 58==q.charCodeAt(4))//http/file urls
          break;
        if(58==c5 && 47==q.charCodeAt(7))//https://
          break;
      }else if(q.startsWith("javascript:")) break;
    }
    let iS = q.indexOf(' ');
    if(iS<0 && q.indexOf('.')>0)
      url = 'http://'+q;
    else
      url = bang(q, iS);
  }while(false);
  win.contentView.children[iTab].webContents.loadURL(url);
  win.setTitle(url);
}

function addrInputEvent(event, inputEvent){
  if(inputEvent.control || inputEvent.alt || inputEvent.meta) return;
  const jsVal = 'document.body.firstElementChild.value';
  const addrWC = addrBar.webContents;
  if (inputEvent.key === 'Enter') {
    event.preventDefault();
    addrWC.executeJavaScript(jsVal,false).then((query) => handleQuery(query));
    return;
  }
  /*
  if (inputEvent.type !== 'keyUp') return;
  addrWC.executeJavaScript(jsVal,false).then((q) => {
    let autocMenu = new Menu();
    const filteredA = autocompleteStrA.filter(str => str.includes(q));
    if( 0==filteredA.length) return;
    for (let str of filteredA) {
      let menuItem = new MenuItem({
        label: str,
      });
      autocMenu.append(menuItem);
    }
    //autocMenu.popup();
  });
  */
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

class RequestInterceptor {
  async didReceiveNavigationRequest(details) {
    // 根据需要决定是否阻止或替换请求
    console.log(` Intercepted request: ${details.url}`);

    // 可以选择取消请求
    // return { cancel: true };

    // 或者发送自定义响应
    // 注意：实际实现可能更为复杂，涉及到创建并返回response对象
    // return { response: new Response('Intercepted!', { status: 200 }) };
  }
}

//webContents.session.setWebContentsDelegate(new RequestInterceptor());

function createWindow () {
  win = new BaseWindow({width: 800, height: 600,autoHideMenuBar: true});
  
  win.on('closed', function () {
    win = null
  })

  addrBar = new WebContentsView({
    webPreferences: {
      defaultEncoding: "utf-8",
    }});
  win.contentView.addChildView(addrBar);
  let addrWC = addrBar.webContents;
  //addrBar.webContents.loadFile('addressbar.html');
  addrWC.session.protocol.handle('html', callbackWithHTMLString);
  addrWC.loadURL('html:<input type="text" list="autoc" style="width:100%" autofocus>');
  addrWC.on('before-input-event',addrInputEvent);

  newTab();
  let url = process.argv.slice(2).join(" ");
  if(url) handleQuery(url);

  win.on('resize', resize)

  globalShortcut.register("Ctrl+G", ()=>{
    let url = win.contentView.children[iTab].webContents.getURL();
    addrBar.webContents.executeJavaScript(
      'document.body.firstElementChild.value="'+url+'"',false);
    addrBar.webContents.focus();
  });

  globalShortcut.register("Ctrl+L", ()=>{
    addrBar.webContents.focus();
  });

  globalShortcut.register("Ctrl+O", ()=>{
    optMenu.popup();
  });
  
  globalShortcut.register("Ctrl+T", ()=>{
    win.contentView.children[iTab].setVisible(false);
    newTab();
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

  globalShortcut.register("Ctrl+Shift+Tab", ()=>{
    let nTabs = win.contentView.children.length;
    if(nTabs<=2) return;
    let i = iTab - 1;
    if(i<1) i=nTabs-1;
    switchTab(i);
  });

  globalShortcut.register("Ctrl+Left", ()=>{
    win.contentView.children[iTab].webContents.goBack();
  });

  globalShortcut.register("Ctrl+Right", ()=>{
    win.contentView.children[iTab].webContents.goForward();
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