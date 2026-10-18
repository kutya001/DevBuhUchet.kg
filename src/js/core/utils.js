'use strict';
// Общие утилиты: $, esc, store (localStorage), случайные числа, даты по времени Бишкека
/* ═════════════ Utils ═════════════ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MEMSTORE={};const ukey=k=>/^(g5|stats)\./.test(k)&&typeof S!=='undefined'&&S.me?k.replace('.','.'+S.me+'.'):k;const store={get(k,d){k=ukey(k);if(k in MEMSTORE)return MEMSTORE[k];try{const v=localStorage.getItem('bu.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){k=ukey(k);MEMSTORE[k]=v;try{localStorage.setItem('bu.'+k,JSON.stringify(v))}catch(e){}}};
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=mulberry(20261011);
const pick=a=>a[Math.floor(R()*a.length)];
const rint=(a,b)=>a+Math.floor(R()*(b-a+1));
const isMobile=()=>matchMedia('(max-width: 767px)').matches;
const plural=(n,a,b,c)=>{const m=Math.abs(n)%100,k=m%10;return m>10&&m<20?c:k>1&&k<5?b:k===1?a:c};

/* Dates — everything in Bishkek time (UTC+6) */
function bishkekNow(){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bishkek',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
  const g=t=>(p.find(x=>x.type===t)||{}).value;
  return {iso:`${g('year')}-${g('month')}-${g('day')}`,hm:`${g('hour')}:${g('minute')}`};
}
let TODAY=bishkekNow().iso;

