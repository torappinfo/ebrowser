/* Copyright (C) 2024 Richard Hao Cao
 */
const {
  app, BrowserWindow, Menu, shell, clipboard,
  session, protocol, net, dialog
} = require('electron')
let win;

if(!app.requestSingleInstanceLock())
  app.quit()
else {
  app.on('ready', createWindow);
  app.on('second-instance', (event, args, cwd) => {
    if (win) {
      if (win.isMinimized()) {
        win.restore()
      }
      win.show()
      win.focus()
      cmdlineProcess(args,cwd,1);
    }else
      createWindow();
  })
}
topMenu();

const fs = require('fs');
const readline = require('readline');
const path = require('path')
const process = require('process')
var gredirects = [];
var gredirect;
var redirects;
var bRedirect = true;
var bJS = true;
var bHistory = false;
var bForwardCookie = false;
var proxies = {};
var proxy;
var useragents = {};
var defaultUA =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/" +
    process.versions.chrome +" Safari/537.36";
app.userAgentFallback = defaultUA;
var historyFile = path.join(__dirname,'history.rec');

fs.readFile(path.join(__dirname,'redirect.json'), 'utf8', (err, jsonString) => {
  if (err) return;
  try {
    redirects = JSON.parse(jsonString);
  } catch (e){console.log(e)}
});

async function createWindow () {
  let json = await fs.promises.readFile(path.join(__dirname,'uas.json'), 'utf8');
  try {
    useragents = JSON.parse(json);
  } catch (e){console.log(e)}
  
  await (async ()=>{
    try{
      const readInterface = readline.createInterface ({
        input: fs.createReadStream (path.join(__dirname,'config'), 'utf8'),
      });

      for await (const line of readInterface) {
        addrCommand(line);
      }
    }catch(e){console.log(e);}
  })();

  win = new BrowserWindow(
    {width: 800, height: 600,autoHideMenuBar: true,
     webPreferences: {
       nodeIntegration: true,
       contextIsolation: false,
       webviewTag: true,
     }});
  win.setMenuBarVisibility(false);
  win.on('closed', function () {
    win = null
  })

  win.loadFile('index.html');
  fs.readFile(path.join(__dirname,'gredirect.json'), 'utf8', (err, jsonString) => {
    if (err) return;
    try {
      gredirects = JSON.parse(jsonString);
    } catch (e){console.log(e)}
  });

  fs.readFile(path.join(__dirname,'proxy.json'), 'utf8', (err, jsonString) => {
    if (err) return;
    try {
      proxies = JSON.parse(jsonString, (key,val)=>{
        if(!proxy && key==="proxyRules"){
          proxy = {proxyRules:val};
        }
        return val;
      });
    } catch (e){console.log(e)}
  });

  cmdlineProcess(process.argv, process.cwd(), 0);
  //app.commandLine.appendSwitch ('trace-warnings');

  win.webContents.on('page-title-updated',(event,cmd)=>{
    addrCommand(cmd);
  });

  win.webContents.on('console-message',cbConsoleMsg);
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
})

app.on ('web-contents-created', (event, contents) => {
  if (contents.getType () === 'webview') {
    contents.setWindowOpenHandler(cbWindowOpenHandler);
    contents.on('context-menu',onContextMenu);
    contents.on('page-title-updated',cbTitleUpdate);
    //contents.on('console-message',cbConsoleMsg);
    //contents.on('focus', ()=>{cbFocus(contents)});
    //contents.on('blur',()=>{cbBlur()});
    contents.session.webRequest.onBeforeRequest(interceptRequest);
    contents.on('did-finish-load',()=>{cbFinishLoad(contents)});
  }
});

function addrCommand(cmd){
  if(cmd.length<3) return;
  let c0 = cmd.charCodeAt(0);
  switch(c0){
  case 58: //':'
    args = cmd.substring(1).split(/\s+/);
    switch(args[0]){
    case "cert":
      if(args.length==1)
        session.defaultSession.setCertificateVerifyProc((request, callback) => {
          callback(0);
        });
      else
        session.defaultSession.setCertificateVerifyProc(null);
      return;
    case "clear":
      if(args.length==1){
        session.defaultSession.clearData();
        return;
      }
      switch(args[1]){
      case "cache":
        session.defaultSession.clearCache();
        return;
      case "dns":
        session.defaultSession.clearHostResolverCache();
        return;
      case "storage":
        session.defaultSession.clearStorageData();
        return;
      default:
        try {
          let opts = JSON.parse(args.slice(1).join(""));
          session.defaultSession.clearData(opts);
        }catch(e){console.log(e)}
      }
      return;
    case "ext":
      session.defaultSession.loadExtension(args[1]);
      return;
    case "nc":
      bForwardCookie = false;
      msgbox_info("Cookie forwarding disabled");
      return;
    case "uc":
      if(bForwardCookie) {
        msgbox_info("Cookie forwarding enabled for global redirection");
        return;
      }
      forwardCookie();
      return;
    case "nh":
      bHistory = false; return;
    case "uh":
      bHistory = true; return;
    case "nj":
      bJS = false; return;
    case "uj":
      bJS = true; return;
    case "np":
      session.defaultSession.setProxy ({mode:"direct"});
      return;
    case "up":
      if(args.length>1)
        proxy = proxies[args[1]]; //retrieve proxy
      if(proxy)
        session.defaultSession.setProxy(proxy);
      bRedirect = false;
      return;
    case "nr":
      bRedirect = false; return;
    case "ur":
      bRedirect = true; return;
    case "ua":
      if(args.length==2)
        session.defaultSession.setUserAgent(useragents[args[1]]);
      else
        session.defaultSession.setUserAgent(defaultUA);
      return;
    }
  }
}

