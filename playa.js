/* ===== Playa viva · motor visual (video de fondo + hero + botones mar) ===== */
(function(){
  const splash = document.createElement('canvas'); splash.id = 'seaSplash'; document.body.prepend(splash);
  const fondo = document.createElement('div'); fondo.id = 'playaFondo';
  const velo = document.createElement('div'); velo.className = 'playa-velo';
  const video = document.createElement('video'); video.id = 'playaVideo'; video.muted = true; video.playsInline = true; video.preload = 'auto'; video.setAttribute('aria-hidden', 'true');
  fondo.appendChild(video); fondo.appendChild(velo); document.body.prepend(fondo);
  document.body.classList.add('playa-fondo');
  document.querySelectorAll('header.hero').forEach((h)=>{
    h.insertAdjacentHTML('afterbegin', '<div class="sea-shimmer s1"></div><div class="sea-shimmer s2"></div><canvas class="playa-hero-fx"></canvas>');
  });
})();
// ---------- botones foto-real estilo playa (marea + espuma + salpicadura) ----------
const seaBtns = [];
const seaReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function seaFy(btn, imgSrc, fxKey){
  if(!btn || btn.classList.contains('sea-btn')) return;
  btn.classList.add('sea-btn');
  btn.dataset.fx = fxKey || 'playa';
  btn.querySelectorAll('.wave-fill,.ola').forEach(n=>n.remove());
  const label = document.createElement('span'); label.className='sea-label';
  while(btn.firstChild) label.appendChild(btn.firstChild);
  btn.appendChild(label);
  const img = document.createElement('img'); img.className='sea-photo'; img.alt=''; img.decoding='async'; img.src=imgSrc;
  const foam = document.createElement('canvas'); foam.className='sea-foam';
  const shine = document.createElement('span'); shine.className='sea-shine';
  btn.prepend(shine); btn.prepend(foam); btn.prepend(img);
  const st = {btn,img,foam,ctx:foam.getContext('2d'),tide:.45,tideT:.45,surge:-1,surgeT:-1,boost:0,W:0,H:0,fx:fxKey||'playa',snd:fxKey||'playa'};
  seaBtns.push(st); seaSize(st);
  img.addEventListener('load',()=>seaSize(st));
  btn.addEventListener('pointerenter',()=>{st.tideT=.85;});
  btn.addEventListener('pointerleave',()=>{st.tideT=.45;});
  btn.addEventListener('click',e=>seaSplash(st,e));
}
function seaSize(st){
  const r = st.btn.getBoundingClientRect(); if(r.width<2||r.height<2) return;
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  st.W=r.width; st.H=r.height;
  st.foam.width=Math.round(r.width*dpr); st.foam.height=Math.round(r.height*dpr);
  st.ctx.setTransform(dpr,0,0,dpr,0,0);
  if(seaReduce) seaDraw(st, 1.2);
}
function seaShore(st,x,t){
  return (0.52+(st.tide-0.45)*-0.9)*st.H
    + Math.sin(x*0.03+t*2.4)*Math.max(1.5,st.H*0.035)
    + Math.sin(x*0.011-t*1.5)*Math.max(2,st.H*0.05);
}
function seaDraw(st,t){
  const ctx=st.ctx, W=st.W, H=st.H; if(!W) return;
  const s=H/78, bw=st.boost;
  ctx.clearRect(0,0,W,H);
  for(let pass=0;pass<3;pass++){
    ctx.beginPath();
    for(let x=0;x<=W;x+=4){ const y=seaShore(st,x,t+pass*0.25)+pass*5*s; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }
    ctx.strokeStyle=pass===0?'rgba(255,255,255,.95)':'rgba(255,255,255,.35)';
    ctx.lineWidth=(pass===0?3:7)*s+bw*(pass===0?5:10)*s;
    ctx.lineCap='round'; ctx.stroke();
  }
  ctx.fillStyle='rgba(255,255,255,.9)';
  const step=Math.max(5,11*s);
  for(let x=0;x<W;x+=step){ if(Math.sin(x*12.9+t*4)>0.1){
    const y=seaShore(st,x,t)+3*s+Math.sin(x*0.2+t*5)*2*s-bw*Math.random()*6*s;
    ctx.beginPath(); ctx.arc(x,y,0.7*s+Math.random()*1.8*s+bw*1.5*s,0,7); ctx.fill(); } }
}
// salpicadura global (sale del botón)
const seaSplashCv = document.getElementById('seaSplash');
const seaSplashCtx = seaSplashCv ? seaSplashCv.getContext('2d') : null;
let seaParts = [];
// ---------- sonidos procedurales: 1 por tema, sin repetidos (WebAudio, sin archivos) ----------
let seaAC = null, seaNoiseBuf = null;
function seaCtx(){
  if(!seaAC){ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null; seaAC = new AC(); }
  if(seaAC.state === 'suspended') seaAC.resume();
  return seaAC;
}
function seaTone(o){
  const ac = seaCtx(); if(!ac) return;
  const t0 = ac.currentTime + (o.delay || 0);
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f0 || 440, t0);
  if(o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + (o.dur || 0.4));
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + (o.attack || 0.015));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + (o.dur || 0.4));
  osc.connect(g).connect(ac.destination);
  osc.start(t0); osc.stop(t0 + (o.dur || 0.4) + 0.05);
}
function seaNoise(o){
  const ac = seaCtx(); if(!ac) return;
  if(!seaNoiseBuf){
    seaNoiseBuf = ac.createBuffer(1, ac.sampleRate * 1.2, ac.sampleRate);
    const d = seaNoiseBuf.getChannelData(0);
    for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ac.currentTime + (o.delay || 0);
  const src = ac.createBufferSource(); src.buffer = seaNoiseBuf; src.loop = true;
  const f = ac.createBiquadFilter(); f.type = o.ftype || 'lowpass'; f.Q.value = o.Q || 0.9;
  f.frequency.setValueAtTime(o.f0 || 800, t0);
  if(o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.f1), t0 + (o.dur || 0.5));
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.vol || 0.18, t0 + (o.attack || 0.03));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + (o.dur || 0.5));
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t0); src.stop(t0 + (o.dur || 0.5) + 0.05);
}
const seaSounds = {
  playa(){ seaNoise({dur:.9,vol:.22,f0:500,f1:2200}); seaTone({f0:170,f1:65,dur:.8,vol:.12}); },
  arrecife(){ seaTone({f0:520,f1:110,dur:.5,vol:.22}); [0,.12,.24].forEach((dl,i)=>seaTone({f0:750+i*180,f1:1150+i*220,dur:.16,vol:.10,delay:dl+.3})); },
  cascada(){ seaNoise({dur:.85,vol:.2,ftype:'highpass',f0:1800,f1:3400}); seaNoise({dur:.6,vol:.1,f0:3000,f1:1200,delay:.05}); },
  montana(){ seaNoise({dur:1,vol:.16,ftype:'bandpass',f0:280,f1:520,Q:1.4,attack:.25}); seaTone({f0:95,f1:48,dur:.5,vol:.22,delay:.1}); },
  ciudad(){ seaTone({f0:660,dur:.12,type:'square',vol:.10}); seaTone({f0:880,dur:.16,type:'square',vol:.10,delay:.13}); seaNoise({dur:.12,vol:.05,ftype:'highpass',f0:4000,delay:.02}); },
  varadero(){ seaNoise({dur:.35,vol:.16,f0:900,f1:400}); seaTone({f0:210,f1:90,dur:.3,vol:.10}); },
  trinidad(){ [329.6,440,554.4].forEach((f,i)=>seaTone({f0:f,dur:.5,vol:.14,type:'triangle',delay:i*.09})); },
  cayo(){ for(let i=0;i<5;i++) seaNoise({dur:.05,vol:.14,ftype:'highpass',f0:6000,delay:i*.07}); },
  habana(){ seaTone({f0:370,dur:.4,vol:.12,type:'square'}); seaTone({f0:466,dur:.4,vol:.12,type:'square'}); },
  vinales(){ [0,.14,.28].forEach((dl,i)=>seaTone({f0:2400+i*250,f1:3200+i*300,dur:.14,vol:.10,delay:dl})); },
  santiago(){ seaTone({f0:150,f1:38,dur:.7,vol:.3,attack:.01}); seaNoise({dur:.5,vol:.2,f0:400,f1:90,delay:.02}); },
  plaza(){ [880,1318,1760].forEach(f=>seaTone({f0:f,dur:1.2,vol:.07,attack:.01})); },
  bote(){ seaTone({f0:130,f1:75,dur:.4,vol:.16,type:'sawtooth'}); seaNoise({dur:.3,vol:.14,f0:1400,f1:600,delay:.15}); },
  rio(){ seaNoise({dur:.7,vol:.16,ftype:'bandpass',f0:1100,f1:1500,Q:2.2,attack:.1}); seaTone({f0:600,f1:900,dur:.3,vol:.05,delay:.2}); },
  capitolio(){ [523,659,784,1046].forEach((f,i)=>seaTone({f0:f,dur:.35,vol:.13,delay:i*.08})); },
  brisa(){ [0,.35].forEach(dl=>seaTone({f0:2100,f1:1100,dur:.3,vol:.08,delay:dl})); seaNoise({dur:1,vol:.12,f0:600,f1:1800,attack:.3}); },
  espuma(){ [0,.18].forEach(dl=>{ seaNoise({dur:.22,vol:.16,ftype:'highpass',f0:2500,delay:dl}); seaTone({f0:280,f1:70,dur:.2,vol:.14,delay:dl}); }); },
  farol(){ [392,494,587,659,784,988].forEach((f,i)=>seaTone({f0:f,dur:.3,vol:.11,type:'triangle',delay:i*.035})); seaNoise({dur:.08,vol:.12,f0:300,delay:.22}); },
  polen(){ seaNoise({dur:1.4,vol:.09,ftype:'bandpass',f0:500,Q:1.2,attack:.5}); seaTone({f0:2900,f1:3400,dur:.18,vol:.07,delay:.5}); }
};
function seaPlay(key){ try{ if(seaSounds[key]) seaSounds[key](); }catch(e){} }
function seaSplashSize(){
  if(!seaSplashCv) return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  seaSplashCv.width=innerWidth*dpr; seaSplashCv.height=innerHeight*dpr;
  seaSplashCtx.setTransform(dpr,0,0,dpr,0,0);
}
// ---------- partículas: 19 efectos únicos, 1 por botón ----------
function seaP(fx,cx,cy,o){
  seaParts.push(Object.assign({fx,x:cx,y:cy,vx:0,vy:0,life:1,decay:1,r:3,g:900,dr:.4,
    rot:Math.random()*6.28,vr:(Math.random()-.5)*6,sw:0,gr:0,col:'#fff'},o||{}));
}
function seaBurst(fx,cx,cy,big){
  const R=Math.random;
  const up=(vx,vy)=>({vx:vx+(R()-.5)*60,vy});
  if(fx==='playa'){
    const n=big?110:60;
    for(let i=0;i<n;i++){ const a=-Math.PI/2+(R()-.5)*2.2, sp=(big?160:110)+R()*(big?380:260);
      seaP('playa',cx+(R()-.5)*(big?90:50),cy+(R()-.5)*10,{vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-80,
        decay:.7+R()*.8,r:1.5+R()*(big?5:3.5),mist:R()<.25,g:950}); }
  }else if(fx==='arrecife'){
    const n=big?55:30;
    for(let i=0;i<n;i++) seaP('arrecife',cx+(R()-.5)*90,cy+(R()-.5)*20,
      {vx:(R()-.5)*60,vy:-80-R()*220,decay:.45+R()*.4,r:1.5+R()*4,g:-60,dr:.6,sw:40});
  }else if(fx==='cascada'){
    const n=big?45:25;
    for(let i=0;i<n;i++) seaP('cascada',cx+(R()-.5)*100,cy+(R()-.5)*16,
      {vx:(R()-.5)*140,vy:-30-R()*120,decay:.6+R()*.5,r:4+R()*9,g:60,dr:1.2});
  }else if(fx==='montana'){
    const n=big?55:30, cols=['#8a7f74','#6b6259','#a89c8e','#4e463e'];
    for(let i=0;i<n;i++){ const a=-Math.PI/2+(R()-.5)*2.4, sp=140+R()*320;
      seaP('montana',cx,cy,{vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-60,decay:.8+R()*.6,
        r:2+R()*4.5,g:1100,dr:.2,col:cols[(R()*cols.length)|0],vr:(R()-.5)*14}); }
  }else if(fx==='ciudad'){
    const n=big?85:45, cols=['#FF6B5B','#5EEAD4','#F3D98B','#7DD3FC','#F0ABFC'];
    for(let i=0;i<n;i++){ const a=-Math.PI/2+(R()-.5)*2.6, sp=150+R()*380;
      seaP('ciudad',cx,cy,{vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-60,decay:.9+R()*.6,
        r:2+R()*3.5,g:700,dr:.5,col:cols[(R()*cols.length)|0],vr:(R()-.5)*16}); }
  }else if(fx==='varadero'){
    const n=big?70:38;
    for(let i=0;i<n;i++){ const a=-Math.PI/2+(R()-.5)*2.2, sp=90+R()*260;
      seaP('varadero',cx+(R()-.5)*70,cy,{vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-40,decay:1+R()*.6,
        r:1+R()*2.6,g:520,dr:.8,col:R()<.5?'#e8d5a8':'#d9bd85'}); }
  }else if(fx==='trinidad'){
    const n=big?50:28, cols=['#e2725b','#d6455a','#f2a65a'];
    for(let i=0;i<n;i++) seaP('trinidad',cx+(R()-.5)*80,cy,
      {vx:(R()-.5)*220,vy:-80-R()*220,decay:.7+R()*.5,r:2.5+R()*3.5,g:350,dr:.7,sw:90,
       col:cols[(R()*cols.length)|0],vr:(R()-.5)*10});
  }else if(fx==='cayo'){
    const n=big?14:8;
    for(let i=0;i<n;i++) seaP('cayo',cx,cy,{vx:0,vy:0,life:1,decay:.9+R()*.4,r:4,g:0,gr:170+R()*120});
    for(let i=0;i<(big?30:15);i++) seaP('cayo',cx+(R()-.5)*60,cy,{vx:(R()-.5)*160,vy:-60-R()*160,
      decay:.8,r:1.5+R()*2.5,g:800,gr:0});
  }else if(fx==='habana'){
    const n=big?45:25, cols=['#ffe9a8','#f3d98b','#ffffff'];
    for(let i=0;i<n;i++) seaP('habana',cx+(R()-.5)*110,cy+(R()-.5)*24,
      {vx:(R()-.5)*120,vy:-40-R()*140,decay:1.1+R()*.5,r:2+R()*4,g:120,dr:1,col:cols[(R()*cols.length)|0],vr:(R()-.5)*4});
  }else if(fx==='vinales'){
    const n=big?50:28, cols=['#2d6a4f','#40916c','#74c69d'];
    for(let i=0;i<n;i++) seaP('vinales',cx+(R()-.5)*90,cy,
      {vx:(R()-.5)*200,vy:-60-R()*200,decay:.7+R()*.5,r:3+R()*4,g:250,dr:.9,sw:110,
       col:cols[(R()*cols.length)|0],vr:(R()-.5)*9});
  }else if(fx==='santiago'){
    const n=big?60:32;
    for(let i=0;i<n;i++) seaP('santiago',cx+(R()-.5)*70,cy+10,
      {vx:(R()-.5)*140,vy:-120-R()*280,decay:.8+R()*.6,r:1.5+R()*3,g:-140,dr:.7,sw:50,
       col:R()<.6?'#ff9a3c':'#ffd166'});
  }else if(fx==='plaza'){
    const n=big?35:20;
    for(let i=0;i<n;i++) seaP('plaza',cx+(R()-.5)*110,cy-10,
      {vx:(R()-.5)*90,vy:-20-R()*90,decay:.4+R()*.3,r:3+R()*4.5,g:120,dr:1.1,sw:130,vr:(R()-.5)*5});
  }else if(fx==='bote'){
    const n=big?60:32;
    for(let i=0;i<n;i++) seaP('bote',cx,cy+(R()-.5)*14,
      {vx:(R()<.5?-1:1)*(150+R()*320),vy:-50-R()*160,decay:.8+R()*.5,r:2+R()*3,g:800,dr:.3,
       col:R()<.6?'#7dd3fc':'#ffffff'});
  }else if(fx==='rio'){
    const n=big?12:7;
    for(let i=0;i<n;i++) seaP('rio',cx+(R()-.5)*30,cy,{vx:0,vy:0,decay:.8,r:3,g:0,gr:150+R()*110});
    for(let i=0;i<(big?30:15);i++) seaP('rio',cx+(R()-.5)*70,cy,
      {vx:(R()-.5)*200,vy:-60-R()*180,decay:.9,r:1+R()*2,g:600,gr:0,dot:true});
  }else if(fx==='brisa'){
    const n=big?50:28, cols=['#ffe9a8','#ffffff','#f3d98b'];
    for(let i=0;i<n;i++) seaP('brisa',cx+(R()-.5)*110,cy+(R()-.5)*20,
      {vx:(R()-.5)*70,vy:-60-R()*160,decay:.4+R()*.35,r:2.5+R()*5,g:-80,dr:.8,sw:120,
       col:cols[(R()*cols.length)|0]});
  }else if(fx==='espuma'){
    const n=big?45:25;
    for(let i=0;i<n;i++) seaP('espuma',cx+(R()-.5)*80,cy+(R()-.5)*14,
      {vx:(R()-.5)*180,vy:-40-R()*140,decay:.7+R()*.5,r:2+R()*3.5,g:320,dr:.9,gr:70+R()*60});
  }else if(fx==='farol'){
    const n=big?40:22, cols=['#ffb347', '#ff8c42', '#ffd166'];
    for(let i=0;i<n;i++) seaP('farol',cx+(R()-.5)*100,cy+10,
      {vx:(R()-.5)*60,vy:-50-R()*110,decay:.45+R()*.35,r:2.5+R()*3.5,g:-120,dr:.6,sw:60,
       col:cols[(R()*cols.length)|0],vr:(R()-.5)*3});
  }else if(fx==='polen'){
    const n=big?55:30, cols=['#d8f3a0','#f3d98b','#b7e4c7'];
    for(let i=0;i<n;i++) seaP('polen',cx+(R()-.5)*100,cy+(R()-.5)*20,
      {vx:(60+R()*200)*(R()<.5?-1:1),vy:-20-R()*60,decay:.3+R()*.25,r:1+R()*1.8,g:40,dr:.5,sw:80,
       col:cols[(R()*cols.length)|0]});
  }else{ // capitolio: lascas mármol + destellos oro
    const n=big?55:30;
    for(let i=0;i<n;i++){ const a=-Math.PI/2+(R()-.5)*2.4, sp=130+R()*330, gold=R()<.3;
      seaP('capitolio',cx,cy,{vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-70,decay:.85+R()*.6,
        r:gold?1.5+R()*2.5:2+R()*4,g:900,dr:.4,col:gold?'#f3d98b':'#e9e4d8',vr:(R()-.5)*12}); }
  }
  if(seaParts.length>650) seaParts.splice(0, seaParts.length-650);
}
function seaDrawPart(p, alpha){
  const c = seaSplashCtx;
  if(p.fx==='playa'){
    if(p.mist){
      const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
      g.addColorStop(0,`rgba(255,255,255,${0.5*alpha})`); g.addColorStop(1,'rgba(255,255,255,0)');
      c.fillStyle=g; c.beginPath(); c.arc(p.x,p.y,p.r*3,0,7); c.fill(); return;
    }
    const g=c.createRadialGradient(p.x-p.r*0.3,p.y-p.r*0.3,p.r*0.1,p.x,p.y,p.r);
    g.addColorStop(0,`rgba(255,255,255,${0.95*alpha})`);
    g.addColorStop(0.55,`rgba(190,230,250,${0.9*alpha})`);
    g.addColorStop(1,`rgba(20,120,190,${0.85*alpha})`);
    c.fillStyle=g; c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill();
    c.fillStyle=`rgba(255,255,255,${0.9*alpha})`;
    c.beginPath(); c.arc(p.x-p.r*0.3,p.y-p.r*0.35,p.r*0.28,0,7); c.fill();
  }else if(p.fx==='arrecife'){
    c.strokeStyle=`rgba(180,235,255,${0.9*alpha})`; c.lineWidth=1.4;
    c.beginPath(); c.arc(p.x,p.y,Math.max(.5,p.r),0,7); c.stroke();
    c.fillStyle=`rgba(255,255,255,${0.5*alpha})`;
    c.beginPath(); c.arc(p.x-p.r*.3,p.y-p.r*.3,Math.max(.4,p.r*.25),0,7); c.fill();
  }else if(p.fx==='cascada'){
    const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
    g.addColorStop(0,`rgba(255,255,255,${0.55*alpha})`); g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g; c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill();
  }else if(p.fx==='montana'){
    c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
    c.globalAlpha=alpha; c.fillStyle=p.col; c.fillRect(-p.r,-p.r*.7,p.r*2,p.r*1.4);
    c.restore(); c.globalAlpha=1;
  }else if(p.fx==='ciudad'){
    c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
    c.globalAlpha=alpha; c.fillStyle=p.col; c.fillRect(-p.r,-p.r*.45,p.r*2,p.r*.9);
    c.restore(); c.globalAlpha=1;
  }else if(p.fx==='varadero'){
    c.fillStyle=p.col; c.globalAlpha=alpha*.95;
    c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill(); c.globalAlpha=1;
  }else if(p.fx==='trinidad'||p.fx==='vinales'){
    c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
    c.globalAlpha=alpha; c.fillStyle=p.col;
    c.beginPath(); c.ellipse(0,0,p.r,p.r*.55,0,0,7); c.fill();
    c.restore(); c.globalAlpha=1;
  }else if(p.fx==='cayo'||p.fx==='rio'){
    if(p.dot || (!p.gr && p.fx==='cayo')){
      c.fillStyle=p.fx==='cayo'?'rgba(255,255,255,.9)':'rgba(167,227,208,.9)'; c.globalAlpha=alpha;
      c.beginPath(); c.arc(p.x,p.y,Math.max(.6,p.r*.8),0,7); c.fill(); c.globalAlpha=1;
    }else{
      c.strokeStyle=p.fx==='cayo'?`rgba(255,255,255,${0.85*alpha})`:`rgba(140,230,200,${0.85*alpha})`;
      c.lineWidth=2; c.beginPath(); c.arc(p.x,p.y,Math.max(1,p.r),0,7); c.stroke();
    }
  }else if(p.fx==='habana'){
    c.save(); c.translate(p.x,p.y); c.rotate(p.rot*.3);
    c.globalAlpha=alpha; c.fillStyle=p.col;
    const r=p.r; c.beginPath();
    c.moveTo(0,-r); c.quadraticCurveTo(0,0,r,0); c.quadraticCurveTo(0,0,0,r);
    c.quadraticCurveTo(0,0,-r,0); c.quadraticCurveTo(0,0,0,-r); c.fill();
    c.restore(); c.globalAlpha=1;
  }else if(p.fx==='santiago'){
    const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2.4);
    g.addColorStop(0,`rgba(255,220,150,${0.95*alpha})`);
    g.addColorStop(.5,`rgba(255,140,50,${0.7*alpha})`);
    g.addColorStop(1,'rgba(255,80,20,0)');
    c.fillStyle=g; c.beginPath(); c.arc(p.x,p.y,p.r*2.4,0,7); c.fill();
  }else if(p.fx==='plaza'){
    c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
    c.globalAlpha=alpha*.9; c.fillStyle='#ffffff';
    c.beginPath(); c.ellipse(0,0,p.r,p.r*.5,0,0,7); c.fill();
    c.restore(); c.globalAlpha=1;
  }else if(p.fx==='bote'){
    c.save(); c.translate(p.x,p.y); c.rotate(Math.atan2(p.vy,p.vx)*.15);
    c.globalAlpha=alpha; c.fillStyle=p.col;
    c.beginPath(); c.ellipse(0,0,p.r*2.2,p.r*.7,0,0,7); c.fill();
    c.restore(); c.globalAlpha=1;
  }else if(p.fx==='brisa'){
    const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2);
    g.addColorStop(0,`rgba(255,240,200,${0.8*alpha})`); g.addColorStop(1,'rgba(255,220,150,0)');
    c.fillStyle=g; c.beginPath(); c.arc(p.x,p.y,p.r*2,0,7); c.fill();
  }else if(p.fx==='espuma'){
    c.fillStyle=`rgba(255,255,255,${0.95*alpha})`;
    c.beginPath(); c.arc(p.x,p.y,Math.max(.5,p.r),0,7); c.fill();
    c.strokeStyle=`rgba(140,200,230,${0.6*alpha})`; c.lineWidth=1;
    c.beginPath(); c.arc(p.x,p.y,Math.max(.5,p.r),0,7); c.stroke();
  }else if(p.fx==='farol'){
    c.save(); c.translate(p.x,p.y); c.rotate(p.rot*.5);
    c.globalAlpha=alpha; c.fillStyle=p.col;
    c.fillRect(-p.r,-p.r*.7,p.r*2,p.r*1.4);
    c.fillStyle='rgba(255,255,255,.75)'; c.fillRect(-p.r*.4,-p.r*.3,p.r*.8,p.r*.6);
    c.restore(); c.globalAlpha=1;
  }else if(p.fx==='polen'){
    c.fillStyle=p.col; c.globalAlpha=alpha*.9;
    c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill(); c.globalAlpha=1;
  }else{ // capitolio
    if(p.col==='#f3d98b'){ c.fillStyle=p.col; c.globalAlpha=alpha; c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill(); c.globalAlpha=1; }
    else{ c.save(); c.translate(p.x,p.y); c.rotate(p.rot); c.globalAlpha=alpha; c.fillStyle=p.col; c.fillRect(-p.r,-p.r*.6,p.r*2,p.r*1.2); c.restore(); c.globalAlpha=1; }
  }
}
function seaSplash(st,e){
  const br = st.btn.getBoundingClientRect();
  let cx = br.left+br.width/2, cy = br.top+br.height*0.35;
  if(e && e.clientX){ cx=e.clientX; cy=e.clientY; }
  seaPlay(st.snd || st.fx || 'playa');
  if(seaReduce || !seaSplashCtx) { st.surgeT=0; st.boost=1; return; }
  if(st.surgeT>=0 && st.surgeT<0.5) return;
  st.surgeT=0; st.boost=1;
  seaBurst(st.fx || 'playa',cx,cy,true); setTimeout(()=>seaBurst(st.fx || 'playa',cx,cy,false),130);
  if(st.btn.animate) st.btn.animate(
    [{transform:'scale(1.03)'},{transform:'scale(.97) translateY(2px)'},{transform:'scale(1.02)'}],
    {duration:380,easing:'ease-out'});
}
let seaLast = performance.now();
function seaLoop(now){
  const dt = Math.min(0.05,(now-seaLast)/1000); seaLast=now;
  const t = now/1000;
  for(let i=seaBtns.length-1;i>=0;i--){
    const st=seaBtns[i];
    if(!st.btn.isConnected){ seaBtns.splice(i,1); continue; }
    if(seaReduce) continue;
    const r=st.btn.getBoundingClientRect();
    if(r.bottom<-80||r.top>innerHeight+80) continue;
    let surge=0;
    if(st.surgeT>=0){ st.surgeT+=dt/1.3; if(st.surgeT>=1){st.surgeT=-1;} else surge=Math.sin(Math.PI*st.surgeT); }
    st.tide += ((st.tideT - surge*0.75) - st.tide) * Math.min(1,dt*4);
    st.boost = Math.max(0, st.boost - dt*0.8);
    st.surge = surge;
    const yPct = -12 + st.tide*22 - surge*16 + Math.sin(t*2)*1.2;
    st.img.style.transform = `translateY(${yPct.toFixed(2)}%) scale(1.08)`;
    seaDraw(st,t);
  }
  // partículas (19 efectos distintos)
  if(seaSplashCtx && seaParts.length){
    seaSplashCtx.clearRect(0,0,innerWidth,innerHeight);
    for(let i=seaParts.length-1;i>=0;i--){
      const p=seaParts[i];
      p.life -= dt*p.decay;
      if(p.life<=0||p.y>innerHeight+20){ seaParts.splice(i,1); continue; }
      p.vy += (p.g||900)*dt; p.vx *= (1-dt*(p.dr||.4));
      p.x += p.vx*dt + (p.sw?Math.sin(t*6+p.rot)*p.sw*dt:0); p.y += p.vy*dt;
      if(p.gr) p.r += p.gr*dt;
      p.rot += (p.vr||0)*dt;
      const sc = p.fx==='cayo'||p.fx==='rio' ? Math.max(0,Math.min(1,(1-p.life)*2)) : (0.5+p.life*0.5);
      seaDrawPart(p,Math.max(0,Math.min(1,p.life*1.2)));
      if(p.gr){ /* anillos crecen: radio ya actualizado */ }
      void sc;
    }
  } else if(seaSplashCtx){ seaSplashCtx.clearRect(0,0,innerWidth,innerHeight); }
  requestAnimationFrame(seaLoop);
}
// ---------- playa: olas en movimiento en cada hero ----------
document.querySelectorAll('header.hero').forEach((hero)=>{
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fx = hero.querySelector('.playa-hero-fx');
  const hctx = fx ? fx.getContext('2d') : null;
  let HW = 0, HH = 0, heroOn = true;
  function heroSize(){
    if(!fx || !hctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    HW = hero.clientWidth; HH = hero.clientHeight;
    if(HW < 2 || HH < 2) return;
    fx.width = Math.round(HW * dpr); fx.height = Math.round(HH * dpr);
    hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function waveLayer(c, t, baseY, amp, sp, col, foam){
    c.beginPath();
    for(let x = 0; x <= HW; x += 6){
      const y = baseY + Math.sin(x * 0.02 + t * sp) * amp + Math.sin(x * 0.045 - t * sp * 1.6) * amp * 0.5;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.lineTo(HW, HH + 4); c.lineTo(0, HH + 4); c.closePath();
    c.fillStyle = col; c.fill();
    if(foam){
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.5; c.beginPath();
      for(let x = 0; x <= HW; x += 6){
        const y = baseY + Math.sin(x * 0.02 + t * sp) * amp + Math.sin(x * 0.045 - t * sp * 1.6) * amp * 0.5;
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
  }
  function heroDraw(t){
    if(!hctx || !HW) return;
    hctx.clearRect(0, 0, HW, HH);
    waveLayer(hctx, t, HH * 0.80, 9, 1.4, 'rgba(20,140,160,.45)', false);
    waveLayer(hctx, t + 2, HH * 0.87, 11, 1.1, 'rgba(94,234,212,.4)', false);
    waveLayer(hctx, t + 4, HH * 0.93, 8, 1.7, 'rgba(255,255,255,.5)', true);
  }
  function tick(t){
    if(heroOn && !reduce) heroDraw(t / 1000);
    requestAnimationFrame(tick);
  }
  if('IntersectionObserver' in window) new IntersectionObserver(es => { heroOn = es[0].isIntersecting; }, {threshold: 0}).observe(hero);
  addEventListener('resize', () => { heroSize(); if(reduce) heroDraw(8); });
  addEventListener('load', () => { heroSize(); if(reduce) heroDraw(8); });
  heroSize();
  if(!reduce) requestAnimationFrame(tick); else heroDraw(8);
});
// video de fondo atado al scroll: bajar = avanzar, subir = retroceder (sin bucle)
(function(){
  const bv = document.getElementById('playaVideo');
  if(!bv) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ bv.pause(); return; } // quieto en el primer fotograma
  bv.pause();
  let dur = 0, target = 0;
  function progress(){
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  function updateTarget(){
    if(!dur || !isFinite(dur)) return;
    target = progress() * Math.max(0, dur - 0.05);
  }
  // persecución suave: hacia adelante se REPRODUCE (movimiento nativo fluido,
  // con velocidad según la distancia); hacia atrás se rebobina con micro-pasos
  // rápidos desde memoria; al llegar, micro-pausa exacta
  (function smooth(){
    if(dur && isFinite(dur)){
      const diff = target - bv.currentTime;
      const ad = Math.abs(diff);
      if(ad < 0.08){
        if(!bv.paused){ try{ bv.pause(); }catch(e){} }
        if(ad > 0.02){
          try{ bv.currentTime = target; }catch(e){}
        }
      }else if(diff > 0){
        try{
          const rate = Math.min(6, Math.max(0.6, 0.6 + diff * 0.8));
          if(Math.abs(bv.playbackRate - rate) > 0.1) bv.playbackRate = rate;
          if(bv.paused){ const p = bv.play(); if(p && p.catch) p.catch(()=>{}); }
        }catch(e){}
      }else{
        if(!bv.paused){ try{ bv.pause(); }catch(e){} }
        try{ bv.currentTime = bv.currentTime + Math.max(diff * 0.3, -0.18); }catch(e){}
      }
    }
    requestAnimationFrame(smooth);
  })();
  bv.addEventListener('loadedmetadata', ()=>{ dur = bv.duration || 0; updateTarget(); });
  if(bv.readyState >= 1 && bv.duration){ dur = bv.duration; updateTarget(); }
  // precarga en memoria (blob URL: seeks instantáneos en file:// y cualquier servidor)
  fetch('playa.mp4').then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>{
    bv.src = URL.createObjectURL(b);
  }).catch(()=>{
    const s = document.createElement('source'); s.src = 'playa.mp4'; s.type = 'video/mp4';
    bv.appendChild(s); bv.load();
  });
  addEventListener('scroll', updateTarget, {passive:true});
  addEventListener('resize', updateTarget);
  updateTarget();
})();
// ---------- asignación de botones en el sitio ----------
function playaAssign(){
  const IMG = (n)=>'img/'+n;
  seaFy(document.getElementById('homeBuscarBtn'), IMG('cueva-peces.webp'), 'arrecife');
  const hintFx = [[IMG('laguna-guama.webp'),'rio'],[IMG('sendero-manglar.webp'),'polen'],[IMG('buceo-arrecife.webp'),'bote'],[IMG('amanecer-laguna.webp'),'brisa'],[IMG('flamencos-salinas.webp'),'vinales']];
  document.querySelectorAll('.home-hints button').forEach((b,i)=>{ const m = hintFx[i % hintFx.length]; seaFy(b, m[0], m[1]); });
  const cardFx = {'lugares.html':[IMG('laguna-guama.webp'),'rio'],'secretos.html':[IMG('sendero-manglar.webp'),'polen'],'fauna-flora.html':[IMG('tocororo.webp'),'vinales'],'actividades.html':[IMG('buceo-arrecife.webp'),'bote'],'historia.html':[IMG('playa-giron.webp'),'capitolio'],'gastronomia.html':[IMG('amanecer-laguna.webp'),'trinidad'],'guia.html':[IMG('hero-humedal.webp'),'brisa'],'servicios.html':[IMG('cueva-peces.webp'),'arrecife'],'provincias.html':[IMG('hero-humedal.webp'),'plaza']};
  document.querySelectorAll('.cat-card').forEach((a)=>{
    const href = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
    const m = cardFx[href] || [IMG('hero-humedal.webp'), 'playa'];
    seaFy(a.querySelector('.ver') || a, m[0], m[1]);
  });
  document.querySelectorAll('.btn').forEach((b)=>seaFy(b, IMG('hero-humedal.webp'), 'playa'));
  document.querySelectorAll('.share-btn').forEach((b,i)=>{ const m = hintFx[i % hintFx.length]; seaFy(b, m[0], m[1]); });
}
playaAssign();
seaSplashSize();
addEventListener('resize', ()=>{ seaSplashSize(); seaBtns.forEach(seaSize); });
if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>seaBtns.forEach(seaSize));
addEventListener('load', ()=>{ seaBtns.forEach(seaSize); });
requestAnimationFrame(seaLoop);
