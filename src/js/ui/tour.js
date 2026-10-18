'use strict';
// Обучение: пошаговые подсказки, «Войти как»
/* ═════════════ Обучение (пошаговые подсказки) ═════════════ */
const TOUR={on:false,steps:[],i:0,mode:'full'};
// «Показать как» в Базе знаний: пошаговые подсказки по одному шагу урока
function tourSteps(mode){return TOUR.custom||[]}
function tourStart(mode,i){MODALS.slice().forEach(m=>m.close());closeSheet();closePop();
  TOUR.mode=mode;TOUR.steps=tourSteps(mode);if(!TOUR.steps.length)return;TOUR.i=Math.min(i||0,TOUR.steps.length-1);TOUR.on=true;
  if(!$('#tour')){const o=document.createElement('div');o.id='tour';o.innerHTML='<div class="tour-hole"></div><div class="tour-bub" role="dialog" aria-live="polite"></div>';document.body.appendChild(o);
    o.addEventListener('click',e=>{const b=e.target.closest('[data-tour]');if(!b)return;const a=b.dataset.tour;if(a==='next')tourGo(1);if(a==='prev')tourGo(-1);if(a==='skip')tourEnd(true)});
    const bub=o.querySelector('.tour-bub');let x0=null,t0=0;bub.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;t0=performance.now()},{passive:true});
    bub.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,v=dx/Math.max(1,performance.now()-t0);x0=null;if(Math.abs(dx)>60||Math.abs(v)>FLICK&&Math.abs(dx)>SLOP)tourGo(dx<0?1:-1)});
    addEventListener('resize',()=>TOUR.on&&tourPlace())}
  $('#tour').hidden=false;tourShow()}
function tourGo(d){const j=TOUR.i+d;if(j<0)return;if(j>=TOUR.steps.length){tourEnd(false);return}TOUR.i=j;tourShow()}
function tourEnd(skipped){TOUR.on=false;$('#tour').hidden=true;ckBar();if(TOUR.mode==='full'){store.set('tour.'+S.me,{done:true,i:0});toast(skipped?'Обучение пропущено. Запустить заново можно из «?» в верхней панели':'Обучение пройдено. Запустить заново можно из «?» в верхней панели','help')}}
function tourShow(){const s=TOUR.steps[TOUR.i];if(TOUR.mode==='full')store.set('tour.'+S.me,{done:false,i:TOUR.i});
  const need=s[0]&&(S.mod!==s[0]||(s[1]&&S.tab!==s[1]));if(need)go(s[0],s[1]);
  const bub=$('#tour .tour-bub');const n=TOUR.steps.length;
  bub.innerHTML=`<div class="tour-n">${TOUR.i+1} из ${n}</div><b>${esc(s[4])}</b><p>${esc(s[5])}</p><div class="row"><button class="linkbtn" data-tour="skip">${TOUR.mode==='full'?'Пропустить обучение':'Закрыть'}</button><div class="grow"></div>${TOUR.i?'<button class="btn sm ghost" data-tour="prev">Назад</button>':''}<button class="btn sm cta" data-tour="next">${TOUR.i===n-1?'Готово':'Далее'}</button></div>`;
  setTimeout(tourPlace,need?180:0)}
function tourPlace(){const s=TOUR.steps[TOUR.i];if(!s)return;const mob=isMobile();const el=$(mob?s[3]:s[2]);const hole=$('#tour .tour-hole'),bub=$('#tour .tour-bub');
  const W=innerWidth,H=innerHeight;let r=null;
  if(el&&el.getClientRects().length){if(el.closest('#pane')){const b=el.getBoundingClientRect();if(b.top<60||b.top>H*.55)el.scrollIntoView({block:'start'})}r=el.getBoundingClientRect();
    const pad=6;r={left:Math.max(4,r.left-pad),top:Math.max(4,r.top-pad),width:Math.min(W-8,r.width+pad*2),height:Math.min(H-8,r.height+pad*2)}}
  if(r){Object.assign(hole.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',opacity:1})}else Object.assign(hole.style,{left:W/2+'px',top:H/2+'px',width:'0px',height:'0px',opacity:1});
  const bw=Math.min(360,W-24);bub.style.width=bw+'px';const bh=bub.offsetHeight;let x,y;
  if(mob){x=12;y=r&&r.top+r.height/2>H/2?Math.max(12,r.top-bh-12):H-bh-12-(env()||0);if(r&&y<r.top+r.height&&y+bh>r.top)y=12}
  else if(!r){x=(W-bw)/2;y=(H-bh)/2}
  else{x=Math.min(W-bw-12,Math.max(12,r.left));y=r.top+r.height+12;if(y+bh>H-12){y=r.top-bh-12;if(y<12){x=r.left+r.width+12;y=Math.max(12,Math.min(H-bh-12,r.top));if(x+bw>W-12)x=Math.max(12,r.left-bw-12)}}}
  bub.style.left=x+'px';bub.style.top=y+'px'}
const env=()=>0;

function switchUser(id){Object.keys(GS).forEach(k=>delete GS[k]);if(id!=='admin'){const e=EMP.find(x=>x.id===id);if(e&&e.active===false){toast('Учётная запись заблокирована: войти под ней нельзя','lock');$$('#demo-user,#demo-user-m').forEach(s=>s.value=S.me);return}}S.me=id;CK.active=null;CK.bar=false;ckBar();ckBase();MODALS.slice().forEach(m=>m.close());closeSheet();S.mod=null;S.tab=null;derive();location.hash='';go(isAdmin()?'accounts':'home');renderSide();renderSheetDot();toast(`Вы вошли как: ${me().fio}`,'user');kbWelcome()}

