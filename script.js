/* PRISM FIELD — interface controls. Render content never depends on the 3D engine. */
(()=>{"use strict";
 const $=s=>document.querySelector(s);
 const btn=$("#activateBtn"),palette=$("#paletteBtn"),slider=$("#strengthSlider"),pause=$("#pauseBtn");
 const fs=$("#fullscreenBtn"),reel=$("#reelBtn");
 const modal=$("#videoModal"),video=$("#modalVideo"),close=$("#closeModal");
 let previousFocus=null,previousOverflow="";
 const api=()=>window.PRISM_FIELD||null;
 btn?.addEventListener("click",()=>{
   const engine=api();
   if(engine)engine.pulse();else document.dispatchEvent(new Event("prism:pulse"));
   btn.blur();
 });
 palette?.addEventListener("click",()=>{api()?.changePalette();});
 slider?.addEventListener("input",()=>{api()?.setStrength(Number(slider.value)/100);});
 pause?.addEventListener("click",()=>{
   const result=api()?.togglePause();
   if(typeof result==="boolean"){
     pause.setAttribute("aria-pressed",String(result));
     pause.setAttribute("aria-label",result?"Resume motion":"Pause motion");
     $("#pauseIcon").textContent=result?"▶":"Ⅱ";
   }
 });
 fs?.addEventListener("click",async()=>{
   try{
     if(document.fullscreenElement)await document.exitFullscreen();
     else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
   }catch(e){console.warn("Fullscreen not available",e);}
 });
 const videoId="yDnmJa0fTsw";
 function openVideo(){
   if(!modal||!video)return;
   previousFocus=document.activeElement;
   previousOverflow=document.body.style.overflow;
   document.body.style.overflow="hidden";
   video.replaceChildren();
   const iframe=document.createElement("iframe");
   iframe.src="https://www.youtube-nocookie.com/embed/"+videoId+"?autoplay=1&rel=0&playsinline=1";
   iframe.title="Selected GEN5ROM motion graphics work";
   iframe.allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen";
   iframe.allowFullscreen=true;iframe.referrerPolicy="strict-origin-when-cross-origin";
   video.appendChild(iframe);
   modal.hidden=false;
   close?.focus({preventScroll:true});
   api()?.setModalOpen(true);
 }
 function closeVideo(){
   if(!modal||modal.hidden)return;
   modal.hidden=true;video.replaceChildren();
   document.body.style.overflow=previousOverflow;
   api()?.setModalOpen(false);
   if(previousFocus&&previousFocus.focus)previousFocus.focus({preventScroll:true});
 }
 reel?.addEventListener("click",openVideo);
 close?.addEventListener("click",closeVideo);
 modal?.addEventListener("pointerdown",e=>{if(e.target.hasAttribute("data-close"))closeVideo();});
 document.addEventListener("keydown",e=>{
   if(modal?.hidden!==false)return;
   if(e.key==="Escape"){e.preventDefault();closeVideo();return;}
   if(e.key!=="Tab")return;
   const focusable=Array.from(modal.querySelectorAll("button,a[href]")).filter(el=>el.getClientRects().length);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });
 document.addEventListener("fullscreenchange",()=>{
   fs?.setAttribute("aria-label",document.fullscreenElement?"Exit fullscreen":"Toggle fullscreen");
 });
})();
