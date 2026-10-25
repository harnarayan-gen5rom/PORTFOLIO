/* PRISM / FIELD — standalone kinetic diamond field.
   Optimized Three.js instancing. No React, no build step, no dependencies except
   an on-demand, version-pinned Three.js ESM import. Static HTML never depends on it.
   Connected exclusively to harnarayan-gen5rom/PORTFOLIO. */
(()=>{
"use strict";
const experience=document.getElementById("experience");
const stage=document.getElementById("sceneStage");
const canvas=document.getElementById("sceneCanvas");
const fallback=document.getElementById("sceneFallback");
const status=document.getElementById("sceneStatus");
const substatus=document.getElementById("sceneSubstatus");
const energyFill=document.getElementById("energyFill");
const energyValue=document.getElementById("energyValue");
const paletteName=document.getElementById("paletteName");
const indicator=document.getElementById("colorIndicator");
if(!experience||!stage||!canvas||!fallback)return;

const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse=matchMedia("(pointer:coarse)").matches;
const palettes=[
 {name:"IRIS / 01",surface:0x383352,shimmer:0xe5b8ff,secondary:0x83c9ff,rim:0xa47afc,emissive:0x2c133c,glow:"#e78eff",glow2:"#8c76ff",glow3:"#82cbff"},
 {name:"VOLT / 02",surface:0x293d38,shimmer:0xe0ffad,secondary:0x7bf5e1,rim:0x9cf589,emissive:0x132e20,glow:"#c5ff82",glow2:"#81dfae",glow3:"#81e6ef"},
 {name:"SOLAR / 03",surface:0x493240,shimmer:0xffcfac,secondary:0xff71b3,rim:0xffb467,emissive:0x3c142d,glow:"#ffc48c",glow2:"#ff77b2",glow3:"#ae7fff"}
];
let paletteIndex=0,strength=.67,paused=false,modalOpen=false,sceneVisible=true;
let T,renderer,scene,camera,cluster,mesh,inlay,material,inlayMaterial,geometry,inlayGeo,lightA,lightB,lightC;
let sparks,sparkGeo,sparkMaterial,sparkOrigins,sparkPhases;
let loaded=false,loading=false,raf=0,previous=0,t=0,energy=.07,burst=0,burstTime=0,lastRead=0,resizeObserver;
let rows=0,cols=0,count=0,stepX=0,stepY=0,cellWidth=0;
let baseX,baseY,baseZ,phases,heights,helper,helper2,initialWidth=0,initialHeight=0;
const cursor={x:.73,y:.49},smooth={x:.73,y:.49};
let isActive=false,isTouchDragging=false;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const mix=(a,b,f)=>a+(b-a)*f;
const stageRect=()=>experience.getBoundingClientRect();
const initialBounds=stageRect();
const isSmall=Math.min(initialBounds.width,window.innerWidth)<680;

function layout(){
 const r=stageRect(),h=Math.max(430,r.height),w=Math.max(280,r.width);
 rows=clamp(Math.round(h/(coarse?42:54)),11,coarse?22:22);
 stepY=1.22;stepX=.84;cellWidth=.82;
 const vh=(rows+.3)*stepY;
 cols=clamp(Math.ceil((vh*w/h)/stepX)+5,12,54);
 count=cols*rows;
 initialWidth=w;initialHeight=h;
}
layout();

function buildFallback(){
 fallback.style.setProperty("--cols",String(cols));
 fallback.style.setProperty("--rows",String(rows));
 const fragment=document.createDocumentFragment();
 for(let i=0;i<count;i++){
  const tile=document.createElement("i");
  const variance=(i*23%17)/17;
  tile.style.setProperty("--brightness",(.69+variance*.65).toFixed(2));
  tile.style.setProperty("--opacity",(.56+((i*37)%13)/13*.41).toFixed(2));
  fragment.appendChild(tile);
 }
 fallback.appendChild(fragment);
}
buildFallback();

function paletteAt(index){
 paletteIndex=(index+palettes.length)%palettes.length;
 const p=palettes[paletteIndex];
 experience.style.setProperty("--accent",p.glow);
 experience.style.setProperty("--accent2",p.glow2);
 experience.style.setProperty("--accent3",p.glow3);
 experience.style.setProperty("--glow",p.glow2);
 paletteName.textContent=p.name;
 indicator.style.background=p.glow;
 indicator.style.boxShadow="0 0 13px "+p.glow;
 if(material){
  material.color.setHex(p.surface);
  material.emissive.setHex(p.emissive);
  const primary=new T.Color(p.surface),other=new T.Color(p.rim);
  for(let i=0;i<count;i++){
    const value=((i*31)%23)/23;
    const color=primary.clone().lerp(other,.11+value*.2);
    color.multiplyScalar(.77+((i*19)%17)/17*.46);
    mesh.setColorAt(i,color);
  }
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 }
 if(inlayMaterial)inlayMaterial.color.setHex(p.rim);
 if(lightA)lightA.color.setHex(p.shimmer);
 if(lightB)lightB.color.setHex(p.secondary);
 if(lightC)lightC.color.setHex(p.rim);
 if(sparkMaterial)sparkMaterial.color.setHex(p.shimmer);
 if(reduced)renderStill();
}
function updateHud(){
 const score=clamp(Math.round(energy*100),0,100);
 energyFill.style.width=Math.max(3,score)+"%";
 energyValue.textContent=String(score).padStart(2,"0")+"%";
 let headline="MOVE TO INTERACT",description="A field that responds to you";
 if(paused){headline="MOTION PAUSED";description="Press play to resume";}
 else if(modalOpen){headline="WATCHING SELECTED WORK";description="The field is resting";}
 else if(burst>.4){headline="ENERGY IMPULSE";description="The surface remembers your touch";}
 else if(energy>.52){headline="FULL MAGNETIC RESPONSE";description="You are shaping the field";}
 else if(isActive){headline="MAGNETIC FIELD ACTIVE";description="Move closer to the surface";}
 status.textContent=headline;substatus.textContent=description;
}
function locate(clientX,clientY){
 const r=stageRect();
 if(!r.width||!r.height)return;
 cursor.x=clamp((clientX-r.left)/r.width,0,1);
 cursor.y=clamp((clientY-r.top)/r.height,0,1);
 isActive=true;
 if(!loaded){
   const focusX=cursor.x*cols,focusY=cursor.y*rows;
   for(let i=0;i<fallback.children.length;i++){
     const dx=(i%cols+.5)-focusX,dy=(Math.floor(i/cols)+.5)-focusY;
     const influence=Math.exp(-(dx*dx+dy*dy)*.18)*strength;
     fallback.children[i].style.setProperty("--lift",(influence*48).toFixed(1)+"px");
     fallback.children[i].style.filter="brightness("+(1+influence*.82).toFixed(2)+")";
   }
   const distance=Math.hypot((cursor.x-.70)*1.25,(cursor.y-.49)*1.3);
   energy=clamp(.08+Math.max(0,1-distance)*.70,0,1);
   updateHud();
 }
 requestFrame();
}
experience.addEventListener("pointermove",e=>{
 if(e.pointerType==="touch"&&!isTouchDragging)return;
 locate(e.clientX,e.clientY);
},{passive:true});
experience.addEventListener("pointerdown",e=>{
 if(e.target.closest("button,a,input"))return;
 isTouchDragging=e.pointerType==="touch";
 locate(e.clientX,e.clientY);
 pulse();
},{passive:true});
experience.addEventListener("pointerup",e=>{
 if(e.pointerType==="touch"){isTouchDragging=false;isActive=false;}
},{passive:true});
experience.addEventListener("pointercancel",()=>{isTouchDragging=false;isActive=false;requestFrame();},{passive:true});
experience.addEventListener("pointerleave",()=>{
 isActive=false;isTouchDragging=false;
 if(!loaded)for(const node of fallback.children){node.style.setProperty("--lift","0px");node.style.filter="";}
 requestFrame();
},{passive:true});
experience.addEventListener("touchmove",e=>{
 if(!e.touches.length||e.target.closest("button,a,input"))return;
 const touch=e.touches[0];
 locate(touch.clientX,touch.clientY);
},{passive:true});

function pulse(){
 burst=1;burstTime=t;
 if(!loaded){
  fallback.style.filter="drop-shadow(0 0 30px "+palettes[paletteIndex].glow+")";
  setTimeout(()=>{fallback.style.filter="";},550);
 }
 requestFrame();
}
function setStrength(n){strength=clamp(Number(n)||.67,.2,1);}
function togglePause(){
 paused=!paused;experience.classList.toggle("paused",paused);
 if(paused){if(raf)cancelAnimationFrame(raf);raf=0;previous=0;renderStill();}
 else requestFrame();
 updateHud();return paused;
}
function setModalOpen(open){
 modalOpen=!!open;
 if(modalOpen){if(raf)cancelAnimationFrame(raf);raf=0;previous=0;}
 else requestFrame();
 updateHud();
}
window.PRISM_FIELD={pulse,changePalette:()=>paletteAt(paletteIndex+1),setStrength,togglePause,setModalOpen};
document.addEventListener("prism:pulse",pulse);
paletteAt(0);updateHud();

function diamondGeometry(){
 const shape=new T.Shape();
 shape.moveTo(0,.665);
 shape.lineTo(.41,0);
 shape.lineTo(0,-.665);
 shape.lineTo(-.41,0);
 shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:.34,steps:1,bevelEnabled:true,bevelSegments:3,bevelThickness:.048,bevelSize:.037,curveSegments:2});
 geo.translate(0,0,-.17);geo.computeVertexNormals();
 return geo;
}
async function setupThree(){
 if(loading||loaded||reduced)return;
 loading=true;
 try{
  const context=canvas.getContext("webgl2",{alpha:true,antialias:!coarse,powerPreference:coarse?"low-power":"high-performance"});
  if(!context)throw Error("WebGL2 unavailable");
  T=await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
  if(!experience.isConnected)return;
  renderer=new T.WebGLRenderer({canvas,context,alpha:true,antialias:!coarse,powerPreference:coarse?"low-power":"high-performance",premultipliedAlpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.13:1.6));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.40;
  scene=new T.Scene();
  camera=new T.OrthographicCamera(-1,1,1,-1,.1,100);
  camera.position.set(0,0,23);camera.lookAt(0,0,0);
  scene.add(new T.AmbientLight(0xd5c9fa,.76));
  scene.add(new T.HemisphereLight(0xddcbff,0x131122,1.2));
  const key=new T.DirectionalLight(0xffe3f8,2.5);key.position.set(-5,8,11);scene.add(key);
  const edge=new T.DirectionalLight(0x9ec8ff,2.1);edge.position.set(6,-2,8);scene.add(edge);
  lightA=new T.PointLight(palettes[0].shimmer,55,28,1.12);lightA.position.set(4,3,6);scene.add(lightA);
  lightB=new T.PointLight(palettes[0].secondary,40,27,1.15);lightB.position.set(-4,-3,4);scene.add(lightB);
  lightC=new T.PointLight(palettes[0].rim,25,24,1.5);lightC.position.set(5,-4,4);scene.add(lightC);
  cluster=new T.Group();scene.add(cluster);
  geometry=diamondGeometry();
  material=new T.MeshPhysicalMaterial({
   color:palettes[0].surface,metalness:.65,roughness:.25,
   clearcoat:1,clearcoatRoughness:.13,
   iridescence:.72,iridescenceIOR:1.35,iridescenceThicknessRange:[145,670],
   emissive:palettes[0].emissive,emissiveIntensity:.24
  });
  mesh=new T.InstancedMesh(geometry,material,count);
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;
  cluster.add(mesh);
  // Secondary inset diamonds catch light in the gap and add dimensional layering.
  const face=new T.Shape();
  face.moveTo(0,.45);face.lineTo(.26,0);face.lineTo(0,-.45);face.lineTo(-.26,0);face.closePath();
  inlayGeo=new T.ShapeGeometry(face);
  inlayMaterial=new T.MeshBasicMaterial({color:palettes[0].rim,transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  inlay=new T.InstancedMesh(inlayGeo,inlayMaterial,count);
  inlay.instanceMatrix.setUsage(T.DynamicDrawUsage);inlay.frustumCulled=false;cluster.add(inlay);
  baseX=new Float32Array(count);baseY=new Float32Array(count);baseZ=new Float32Array(count);phases=new Float32Array(count);heights=new Float32Array(count);
  helper=new T.Object3D();helper2=new T.Object3D();
  for(let i=0;i<count;i++){
   const row=Math.floor(i/cols),col=i%cols;
   const x=(col-(cols-1)/2)*stepX+((row%2)?stepX*.46:0);
   const y=((rows-1)/2-row)*stepY;
   const prominence=Math.exp(-((x-(cols*stepX*.12))**2/(cols*stepX*.18)**2+(y+1.0)**2/(rows*stepY*.28)**2));
   const z=.08+prominence*.65+((i*41)%13)/13*.23;
   baseX[i]=x;baseY[i]=y;baseZ[i]=z;phases[i]=((i*13)%53)/53*Math.PI*2;
   helper.position.set(x,y,z);helper.updateMatrix();mesh.setMatrixAt(i,helper.matrix);
   helper2.position.set(x,y,z+.223);helper2.updateMatrix();inlay.setMatrixAt(i,helper2.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;inlay.instanceMatrix.needsUpdate=true;
  // A deliberately sparse, spatially offset suspended spark field.
  const sparkCount=coarse?56:144;
  sparkOrigins=new Float32Array(sparkCount*3);
  sparkPhases=new Float32Array(sparkCount);
  const live=new Float32Array(sparkCount*3);
  for(let i=0;i<sparkCount;i++){
   const k=i*3;
   sparkOrigins[k]=(Math.random()-.5)*cols*stepX;
   sparkOrigins[k+1]=(Math.random()-.5)*rows*stepY;
   sparkOrigins[k+2]=1+Math.random()*3.0;
   sparkPhases[i]=Math.random()*Math.PI*2;
  }
  live.set(sparkOrigins);
  sparkGeo=new T.BufferGeometry();
  sparkGeo.setAttribute("position",new T.BufferAttribute(live,3).setUsage(T.DynamicDrawUsage));
  sparkMaterial=new T.PointsMaterial({size:coarse?.025:.033,color:palettes[0].shimmer,transparent:true,opacity:.58,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true});
  sparks=new T.Points(sparkGeo,sparkMaterial);
  scene.add(sparks);
  paletteAt(paletteIndex);
  fitScene();
  if("ResizeObserver" in window){resizeObserver=new ResizeObserver(fitScene);resizeObserver.observe(experience);}
  else window.addEventListener("resize",fitScene,{passive:true});
  loaded=true;stage.classList.add("ready");
  if(!paused&&!modalOpen)requestFrame();
 }catch(error){
  stage.classList.add("fallback-mode");
  substatus.textContent="Interactive preview mode";
  console.warn("PRISM 3D fallback active:",error.message);
 }
}
function fitScene(){
 if(!renderer||!camera)return;
 const w=Math.max(1,experience.clientWidth),h=Math.max(1,experience.clientHeight);
 renderer.setSize(w,h,false);
 camera.aspect=w/h;
 const worldH=(rows-.3)*stepY;
 const worldW=worldH*w/h;
 camera.left=-worldW/2;camera.right=worldW/2;camera.top=worldH/2;camera.bottom=-worldH/2;
 camera.updateProjectionMatrix();
 if(cluster)cluster.scale.x=Math.max(1,worldW/Math.max(1,cols*stepX-2));
 if(paused)renderStill();
}
function renderStill(){if(renderer&&scene&&camera)renderer.render(scene,camera);}
function requestFrame(){
 if(reduced||!loaded||paused||modalOpen||!sceneVisible||document.hidden)return;
 if(!raf){previous=0;raf=requestAnimationFrame(animate);}
}
function animate(now){
 raf=0;
 if(!renderer||paused||modalOpen||document.hidden||!sceneVisible)return;
 const dt=previous?clamp((now-previous)/1000,.001,.055):.016;previous=now;t+=dt;
 smooth.x=mix(smooth.x,isActive?cursor.x:.73,clamp(dt*5.5,0,1));
 smooth.y=mix(smooth.y,isActive?cursor.y:.49,clamp(dt*5.5,0,1));
 const worldH=(rows-.3)*stepY,worldW=worldH*camera.aspect;
 const px=(smooth.x-.5)*worldW/Math.max(1,cluster.scale.x);
 const py=(.5-smooth.y)*worldH;
 const radial=Math.hypot((smooth.x-.70)*1.24,(smooth.y-.49)*1.4);
 const closeness=isActive?Math.pow(clamp(1-radial/.85,0,1),.85):.04;
 energy=mix(energy,clamp(.06+closeness*.76+burst*.24,0,1),clamp(dt*5,0,1));
 burst=Math.max(0,burst-dt*.92);
 const distanceWave=(t-burstTime)*4.8;
 for(let i=0;i<count;i++){
  const dx=baseX[i]-px,dy=baseY[i]-py;
  const dist2=dx*dx+dy*dy,dist=Math.sqrt(dist2);
  const influence=isActive?Math.exp(-dist2/(coarse?4.6:6.9))*strength:0;
  const wave=burst>0?Math.exp(-((dist-distanceWave)**2)/.85)*burst*strength:0;
  const idle=Math.sin(t*.74+phases[i])* .022;
  heights[i]=mix(heights[i],influence+wave,clamp(dt*7.0,0,1));
  const push=heights[i];
  const z=baseZ[i]+push*(1.75+energy*.7)+idle;
  helper.position.set(baseX[i]+dx*.024*push,baseY[i]+dy*.025*push,z);
  helper.rotation.set(-dy*.082*push,dx*.087*push,Math.sin(t*.34+phases[i])*.015);
  helper.scale.setScalar(1-push*.055);
  helper.updateMatrix();mesh.setMatrixAt(i,helper.matrix);
  helper2.position.set(helper.position.x,helper.position.y,z+.223);
  helper2.rotation.copy(helper.rotation);
  helper2.scale.copy(helper.scale);
  helper2.updateMatrix();inlay.setMatrixAt(i,helper2.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;inlay.instanceMatrix.needsUpdate=true;
 cluster.rotation.x=mix(cluster.rotation.x,(smooth.y-.5)*-.025,clamp(dt*1.8,0,1));
 cluster.rotation.y=mix(cluster.rotation.y,(smooth.x-.5)*.028,clamp(dt*1.8,0,1));
 lightA.position.set(px*.78,py*.82,5);
 lightA.intensity=38+energy*55;
 lightB.position.set(-worldW*.17+Math.sin(t*.17)*2,-worldH*.18+Math.cos(t*.12)*1.5,4);
 lightB.intensity=35+energy*18;
 if(inlayMaterial)inlayMaterial.opacity=.040+energy*.090;
 if(sparks){
  const a=sparkGeo.getAttribute("position");
  const v=a.array;
  for(let i=0;i<sparkPhases.length;i++){
   const k=i*3,p=sparkPhases[i];
   v[k]=sparkOrigins[k]+Math.sin(t*.22+p)*.075;
   v[k+1]=sparkOrigins[k+1]+Math.cos(t*.26+p)*.08;
   v[k+2]=sparkOrigins[k+2]+Math.sin(t*.50+p)*.12;
  }
  a.needsUpdate=true;
  sparkMaterial.opacity=.42+energy*.28;
 }
 renderer.render(scene,camera);
 if(now-lastRead>115){updateHud();lastRead=now;}
 raf=requestAnimationFrame(animate);
}
function setVisible(v){
 sceneVisible=v;
 if(v){if(!loading&&!reduced)setupThree();else requestFrame();}
 else if(raf){cancelAnimationFrame(raf);raf=0;previous=0;}
}
if("IntersectionObserver" in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>setVisible(e.isIntersecting)),{threshold:0,rootMargin:"80px 0px"});
 observer.observe(experience);
}else setVisible(true);
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;previous=0;}
 else requestFrame();
},{passive:true});
// Low-motion users keep the fully designed, interactive CSS scene without GPU work.
if(reduced){status.textContent="LOW-MOTION EXPERIENCE";substatus.textContent="Move to interact with the surface";}
})();
