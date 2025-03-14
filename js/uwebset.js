(async ()=>{let t=location.href;let i=t.indexOf('uweb=');
if(i<3) return;
let sleep=(ms)=>{return new Promise(resolve=>setTimeout(resolve,ms))};
function setVal(e,v){
  const inputEvent = new Event('input', { bubbles: true, composed: true });
  const nativeInputVSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,'value').set;
  nativeInputVSetter.call(e,v);
  e.dispatchEvent(inputEvent);}
let bAppend = false;
{let w=t.charCodeAt(i-1)-48;if(w>=0&&w<=9){w=w*100+(t.charCodeAt(i-2)-48)*1000;await sleep(w);
if(65===t.charCodeAt(i-3))bAppend=true;}}
if(i+5===t.length)return;
t=decodeURI(t.substring(i+5));
while(true){let ta=document.querySelector('textarea');
if(ta){
if(bAppend)t=ta.value+t;
setVal(ta,t);
if(13===t.charCodeAt(t.length-1)){await sleep(100);
ta.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true}));}
return;}await sleep(400);}})()