function cbConsoleMsg(e, level, msg, line, sourceid){
  console.log(line);
  console.log(sourceid);
  console.log(msg);
}

function cbFinishLoad(webContents){
  if(!bHistory) return;
  let histItem = webContents.getTitle()+" "+webContents.getURL()+"\n";
  fs.appendFile(historyFile, histItem, (err) => {});
}

function cbFocus(webContents){
  let js = "if(focusMesg){let m=focusMesg;focusMesg=null;m}";
  win.webContents.executeJavaScript(js,false).then((r)=>{
    //focusMesg as js code
    console.log(r);
    if(r) webContents.executeJavaScript(r,false);
  });
}

function interceptRequest(details, callback){
  if(!bJS && details.url.endsWith(".js")){
    callback({ cancel: true });
    return;
  }
  do {
    if(gredirect || !bRedirect ||(details.resourceType !== 'mainFrame' &&
                     details.resourceType !== 'subFrame')) break;
    let oURL = new URL(details.url);
    let domain = oURL.hostname;
    let newUrl;
    try{
      let newDomain = redirects[domain];
      if(!newDomain) break;
      newUrl = "https://"+newDomain+oURL.pathname+oURL.search+oURL.hash;
    }catch(e){break;}
    callback({ cancel: false, redirectURL: newUrl });
    return;
  }while(false);
  callback({ cancel: false });
}

function cbWindowOpenHandler(details){
  let url = details.url;
  let js = "newTab();tabs.children[tabs.children.length-1].src='"+
      url+"';";
  switch(details.disposition){
  case "foreground-tab":
  case "new-window":
    js = js + "switchTab(tabs.children.length-1)";
  }
  win.webContents.executeJavaScript(js,false);
  return { action: "deny" };
}
function cbTitleUpdate(event,title){
  win.setTitle(title);
}
function menuArray(labelprefix, linkUrl){
  const menuTemplate = [
    {
      label: labelprefix+'Open Link',
      click: () => {
        shell.openExternal(linkUrl);
      }
    },
    {
      label: labelprefix+'Copy Link',
      click: () => {
        clipboard.writeText(linkUrl);
      }
    },
    {
      label: labelprefix+'Download',
      click: () => {
        win.contentView.children[i].webContents.downloadURL(linkUrl);
      }
    },
  ];
  return menuTemplate;
}

function onContextMenu(event, params){
  let url = params.linkURL;
  let mTemplate = [];
  if (url) {
    mTemplate.push({label:url,enabled:false});
    mTemplate.push.apply(mTemplate,menuArray("",url));
    if((url=params.srcURL))
      mTemplate.push.apply(mTemplate,menuArray("src: ",url));
  }else if((url=params.srcURL)){
    mTemplate.push({label:url,enabled:false});
    mTemplate.push.apply(mTemplate,menuArray("src: ",url));
  }else
    return;

  const contextMenu = Menu.buildFromTemplate(mTemplate);
  contextMenu.popup();
}

