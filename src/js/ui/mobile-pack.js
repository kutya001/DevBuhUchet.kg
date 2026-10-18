'use strict';
// Компоновка форм на телефоне: короткие поля по два в строку
/* ═════════════ Mobile form packing ═════════════
   Правило ТЗ «Компоновка форм на телефоне» (до 600 px):
   - формы изменения (.form): пара полей, стоящая в одной строке на ПК, остаётся парой, если оба поля короткие
     (дата, месяц, время, число, сумма, переключатель, галочка, выпадающий список с короткими значениями);
     иначе оба поля идут на всю ширину; текст, описания, телефоны, файлы и таблицы — всегда на всю ширину;
   - формы просмотра (.kv): подряд идущие короткие значения встают по два, длинные — на всю ширину.
   На ПК ничего не меняется: классы m-half и m-full действуют только в мобильной ширине. */
const PACK_W=600;
let packCanvas=null;
function textW(s,el){if(!packCanvas)packCanvas=document.createElement('canvas');const cx=packCanvas.getContext('2d');const cs=getComputedStyle(el);cx.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;return cx.measureText(s).width}
// Поле формы короткое, если его содержимое помещается в половину строки
function fldShort(f,colW){
  if(f.classList.contains('full')||f.style.gridColumn)return false;
  const lab=f.querySelector(':scope>label,:scope>.lbl');if(lab&&textW(lab.textContent.trim(),lab)>colW)return false;
  if(f.querySelector('textarea,input[type=file],table,.grid,.ph-in,.chips,.box'))return false;
  const ctl=[...f.querySelectorAll('input,select,.seg')].filter(x=>!x.closest('.hint'));if(!ctl.length)return false;
  return ctl.every(x=>{
    if(x.matches('.seg'))return [...x.children].reduce((a,b)=>a+textW(b.textContent.trim(),b)+24,8)<=colW;
    if(x.tagName==='SELECT'){if(x.multiple)return false;const w=Math.max(...[...x.options].map(o=>textW(o.textContent.trim(),x)),0);return w+40<=colW}
    const t=(x.getAttribute('type')||'text').toLowerCase();
    if(['date','month','time','week','number','datetime-local'].includes(t))return true;
    if(t==='checkbox'||t==='radio'){const l=x.closest('label');return !l||textW(l.textContent.trim(),l)+48<=colW}
    if(t==='hidden')return true;
    const im=x.getAttribute('inputmode');return im==='decimal'||im==='numeric';
  });
}
function packForm(form){
  const kids=[...form.children].filter(k=>k.offsetParent!==null||k.matches('div:empty'));
  const colW=(form.clientWidth-14)/2;const rows=[];let cur=[];
  // Раскладка, как на ПК: «на всю ширину» занимает строку, остальные — по две ячейки
  kids.forEach(k=>{const full=!k.classList.contains('fld')||k.classList.contains('full')||/-1/.test(k.style.gridColumn);
    if(k.matches('div:empty')&&!k.className){cur.push(null);if(cur.length===2){rows.push(cur);cur=[]}return}
    if(full){if(cur.length)rows.push(cur);cur=[];rows.push([k]);return}
    cur.push(k);if(cur.length===2){rows.push(cur);cur=[]}});
  if(cur.length)rows.push(cur);
  rows.forEach(r=>{const f=r.filter(Boolean);const two=f.length===2&&f.every(x=>x.classList.contains('fld')&&fldShort(x,colW));
    f.forEach(x=>{x.classList.toggle('m-half',two);x.classList.toggle('m-full',!two)})});
}
function kvShort(d,colW){
  if(d.querySelector('table,.grid,.box,ul,.chips'))return false;
  return d.innerText.split('\n').every(line=>textW(line.trim(),d.querySelector('.v,dd')||d)<=colW);
}
function packKv(kv){
  const items=[...kv.children].filter(k=>k.offsetParent!==null);const colW=(kv.clientWidth-18)/2;
  for(let i=0;i<items.length;i++){const a=items[i],b=items[i+1];
    if(b&&kvShort(a,colW)&&kvShort(b,colW)){a.classList.add('m-half');a.classList.remove('m-full');b.classList.add('m-half');b.classList.remove('m-full');i++}
    else{a.classList.add('m-full');a.classList.remove('m-half')}}
}
let packQ=false,packWas=false;
function packAll(){packQ=false;const mob=innerWidth<=PACK_W;
  if(!mob){if(packWas)document.querySelectorAll('.m-half,.m-full').forEach(x=>x.classList.remove('m-half','m-full'));packWas=false;return}
  packWas=true;
  document.querySelectorAll('.form,.kv').forEach(c=>{if(c.offsetParent===null)return;c.classList.add('m-pack');if(c.classList.contains('form'))packForm(c);else packKv(c)});
}
function packSoon(){if(packQ)return;packQ=true;requestAnimationFrame(packAll)}
new MutationObserver(packSoon).observe(document.documentElement,{childList:true,subtree:true});
addEventListener('resize',packSoon);
