/* RIFT ENGINE 002 — real-time procedural mechanical anomaly, THREE r164.
   Only PORTFOLIO; first PRISM FIELD renderer stays entirely separate. */
(()=>{
"use strict";
const $=q=>document.querySelector(q),section=$("#rift"),stage=$("#riftStage"),canvas=$("#riftCanvas");
if(!section||!stage||!canvas)return;
const state=$("#riftState"),pct=$("#riftProximity"),load=$("#riftLoading"),loadFill=$("#riftLoadFill");
const ui=$("#riftGalleryUi"),entry=$("#riftEnter"),back=$("#riftBack"),reset=$("#riftReset");
const work=$("#riftWorkLink"),home=$("#riftExperienceLink"),modal=$("#riftModal"),video=$("#riftVideoMount");
const modalClose=$("#riftModalClose"),modalTitle=$("#riftModalTitle"),modalDesc=$("#riftModalDescription"),modalLink=$("#riftOriginalLink");
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse=matchMedia("(pointer:coarse)").matches;
const lowPower=coarse||((navigator.deviceMemory||8)<=4)||((navigator.hardwareConcurrency||8)<=4);
const small=()=>section.clientWidth<700;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),mix=(a,b,v)=>a+(b-a)*v;
const damp=(a,b,k,dt)=>mix(a,b,1-Math.exp(-k*dt)),ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const rand=n=>{const v=Math.sin(n*127.1+1.92)*43758.5453;return v-Math.floor(v);};
const videos=[
 {title:"MOTION STUDY 01",desc:"Selected motion design video from GEN5ROM.",id:"yDnmJa0fTsw",url:"https://youtu.be/yDnmJa0fTsw"},
 {title:"MOTION STUDY 02",desc:"Selected editing and motion design video.",id:"I5RlqsDqhug",url:"https://youtu.be/I5RlqsDqhug"},
 {title:"SHORT FORM 01",desc:"GEN5ROM short-form editing sample.",id:"7uWk-hbkJkY",url:"https://youtube.com/shorts/7uWk-hbkJkY"},
 {title:"SHORT FORM 02",desc:"GEN5ROM short-form editing sample.",id:"1AOYe9wDsU4",url:"https://youtube.com/shorts/1AOYe9wDsU4"}
];
let THREE,renderer,scene,camera,raycaster,plane,mech,blades=[],rings=[],filaments=[],cursorCables=[];
let core,coreGlow,coreRing,shockRing,coreLight,cursorLight,bladed,orbital;
let fragments,fragNode,fragSeed,fragSize,points,pointsGeo,pointsBase,pointsMaterial;
let gallery,projectCards=[],projectTargets=[],galleryLamp,resizeObs;
let loaded=false,loading=false,visible=false,frame=0,prior=0,time=0,hot=0,shock=0,transition=0,slowFrames=0,qualityReduced=false;
let mode="anomaly",overProject=-1,modalOpen=false,previousFocus=null,oldOverflow="";
let pointerActive=false,touchDrag=false,pressOrigin=null,lastInfo=0,frameNumber=0;
const cursor={x:.72,y:.48,worldX:0,worldY:0},smooth={x:.72,y:.48,worldX:0,worldY:0};
const center=()=>({x:small()?.10:1.52,y:small()?-.55:-.07,z:small()?15.2:13.4});
const setState=txt=>{if(state&&state.textContent!==txt)state.textContent=txt;};
function progress(n){loadFill.style.width=clamp(n,0,100)+"%";}
function finishLoading(){progress(100);load.classList.add("done");setTimeout(()=>load.hidden=true,700);}
function showInfo(){
 const n=clamp(Math.round(hot*100),0,100);
 pct.textContent="PROXIMITY "+String(n).padStart(2,"0")+"%";
 if(mode==="rupturing")setState("RUPTURE SEQUENCE ACTIVE");
 else if(mode==="reforming")setState("MACHINE RECONSTRUCTING");
 else if(mode==="gallery")setState(overProject>=0?"PROJECT SIGNAL DETECTED":"SELECT A FLOATING PROJECT");
 else if(shock>.45)setState("SHOCKWAVE PROPAGATING");
 else if(n>68)setState("MAGNETIC DISTORTION");
 else if(n>20)setState("PROXIMITY DETECTED");
 else setState(coarse?"DRAG TO EXPLORE":"MOVE CURSOR · BEND REALITY");
}
function getPointer(x,y){
 const rect=section.getBoundingClientRect();
 if(rect.width<1||rect.height<1)return;
 cursor.x=clamp((x-rect.left)/rect.width,0,1);
 cursor.y=clamp((y-rect.top)/rect.height,0,1);
 pointerActive=true;
 if(loaded){
   raycaster.setFromCamera(new THREE.Vector2(cursor.x*2-1,1-cursor.y*2),camera);
   const out=new THREE.Vector3();
   if(raycaster.ray.intersectPlane(plane,out)){cursor.worldX=out.x;cursor.worldY=out.y;}
 }else{
   cursor.worldX=(cursor.x-.5)*10;
   cursor.worldY=(.5-cursor.y)*7;
 }
 request();
}
function hitCard(x,y){
 if(!loaded||mode!=="gallery")return -1;
 const rect=section.getBoundingClientRect();
 raycaster.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);
 const results=raycaster.intersectObjects(projectTargets,false);
 return results.length?results[0].object.userData.index:-1;
}
section.addEventListener("pointermove",e=>{
 if(e.pointerType==="touch"&&!touchDrag)return;
 if(e.target.closest("button,a,input"))return;
 getPointer(e.clientX,e.clientY);
 if(mode==="gallery")overProject=hitCard(e.clientX,e.clientY);
},{passive:true});
section.addEventListener("pointerenter",e=>{if(e.pointerType!=="touch")getPointer(e.clientX,e.clientY);},{passive:true});
section.addEventListener("pointerleave",()=>{pointerActive=false;overProject=-1;request();},{passive:true});
section.addEventListener("pointerdown",e=>{
 if(e.target.closest("button,a,input"))return;
 touchDrag=e.pointerType==="touch";pressOrigin={x:e.clientX,y:e.clientY};
 getPointer(e.clientX,e.clientY);
},{passive:true});
section.addEventListener("pointerup",e=>{
 if(e.target.closest("button,a,input"))return;
 if(e.pointerType==="touch")touchDrag=false;
 const start=pressOrigin;pressOrigin=null;
 if(!start||Math.hypot(start.x-e.clientX,start.y-e.clientY)>15)return;
 if(mode==="gallery"){const i=hitCard(e.clientX,e.clientY);if(i>=0)openProject(i);return;}
 if(mode!=="anomaly")return;
 const loc=center(),d=Math.hypot(cursor.worldX-loc.x,cursor.worldY-loc.y);
 if(d<1.0)openRift();else{shock=1;request();}
},{passive:true});
section.addEventListener("pointercancel",()=>{touchDrag=false;pressOrigin=null;},{passive:true});
section.addEventListener("touchmove",e=>{
 if(e.touches.length&&!e.target.closest("button,a,input")){
  const p=e.touches[0];getPointer(p.clientX,p.clientY);
 }
},{passive:true});
function galleryVisible(v){
 ui.hidden=!v;
 if(v)requestAnimationFrame(()=>ui.classList.add("visible"));
 else ui.classList.remove("visible");
}
function openRift(){
 if(mode!=="anomaly")return;
 if(reduced||!loaded){
  mode="gallery";transition=1;galleryVisible(true);
  $("#riftPageIndex").textContent="03 / 03";showInfo();return;
 }
 mode="rupturing";shock=1;
 entry.disabled=true;entry.textContent="OPENING THE RIFT…";
 request();
}
function returnAnomaly(){
 if(mode==="anomaly")return;
 if(modalOpen)closeProject();
 galleryVisible(false);overProject=-1;
 if(reduced||!loaded){mode="anomaly";transition=0;rearmed();showInfo();return;}
 mode="reforming";request();
}
function rearmed(){
 entry.disabled=false;entry.innerHTML='<span class="rift-enter-symbol" aria-hidden="true">✳</span> OPEN THE RIFT <span aria-hidden="true">↗</span>';
 $("#riftPageIndex").textContent="02 / 03";
}
entry.addEventListener("click",openRift);
work.addEventListener("click",openRift);
back.addEventListener("click",returnAnomaly);
reset.addEventListener("click",()=>{if(mode!=="anomaly")returnAnomaly();else{shock=0;pointerActive=false;request();}});
home.addEventListener("click",e=>{if(mode!=="anomaly"){e.preventDefault();returnAnomaly();}});
$("#riftProjectNav").addEventListener("click",e=>{
 const b=e.target.closest("[data-project]");if(b)openProject(Number(b.dataset.project));
});
function openProject(i){
 if(mode!=="gallery"||!videos[i]||modalOpen)return;
 const p=videos[i];modalTitle.textContent=p.title;modalDesc.textContent=p.desc;modalLink.href=p.url;
 previousFocus=document.activeElement;oldOverflow=document.body.style.overflow;
 document.body.style.overflow="hidden";
 const iframe=document.createElement("iframe");
 iframe.src="https://www.youtube-nocookie.com/embed/"+p.id+"?autoplay=1&rel=0&playsinline=1";
 iframe.allowFullscreen=true;iframe.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";
 iframe.title=p.title+" GEN5ROM";iframe.referrerPolicy="strict-origin-when-cross-origin";
 video.replaceChildren(iframe);modal.hidden=false;modalOpen=true;
 document.body.classList.add("rift-modal-open");
 modalClose.focus({preventScroll:true});
 if(frame){cancelAnimationFrame(frame);frame=0;}
}
function closeProject(){
 if(!modalOpen)return;
 video.replaceChildren();modal.hidden=true;modalOpen=false;
 document.body.classList.remove("rift-modal-open");document.body.style.overflow=oldOverflow;
 if(previousFocus?.focus)previousFocus.focus({preventScroll:true});
 request();
}
modalClose.addEventListener("click",closeProject);
modal.querySelector("[data-rift-close]").addEventListener("click",closeProject);
document.addEventListener("keydown",e=>{
 if(modalOpen){
  if(e.key==="Escape"){e.preventDefault();closeProject();}
  if(e.key==="Tab"){
   if(e.shiftKey&&document.activeElement===modalClose){e.preventDefault();modalLink.focus();}
   else if(!e.shiftKey&&document.activeElement===modalLink){e.preventDefault();modalClose.focus();}
  }
 }else if(e.key==="Escape"&&mode==="gallery")returnAnomaly();
});
function gradientTexture(){
 const c=document.createElement("canvas");c.width=c.height=128;
 const x=c.getContext("2d"),g=x.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,"#fff4eb");g.addColorStop(.13,"rgba(255,145,147,.95)");
 g.addColorStop(.34,"rgba(255,24,56,.56)");g.addColorStop(.67,"rgba(252,3,42,.09)");g.addColorStop(1,"rgba(255,0,0,0)");
 x.fillStyle=g;x.fillRect(0,0,128,128);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function createProfile(i){
 const length=2.10+rand(i+4)*.85,sweep=(rand(i+7)-.5)*.43,width=.26*(.8+rand(i+19)*.48);
 const s=new THREE.Shape();
 s.moveTo(-.14,.38);s.lineTo(-width,.81);
 s.bezierCurveTo(-width*1.4,1.15,-width*.6,1.48,-width*1.1,1.75);
 s.lineTo(-width*1.52+sweep,length*.84);s.lineTo(-width*.12+sweep,length);
 s.bezierCurveTo(width*.3+sweep,length*.92,width*1.15,length*.75,width*.6,length*.60);
 s.lineTo(width*.29,1.39);
 s.bezierCurveTo(width*1.45,1.15,width*1.11,.90,width*.64,.67);
 s.lineTo(.15,.39);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{steps:1,depth:.24,bevelEnabled:true,bevelThickness:.045,bevelSize:.041,bevelSegments:3,curveSegments:8});
 g.translate(0,0,-.12);g.computeVertexNormals();
 return {g,length,sweep};
}
function buildMachine(){
 mech=new THREE.Group();scene.add(mech);
 bladed=new THREE.Group();orbital=new THREE.Group();mech.add(orbital,bladed);
 const materials=[
   new THREE.MeshPhysicalMaterial({color:0x24252b,metalness:.81,roughness:.26,clearcoat:.87,clearcoatRoughness:.11}),
   new THREE.MeshPhysicalMaterial({color:0x33353b,metalness:.76,roughness:.33,clearcoat:.85,clearcoatRoughness:.15}),
   new THREE.MeshPhysicalMaterial({color:0x17191d,metalness:.77,roughness:.29,clearcoat:.86,clearcoatRoughness:.11})
 ];
 const redLine=new THREE.LineBasicMaterial({color:0xff2840,transparent:true,opacity:.57,depthWrite:false,blending:THREE.AdditiveBlending});
 const n=lowPower?16:22;
 for(let i=0;i<n;i++){
  const a=i*Math.PI*2/n+rand(i+51)*.21,profile=createProfile(i);
  const group=new THREE.Group();
  group.add(new THREE.Mesh(profile.g,materials[i%3]));
  const pts=[
   new THREE.Vector3(-.06,.53,.183),new THREE.Vector3(-.11,1.07,.184),
   new THREE.Vector3(-.15,1.53,.186),new THREE.Vector3(profile.sweep-.13,profile.length*.82,.17),
   new THREE.Vector3(profile.sweep-.05,profile.length*.96,.17)];
  const line=new THREE.CatmullRomCurve3(pts);
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line.getPoints(27)),redLine));
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.066,profile.length*.4,.045),
    new THREE.MeshStandardMaterial({color:0x0a0b10,metalness:.72,roughness:.40}));
  strip.position.set(.075,profile.length*.43,.165);group.add(strip);
  // Physically modeled layered armor teeth: individually beveled facets, not texture-only detail.
  const armorMat=materials[(i+1)%3];
  const armorGeometry=new THREE.BoxGeometry(.20,.23,.105,1,1,1);
  for(let tooth=0;tooth<3;tooth++){
    const plate=new THREE.Mesh(armorGeometry,armorMat);
    const y=.84+tooth*(profile.length-.98)/3;
    plate.position.set(-.038+(tooth%2)*.07,y,.18+(tooth%2)*.025);
    plate.rotation.z=.19*(tooth%2?1:-1)+(rand(i+tooth+13)-.5)*.13;
    plate.scale.set(1+.2*rand(i+tooth),1.0+.4*rand(i+tooth+77),1);
    group.add(plate);
  }
  group.rotation.z=a;group.scale.set(.86+rand(i+20)*.28,.81+rand(i+5)*.40,1);
  group.position.z=(i%7-3)*.11;bladed.add(group);
  blades.push({group,a,seed:i,length:profile.length*group.scale.y,z:group.position.z,v:0,ext:0,twist:0,tilt:0});
 }
 for(let i=0;i<(lowPower?9:15);i++){
  const rad=2.7+i%5*.23,angle=.20+rand(i+24)*.49;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(rad,.027+(i%3)*.014,6,30,angle),
     new THREE.MeshPhysicalMaterial({color:i%3===0?0x545860:0x25272e,metalness:.84,roughness:.27,clearcoat:.65}));
  const base=i*Math.PI*2/15+rand(i+71)*.21;
  ring.rotation.z=base;ring.position.z=-.42-(i%4)*.23;
  orbital.add(ring);rings.push({ring,base,i});
 }
 const ringEdgeMaterial=new THREE.MeshBasicMaterial({color:0xff1939,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false});
 for(let i=0;i<9;i++){
  const arc=new THREE.Mesh(new THREE.TorusGeometry(1.68+i%5*.40,.008,4,20,.15+rand(i+49)*.25),ringEdgeMaterial);
  arc.rotation.z=i*2.4;arc.position.z=.18-i%3*.13;orbital.add(arc);
 }
 const material=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uHot:{value:0},uOpen:{value:0}},
  vertexShader:[
   "varying vec3 vn;varying vec3 vp;varying vec2 uv0;",
   "void main(){vn=normalize(normalMatrix*normal);vp=position;uv0=uv;",
   "gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
  ].join("\n"),
  fragmentShader:[
   "uniform float uTime;uniform float uHot;uniform float uOpen;",
   "varying vec3 vn;varying vec3 vp;varying vec2 uv0;",
   "float h(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}",
   "float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
   "return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),",
   "mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}",
   "void main(){float t=uTime*.6;float v=n(vp*5.+vec3(t*.4,-t*.2,t*.3));",
   "v+=.46*n(vp*11.+t);float arc=sin(uv0.x*27.+t*6.+sin(uv0.y*19.))* .06;",
   "float hot=smoothstep(.48,1.06,v+arc);",
   "vec3 dark=vec3(.16,.002,.017),red=vec3(1.,.012,.07),flame=vec3(1.,.26,.16);",
   "vec3 color=mix(dark,red,hot);color=mix(color,flame,pow(hot,4.)*.67);",
   "color+=vec3(.75,.04,.08)*pow(1.-abs(normalize(vn).z),2.6)*.7;",
   "color*=1.+uHot*.8+uOpen*1.1;gl_FragColor=vec4(color,1.);}"
  ].join("\n")
 });
 core=new THREE.Mesh(new THREE.IcosahedronGeometry(.60,5),material);mech.add(core);
 coreGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:gradientTexture(),color:0xff4054,transparent:true,opacity:.61,blending:THREE.AdditiveBlending,depthWrite:false}));
 coreGlow.scale.set(3.7,3.7,1);coreGlow.position.z=-.08;mech.add(coreGlow);
 coreRing=new THREE.Mesh(new THREE.TorusGeometry(.85,.012,6,100),new THREE.MeshBasicMaterial({color:0xff1838,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending}));
 mech.add(coreRing);
 // Independent mechanical hub clips and recessed retention bolts.
 const hubMetal=new THREE.MeshPhysicalMaterial({color:0x3c3d44,metalness:.87,roughness:.28,clearcoat:.82});
 const clipGeo=new THREE.BoxGeometry(.28,.11,.22);
 const boltGeo=new THREE.CylinderGeometry(.032,.032,.07,7);
 for(let i=0;i<12;i++){
   const angle=i*Math.PI/6;
   const clip=new THREE.Mesh(clipGeo,hubMetal);
   clip.position.set(Math.cos(angle)*.86,Math.sin(angle)*.86,.09);
   clip.rotation.z=angle;
   mech.add(clip);
   const bolt=new THREE.Mesh(boltGeo,hubMetal);
   bolt.rotation.x=Math.PI/2;
   bolt.position.set(Math.cos(angle)*.85,Math.sin(angle)*.85,.23);
   mech.add(bolt);
 }
 shockRing=new THREE.Mesh(new THREE.TorusGeometry(1,.008,4,90),
   new THREE.MeshBasicMaterial({color:0xff526b,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
 shockRing.position.z=.26;mech.add(shockRing);
 const lineMat=new THREE.LineBasicMaterial({color:0xff3650,opacity:.42,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 for(let i=0;i<(coarse?7:13);i++){
  const count=25,arr=new Float32Array(count*3),geom=new THREE.BufferGeometry();
  geom.setAttribute("position",new THREE.BufferAttribute(arr,3).setUsage(THREE.DynamicDrawUsage));
  const line=new THREE.Line(geom,lineMat);mech.add(line);
  filaments.push({line,arr,count,i,ang:i*Math.PI*2/13+rand(i+43),phase:rand(i+2)*6});
 }
 const pointerMat=new THREE.LineBasicMaterial({color:0xff93a0,opacity:0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 for(let i=0;i<2;i++){
  const arr=new Float32Array(24*3),g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.BufferAttribute(arr,3).setUsage(THREE.DynamicDrawUsage));
  const line=new THREE.Line(g,pointerMat);mech.add(line);cursorCables.push({line,arr,i});
 }
}
function buildDebris(){
 const count=lowPower?160:480;
 fragSeed=new Float32Array(count*3);fragSize=new Float32Array(count);
 fragNode=new THREE.Object3D();
 fragments=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0x303037,metalness:.7,roughness:.39,flatShading:true}),count);
 fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);fragments.frustumCulled=false;mech.add(fragments);
 for(let i=0;i<count;i++){
  const a=rand(i+3)*Math.PI*2,r=1.5+Math.sqrt(rand(i+7))*5;
  fragSeed[i*3]=Math.cos(a)*r;fragSeed[i*3+1]=Math.sin(a)*r*.82;
  fragSeed[i*3+2]=(rand(i+34)-.5)*4;
  fragSize[i]=.018+Math.pow(rand(i+56),2)*.145;
 }
 const n=lowPower?750:2640;
 pointsBase=new Float32Array(n*3);
 const pos=new Float32Array(n*3);
 for(let i=0;i<n;i++){
  const a=rand(i+9)*Math.PI*2,r=1.4+Math.sqrt(rand(i+73))*7,j=i*3;
  pointsBase[j]=Math.cos(a)*r;pointsBase[j+1]=Math.sin(a)*r*.8;
  pointsBase[j+2]=(rand(i+49)-.5)*6.5;
 }
 pos.set(pointsBase);
 pointsGeo=new THREE.BufferGeometry();
 pointsGeo.setAttribute("position",new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
 pointsMaterial=new THREE.PointsMaterial({size:coarse?.023:.018,color:0xee6578,opacity:.59,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
 points=new THREE.Points(pointsGeo,pointsMaterial);mech.add(points);
}
function poster(i){
 const c=document.createElement("canvas");c.width=512;c.height=640;
 const g=c.getContext("2d"),bg=g.createLinearGradient(0,0,512,640);
 bg.addColorStop(0,"#161318");bg.addColorStop(.58,i%2?"#221018":"#13141b");bg.addColorStop(1,"#09090a");
 g.fillStyle=bg;g.fillRect(0,0,512,640);
 const halo=g.createRadialGradient(256,270,15,256,270,260);
 halo.addColorStop(0,"rgba(255,49,77,.41)");halo.addColorStop(1,"rgba(255,3,35,0)");
 g.fillStyle=halo;g.fillRect(0,0,512,640);
 g.save();g.translate(256,276);
 for(let j=0;j<12;j++){
  g.save();g.rotate(j*Math.PI/6);
  g.strokeStyle=j%2?"#ff3150":"#4d4e58";g.lineWidth=2;
  g.beginPath();g.moveTo(-34,-31);g.lineTo(21,-125-j%3*19);g.lineTo(51,-58);g.stroke();g.restore();
 }
 g.restore();
 g.strokeStyle="rgba(255,255,255,.13)";g.strokeRect(20,20,472,600);
 g.fillStyle="#ff3854";g.font="600 19px monospace";g.fillText("GEN5ROM  /  00"+(i+1),40,61);
 g.fillStyle="#f5f3f5";g.font="bold 32px sans-serif";
 const words=videos[i].title.split(" ");
 g.fillText(words.slice(0,-1).join(" "),39,525);g.fillText(words.at(-1),39,563);
 g.fillStyle="#a6a1a7";g.font="15px monospace";g.fillText("VIDEO SAMPLE  /  OPEN ↗",39,602);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function buildGallery(){
 gallery=new THREE.Group();gallery.visible=false;gallery.position.z=-2;scene.add(gallery);
 const m=small(),coords=m?[[-1.27,1.46],[1.27,1.46],[-1.27,-1.2],[1.27,-1.2]]:[[-3.38,-.12],[-1.14,.26],[1.14,-.06],[3.38,.24]];
 for(let i=0;i<4;i++){
  const group=new THREE.Group(),w=m?2.05:1.88,h=m?2.50:2.55;
  const shell=new THREE.Mesh(new THREE.BoxGeometry(w,h,.14),new THREE.MeshPhysicalMaterial({color:0x2a292d,metalness:.76,roughness:.31,clearcoat:.75}));
  shell.position.z=-.05;group.add(shell);
  const front=new THREE.Mesh(new THREE.PlaneGeometry(w-.14,h-.16),new THREE.MeshBasicMaterial({map:poster(i),toneMapped:false}));
  front.position.z=.036;front.userData.index=i;group.add(front);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.015,h+.015,.16)),
     new THREE.LineBasicMaterial({color:0xff294b,transparent:true,opacity:.36}));
  group.add(edge);
  const x=coords[i][0],y=coords[i][1],z=-2+i%2*.2;
  group.position.set(x,y,z);group.rotation.y=x*.03;gallery.add(group);
  projectCards.push({group,front,x,y,z,hover:0});
  projectTargets.push(front);
 }
 galleryLamp=new THREE.PointLight(0xff1838,20,20,1.2);galleryLamp.position.set(0,0,4);gallery.add(galleryLamp);
}
function fit(){
 if(!renderer||!camera)return;
 const w=Math.max(1,section.clientWidth),h=Math.max(1,section.clientHeight);
 renderer.setSize(w,h,false);
 camera.aspect=w/h;camera.fov=w<700?42:38;camera.updateProjectionMatrix();
 const c=center();if(mech)mech.position.set(c.x,c.y,0);
 if(projectCards.length){
   const mobile=small();
   const positions=mobile?[[-1.27,1.46],[1.27,1.46],[-1.27,-1.20],[1.27,-1.20]]:[[-3.38,-.12],[-1.14,.26],[1.14,-.06],[3.38,.24]];
   projectCards.forEach((p,i)=>{
     p.x=positions[i][0];p.y=positions[i][1];p.group.position.x=p.x;p.group.position.y=p.y;
   });
 }
}
async function begin(){
 if(loading||loaded||reduced)return;
 loading=true;progress(12);
 try{
  const gl=canvas.getContext("webgl2",{alpha:true,antialias:!coarse,powerPreference:coarse?"low-power":"high-performance"});
  if(!gl)throw Error("WebGL2 unavailable");
  progress(29);
  THREE=await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
  renderer=new THREE.WebGLRenderer({canvas,context:gl,alpha:true,antialias:!coarse,powerPreference:coarse?"low-power":"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,lowPower?1.12:1.65));
  renderer.setClearColor(0x050506,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.31;
  progress(45);
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x050506,.015);
  camera=new THREE.PerspectiveCamera(38,1,.1,90);
  camera.position.set(0,0,center().z);camera.lookAt(0,0,0);
  scene.add(new THREE.AmbientLight(0x9097a6,.33));
  scene.add(new THREE.HemisphereLight(0xa8aab4,0x080709,.44));
  const key=new THREE.DirectionalLight(0xf2f1f3,3.15);key.position.set(-4.5,6,9);scene.add(key);
  const rim=new THREE.DirectionalLight(0x9a9fae,2.4);rim.position.set(5,-3,7);scene.add(rim);
  coreLight=new THREE.PointLight(0xff1838,85,22,1.2);coreLight.position.set(center().x,center().y,3);scene.add(coreLight);
  cursorLight=new THREE.PointLight(0xff7382,30,12,1.5);cursorLight.position.set(3,1,4);scene.add(cursorLight);
  buildMachine();progress(63);buildDebris();progress(76);buildGallery();
  fit();raycaster=new THREE.Raycaster();plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
  if("ResizeObserver" in window){resizeObs=new ResizeObserver(fit);resizeObs.observe(section);}
  else window.addEventListener("resize",fit,{passive:true});
  loaded=true;stage.classList.add("ready");finishLoading();request();
  canvas.addEventListener("webglcontextlost",event=>{
    event.preventDefault();
    loaded=false;stage.classList.remove("ready");
    setState("GRAPHICS CONTEXT LOST / FALLBACK ACTIVE");
    if(frame)cancelAnimationFrame(frame);frame=0;
  },{passive:false});
 }catch(e){load.textContent="INTERACTIVE PREVIEW / WEBGL UNAVAILABLE";setState("3D PREVIEW MODE");console.warn("Rift Engine fallback:",e.message);}
}
function request(){
 if(!loaded||!visible||modalOpen||reduced||document.hidden)return;
 if(!frame){prior=0;frame=requestAnimationFrame(tick);}
}
function spring(p,target,dt){
 p.v+=(target-p.ext)*27*dt;
 p.v*=Math.exp(-9.5*dt);
 p.ext+=p.v*dt;
}
function updateEnergy(openFactor){
 const x=smooth.worldX-center().x,y=smooth.worldY-center().y;
 for(const f of filaments){
  const blade=blades[(f.i*3)%blades.length];
  const rad=2.1+blade.ext*.63+f.i%5*.23;
  const endX=Math.cos(blade.a)*rad,endY=Math.sin(blade.a)*rad;
  for(let j=0;j<f.count;j++){
   const t=j/(f.count-1),s=Math.sin(t*Math.PI),k=j*3;
   f.arr[k]=endX*t+Math.sin(time*1.7+t*10+f.phase)*s*(.13+hot*.15);
   f.arr[k+1]=endY*t+Math.cos(time*1.4+t*12+f.phase)*s*(.15+hot*.13);
   f.arr[k+2]=.18+s*Math.cos(time+t*13+f.i)*.2;
  }
  f.line.geometry.attributes.position.needsUpdate=true;
 }
 for(const f of cursorCables){
  f.line.material.opacity=pointerActive?hot*.65:0;
  for(let j=0;j<24;j++){
   const u=j/23,s=Math.sin(u*Math.PI),k=j*3;
   f.arr[k]=x*u+s*Math.sin(time*5+u*15+f.i)*.11;
   f.arr[k+1]=y*u+s*Math.cos(time*4+u*13+f.i)*.11;
   f.arr[k+2]=.12+s*(.17+hot*.29)+f.i*.04;
  }
  f.line.geometry.attributes.position.needsUpdate=true;
 }
}
function updateFragments(openFactor){
 const len=fragSize.length,cx=smooth.worldX-center().x,cy=smooth.worldY-center().y;
 for(let i=0;i<len;i++){
  const j=i*3,angle=time*(.025+rand(i)*.14)*(i%2?1:-1);
  const cs=Math.cos(angle),sn=Math.sin(angle),x=fragSeed[j],y=fragSeed[j+1];
  const ax=x*cs-y*sn,ay=x*sn+y*cs;
  const d=Math.hypot(ax-cx,ay-cy);
  const f=pointerActive?Math.exp(-d*d/6)*hot:0;
  fragNode.position.set(ax+ax*.14*openFactor,ay+ay*.14*openFactor,fragSeed[j+2]+f*.4+openFactor*.31);
  fragNode.scale.setScalar(fragSize[i]*(1+f*.5));
  fragNode.rotation.set(time*.14+i*.44,time*.13+i*.3,time*.20+i*.23);
  fragNode.updateMatrix();fragments.setMatrixAt(i,fragNode.matrix);
 }
 fragments.instanceMatrix.needsUpdate=true;
 const attr=pointsGeo.getAttribute("position"),p=attr.array;
 for(let i=0;i<p.length/3;i++){
  const j=i*3,x=pointsBase[j],y=pointsBase[j+1],d=Math.hypot(x-cx,y-cy);
  const attract=pointerActive?Math.exp(-d*d/7)*hot:0;
  p[j]=x+Math.sin(time*.27+i*.17)*.045+(x-cx)*attract*.042;
  p[j+1]=y+Math.cos(time*.24+i*.31)*.055+(y-cy)*attract*.042;
  p[j+2]=pointsBase[j+2]+Math.sin(time*.29+i*.23)*.07+openFactor*.14;
 }
 attr.needsUpdate=true;
}
function tick(now){
 frame=0;if(!loaded||!visible||modalOpen||document.hidden)return;
 const elapsedSeconds=prior?clamp((now-prior)/1000,.001,.45):.016;
 const dt=Math.min(elapsedSeconds,.05);
 prior=now;time+=dt;frameNumber++;
 // Transitions use actual wall-clock delta, while physical spring integration is clamped.
 if(elapsedSeconds>.085)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
 if(slowFrames>=7&&!qualityReduced){
   qualityReduced=true;
   renderer.setPixelRatio(Math.min(1,devicePixelRatio||1));
   renderer.setSize(Math.max(1,section.clientWidth),Math.max(1,section.clientHeight),false);
 }
 const origin=center();
 smooth.x=damp(smooth.x,pointerActive?cursor.x:.73,4.4,dt);
 smooth.y=damp(smooth.y,pointerActive?cursor.y:.48,4.4,dt);
 smooth.worldX=damp(smooth.worldX,pointerActive?cursor.worldX:origin.x,5.3,dt);
 smooth.worldY=damp(smooth.worldY,pointerActive?cursor.worldY:origin.y,5.3,dt);
 const near=pointerActive?Math.pow(clamp(1-Math.hypot(smooth.worldX-origin.x,smooth.worldY-origin.y)/4.8,0,1),1.25):0;
 hot=damp(hot,mode==="anomaly"?near+shock*.18:.05,4.2,dt);shock=Math.max(0,shock-dt*.9);
 if(mode==="rupturing"){transition=clamp(transition+elapsedSeconds/2.2,0,1);if(transition===1){
  mode="gallery";galleryVisible(true);$("#riftPageIndex").textContent="03 / 03";
 }}
 else if(mode==="reforming"){transition=clamp(transition-elapsedSeconds/1.65,0,1);if(transition===0){
   mode="anomaly";rearmed();
 }}
 const factor=ease(transition),mx=smooth.worldX-origin.x,my=smooth.worldY-origin.y;
 for(const p of blades){
  const tx=Math.cos(p.a)*p.length*.74,ty=Math.sin(p.a)*p.length*.74;
  const dist=Math.hypot(tx-mx,ty-my);
  const field=pointerActive&&mode==="anomaly"?Math.exp(-dist*dist/3.4)*hot:0;
  const amount=field*1.25+factor*(1.46+rand(p.seed+20)*.66);
  spring(p,amount,dt);
  p.twist=damp(p.twist,Math.sin(p.seed*.77+time*.52)*.035+field*(.19+.1*rand(p.seed)),5.2,dt);
  p.tilt=damp(p.tilt,field*.37+factor*.65,5.0,dt);
  p.group.position.set(Math.cos(p.a)*p.ext,Math.sin(p.a)*p.ext,p.z+field*.25+factor*(rand(p.seed+12)-.5)*2.1);
  p.group.rotation.set(p.tilt,field*mx*.06+factor*.18*Math.sin(p.seed),p.a+p.twist+factor*.36*Math.cos(p.seed));
 }
 orbital.rotation.z=Math.sin(time*.12)*.018+hot*.02;orbital.rotation.y=(smooth.x-.5)*.09;
 for(const r of rings)r.ring.rotation.z=r.base+Math.sin(time*(.14+r.i%3*.06)+r.i)*.061+hot*.08;
 core.material.uniforms.uTime.value=time;
 core.material.uniforms.uHot.value=hot;
 core.material.uniforms.uOpen.value=factor;
 core.scale.setScalar((1+Math.sin(time*4.5)*.045+hot*.17)*(1+factor*.65));
 core.position.x=damp(core.position.x,mx*hot*.10,3.8,dt);
 core.position.y=damp(core.position.y,my*hot*.10,3.8,dt);
 coreGlow.position.set(core.position.x,core.position.y,-.10);
 coreGlow.scale.set(3.7+hot*.5+factor*2,3.7+hot*.5+factor*2,1);
 coreGlow.material.opacity=.49+hot*.23+shock*.10+factor*.20;
 coreRing.rotation.z=time*.1;coreRing.material.opacity=.6+hot*.32;
 if(shockRing){
   shockRing.scale.setScalar(1+(1-shock)*6.5);
   shockRing.material.opacity=.46*shock;
   shockRing.visible=shock>.003;
 }
 const scale=(small()?.82:1)*(1-factor*.74);
 mech.scale.setScalar(scale);mech.position.set(origin.x,origin.y,-factor*.5);
 coreLight.position.set(origin.x+core.position.x,origin.y+core.position.y,3.5);
 coreLight.intensity=65+hot*95+factor*115;
 cursorLight.position.set(smooth.worldX,smooth.worldY,4);
 cursorLight.intensity=25+hot*70;
 updateEnergy(factor);
 if(frameNumber%2===0||coarse)updateFragments(factor);
 gallery.visible=factor>.37;gallery.position.z=-2+factor*2;
 gallery.scale.setScalar(Math.max(.001,factor));
 for(let i=0;i<projectCards.length;i++){
  const p=projectCards[i],v=mode==="gallery"&&overProject===i?1:0;
  p.hover=damp(p.hover,v,6.2,dt);
  p.group.position.z=p.z+p.hover*.75;
  p.group.rotation.y=p.x*.035+(smooth.x-.5)*.10+p.hover*(p.x>0?-.12:.12);
  p.group.rotation.x=(smooth.y-.5)*-.07;p.group.scale.setScalar(1+p.hover*.075);
 }
 const z=(mode==="gallery"?(small()?10.6:11.3):origin.z-(mode==="rupturing"||mode==="reforming"?factor*5.6:0));
 camera.position.x=damp(camera.position.x,(smooth.x-.5)*.34+Math.sin(time*.14)*.04,2.7,dt);
 camera.position.y=damp(camera.position.y,(.5-smooth.y)*.21,2.7,dt);
 camera.position.z=damp(camera.position.z,z,mode==="rupturing"?4:2.7,dt);
 camera.lookAt(0,0,0);
 renderer.render(scene,camera);
 if(now-lastInfo>130){showInfo();lastInfo=now;}
 frame=requestAnimationFrame(tick);
}
function setVisible(v){
 visible=v;if(v){if(!loading&&!reduced)begin();else request();}
 else if(frame){cancelAnimationFrame(frame);frame=0;prior=0;}
}
if("IntersectionObserver" in window)new IntersectionObserver(es=>es.forEach(e=>setVisible(e.isIntersecting)),{rootMargin:"150px 0px",threshold:0}).observe(section);
else setVisible(true);
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;prior=0;}
 else request();
},{passive:true});
if(reduced){finishLoading();setState("LOW-MOTION PREVIEW");}
})();
