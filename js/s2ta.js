(async ()=>{let t=location.search;t=t.substring(t.indexOf('??')+2);t=decodeURI(t);
while(true){let ta=document.querySelector('textarea');if(ta){ta.value=t;ta.dispatchEvent(new InputEvent('input'));ta.focus();return;}await new Promise(resolve=>setTimeout(resolve,400));}})()
