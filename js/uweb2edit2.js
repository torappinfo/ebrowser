(async (...args)=>{let t=location.href;let i=t.indexOf('uweb=');
if(i<2) return;
let sleep=(ms)=>{return new Promise(resolve=>setTimeout(resolve,ms))};
let u=t.substring(i+5);
function setVal(u){const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(u));
    const event = new Event('input', { bubbles: true });
    range.startContainer.parentElement.dispatchEvent(event);}}
let s='[contenteditable="true"]';
while(true){let ta=document.querySelector(s);
if(ta){
let w=t.charCodeAt(i-1)-48;if(w>=0&&w<=9){w=w*100+(t.charCodeAt(i-2)-48)*1000;await sleep(w);
if(!ta.isConnected)ta=document.querySelector(s);}
if(args.length>0){
  let i = +args[0];
  const buts = ta.parentNode.querySelectorAll('button');
  if(buts.length>i){
    buts[i].click();
    setTimeout(()=>{ta.focus();setVal(u)},10);
    return;
  }
}
ta.focus();setVal(u);
return;}
await sleep(400);}})()
