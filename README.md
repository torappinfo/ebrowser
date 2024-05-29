### Eweb browser as alternative to [uweb browser](https://github.com/torappinfo/uweb)
Electron WEB browser bases on electron (thus chromium) with the philosophy for [uweb browser](https://gitlab.com/jamesfengcao/uweb).

- lightweight (less than 10k) without bundled electron.
- highly performant.
- keyboard (command line) friendly.
- customizable.

Note: Usually electron apps are heavyweight as they use browsers for simple things. Eweb uses core chromium effectively and very lightweight. Recommend to install electron and eweb separately.

#### Key shortcuts
- CTRL+G: address bar to show page url
- CTRL+L: focus to address bar
- CTRL+T: new Tab
- CTRL+TAB: switch to next tab
- CTRL+SHIFT+TAB: switch to previous tab
- CTRL+W: close Tab
- CTRL+<-: go backward
- CTRL+->: go forward
- CTRL+SHIFT+R: enable global redirection ("gredirect.json")
- CTRL+R: disable global redirection
- ESC
- ":" for address bar commands
- "!" for ":!" address bar commands

#### Address bar
- "/" for find-in-page
- ":" for address bar commands
  - anycert : allow invalid certificates w/o arguments, otherwise restore to default
  - b [bookmarkfilename w/o ext] : bookmark current page in file
  - clear : the arguments could be
    - cache : clear cache
    - dns : clear dns cache
    - storage: clear site storage data.
  - ext [extension path]: load unpacked Chrome extension.
  - nj/uj for No/Use external Javascript files.
  - nr/ur for No/Use "redirect.json" for domain redirection.
  - np : no proxy
  - up [proxyName] : use proxy. privous proxy or the first proxy w/o [proxyName].
  - ua [useragentName] : set user agent for future tabs. default user agent w/o arguments.
- ":!" address bar commands

#### Configuration files
- "config": lines of address bar ":" commands.
- "search.json": search engines as shortcut-queryUrl pairs.
- "default.autoc": predefined strings for address bar auto completion.
- "gredirect.json": global redirection urls as array of urls
- "redirect.json": domain-replacementDomain pairs, default to be applied.
- "proxy.json": name-[ProxyConfig](https://www.electronjs.org/docs/latest/api/structures/proxy-config) pairs
- "uas.json" : name-useragent pairs