function topMenu(){
  const menuTemplate = [
    {
      label: '',
      submenu: [
        { label: 'Stop', accelerator: 'Ctrl+C', click: ()=>{
          let js="tabs.children[iTab].stop()"
          win.webContents.executeJavaScript(js,false)
        }},
        { label: 'getURL', accelerator: 'Ctrl+G', click: ()=>{
          let js="{let q=document.forms[0].q;q.focus();q.value=tabs.children[iTab].src}"
          win.webContents.executeJavaScript(js,false)
        }},
        { label: 'Select', accelerator: 'Ctrl+L', click:()=>{
          win.webContents.executeJavaScript("document.forms[0].q.select()",false);
        }},
        { label: 'New Tab', accelerator: 'Ctrl+T', click:()=>{
          let js = "newTab();document.forms[0].q.select();switchTab(tabs.children.length-1)";
          win.webContents.executeJavaScript(js,false);
        }},
        { label: 'No redirect', accelerator: 'Ctrl+R', click: ()=>{
          if(gredirect){
            gredirect=null;
            unregisterHandler();
          }
        }},
        { label: 'Redirect', accelerator: 'Ctrl+Shift+R', click: ()=>{
          if(0==gredirects.length) return;
          if(!gredirect) registerHandler();
          gredirect=gredirects[0];
        }},
        { label: 'Close', accelerator: 'Ctrl+W', click: ()=>{
          win.webContents.executeJavaScript("tabClose()",false).then((r)=>{
            if(""===r) win.close();
            else win.setTitle(r);
          });
        }},
        { label: 'Next Tab', accelerator: 'Ctrl+Tab', click: ()=>{
          let js="tabInc(1);getWinTitle()";
          win.webContents.executeJavaScript(js,false).then((r)=>{
            win.setTitle(r);
          });
        }},
        { label: 'Previous Tab', accelerator: 'Ctrl+Shift+Tab', click: ()=>{
          let js="tabDec(-1);getWinTitle()";
          win.webContents.executeJavaScript(js,false).then((r)=>{
            win.setTitle(r);
          });
        }},
        { label: 'Go backward', accelerator: 'Ctrl+Left', click: ()=>{
          let js="tabs.children[iTab].goBack()";
          win.webContents.executeJavaScript(js,false);
        }},
        { label: 'Go forward', accelerator: 'Ctrl+Right', click: ()=>{
          let js="tabs.children[iTab].goForward()";
          win.webContents.executeJavaScript(js,false);
        }},
        { label: 'No focus', accelerator: 'Esc', click: ()=>{
          let js = `{let e=document.activeElement;
if(e)e.blur();try{tabs.children[iTab].stopFindInPage('clearSelection')}catch(er){}}`;
          win.webContents.executeJavaScript(js,false);
        }},
        { label: 'Reload', accelerator: 'F5', click: ()=>{
          win.webContents.executeJavaScript("tabs.children[iTab].reload()",false);
        }},
        { label: 'Devtools', accelerator: 'F12', click: ()=>{
          let js = "try{tabs.children[iTab].openDevTools()}catch(e){console.log(e)}";
          win.webContents.executeJavaScript(js,false);
        }},

      ],
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

function cmdlineProcess(argv,cwd,extra){
  let i1st = 2+extra; //index for the first query item
  if(argv.length>i1st){
    if(i1st+1==argv.length){//local file
      let fname =  path.join(cwd, argv[i1st]);
      if(fs.existsSync(fname)){
        let js = "tabs.children[iTab].src='file://"+fname+"'";
        win.webContents.executeJavaScript(js,false);
        win.setTitle(argv[i1st]);
        return;
      }
    }
    let url=argv.slice(i1st).join(" ");
    win.webContents.executeJavaScript("handleQuery(`"+url+"`)",false);
    win.setTitle(url);
  }
}

async function cbScheme_redir(req){
  if(!gredirect) return null;
  let oUrl = req.url;
  let newurl = gredirect+oUrl;
  let options = {
    body:       req.body,
    headers:    req.headers,
    method:     req.method,
    referer:    req.referer,
    duplex: "half",
    bypassCustomProtocolHandlers: true
  };
  if(bForwardCookie){
    let cookies = await session.defaultSession.cookies.get({url: oUrl});
    let cookieS = cookies.map (cookie => cookie.name  + '=' + cookie.value ).join(';');
    options.headers['Cookie'] = cookieS;
  }

  return fetch(newurl, options);
}

function registerHandler(){
  protocol.handle("http",cbScheme_redir);
  protocol.handle("https",cbScheme_redir);
  protocol.handle("ws",cbScheme_redir);
  protocol.handle("wss",cbScheme_redir);
}
function unregisterHandler(){
  protocol.unhandle("http",cbScheme_redir);
  protocol.unhandle("https",cbScheme_redir);
  protocol.unhandle("ws",cbScheme_redir);
  protocol.unhandle("wss",cbScheme_redir);
}

function forwardCookie(){
  const choice = dialog.showMessageBoxSync(null,  {
    type: 'warning',
    title: 'Confirm cookie forwarding with global redirection',
    message: 'Cookies are used to access your account. Forwarding cookies is vulnerable to global redirection server, proceed to enable cookie forwarding with global redirection?',
    buttons: ['No','Yes']
  })
  if(1===choice) bForwardCookie=true;
}
function msgbox_info(msg){
  dialog.showMessageBoxSync(null,  {
    type: 'info',
    title: msg,
    message: msg,
    buttons: ['OK']
  })
}


