(async ()=>{let t=location.href;let i=t.indexOf('uweb=');
let sleep=(ms)=>{return new Promise(resolve=>setTimeout(resolve,ms))};
let bAppend = false;
if(i>1){let w=t.charCodeAt(i-1)-48;if(w>=0&&w<=9){w=w*100+(t.charCodeAt(i-2)-48)*1000;await sleep(w);
if(65===t.charCodeAt(i-3))bAppend=true;}}
t=decodeURI(t.substring(i+5));
while(true){let ta=document.querySelector('[contenteditable="true"]');
if(ta){
if(!bAppend)ta.value=t;else ta.value+=t;
ta.dispatchEvent(new InputEvent('input'));ta.focus();return;}await sleep(400);}})()
