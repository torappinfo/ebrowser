(async (...args)=>{let t=location.href;let i=t.indexOf('uweb=');
if(i<3) return;
let sleep=(ms)=>{return new Promise(resolve=>setTimeout(resolve,ms))};
let bAppend = false;
{let w=t.charCodeAt(i-1)-48;if(w>=0&&w<=9){w=w*100+(t.charCodeAt(i-2)-48)*1000;await sleep(w);
if(65===t.charCodeAt(i-3))bAppend=true;}}
if(i+5===t.length)return;
t=decodeURI(t.substring(i+5));
let selector='input[type="text"]:not([readonly])';
if(args.length>0) selector=args[0];
while(true){let ta=document.querySelector(selector);
if(ta){
if(!bAppend)ta.value=t;else ta.value+=t;
ta.dispatchEvent(new InputEvent('input'));ta.focus();
if(13===t.charCodeAt(t.length-1)){await sleep(100);
ta.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true}));}
return;}await sleep(400);}})()
