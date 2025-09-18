(async (...args)=>{let t=location.href;let i=t.indexOf('uweb=');
if(i<2) return;
let sleep=(ms)=>{return new Promise(resolve=>setTimeout(resolve,ms))};
let u=decodeURI(t.substring(i+5));
function setVal(ta,u){const selection = window.getSelection();
  const clearEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteContentBackward'
    });
  ta.dispatchEvent(clearEvent);
  document.execCommand('insertText',false,u);
  const events = [
      new Event('focus', { bubbles: true }),
      new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: u }),
      new InputEvent('input', { bubbles: true, inputType: 'insertText' }),
      new Event('change', { bubbles: true })
    ];
  events.forEach(event => ta.dispatchEvent(event));
  setTimeout(() => {
      ta.blur();
      setTimeout(() => ta.focus(), 10);
    }, 10);
  const event = new Event('input', { bubbles: true });
  ta.dispatchEvent(event);}
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
    setTimeout(()=>{ta.focus();setVal(ta,u)},10);
    return;
  }
}
ta.focus();setVal(ta,u);
return;}
await sleep(400);}})()
