### Eweb browser as alternative to [uweb browser](https://github.com/torappinfo/uweb)
Electron WEB browser bases on electron (thus chromium) with the philosophy for [uweb browser](https://gitlab.com/jamesfengcao/uweb).

#### Key shortcuts
- CTRL+G: address bar to show page url
- CTRL+L: focus to address bar
- CTRL+T: new Tab
- CTRL+TAB: switch to next tab
- CTRL+SHIFT+TAB: switch to previous tab
- CTRL+W: close Tab
- CTRL+<-: go backward
- CTRL+->: go forward
- CTRL+SHIFT+R: enable global redirection ("redirect.json")
- CTRL+R: disable global redirection
- ESC
- ":" for address bar commands
- "!" for ":!" address bar commands

#### Address bar
- "/" for find-in-page
- ":" for address bar commands
  - nj/uj for No/Use external Javascript files
  - np : no proxy
  - up [proxyName] : use proxy. privous proxy or the first proxy w/o [proxyName]
- ":!" address bar commands

#### Configuration files
- "search.json": search engines as shortcut-queryUrl pairs.
- "default.autoc": predefined strings for address bar auto completion.
- "redirect.json": global redirection urls as array of urls
- "proxy.json": name-[ProxyConfig](https://www.electronjs.org/docs/latest/api/structures/proxy-config) pairs