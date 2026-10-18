'use strict';
// ГКЭД: справочник видов экономической деятельности (gkedDB.json) и правила «Виды деятельности (ГКЭД)» у режимов, ставок ЕН, льгот и видов отчётов
/* ═════════════ ГКЭД — Государственный классификатор видов экономической деятельности КР, ред. 2022 ═════════════ */
/* Запись: {code, name, level: section|subsection|division|group|class|subclass, parent, active, note}.
   Связь с налогами хранится не в ГКЭД, а в поле gked:{in:[…], ex:[…]} у режима, ставки ЕН, льготы и вида отчёта:
   in — коды или начала кодов (секция — буквой), ex — список «Кроме»; пустое правило — без ограничения;
   main — проверяется только основной ГКЭД; who:'org' — перечень только для организаций; strict:'main' — основной ГКЭД из «Кроме» не даёт сохранить (режим «Единый налог», ст. 419). */
const GK=DB.ref.gked;
const GK_LV={section:'Секция',subsection:'Подсекция',division:'Раздел',group:'Группа',class:'Класс',subclass:'Подкласс'};
const GK_LVS=Object.keys(GK_LV);
let GKM={},GKKIDS={};
function gkIndex(){GKM={};GKKIDS={};GK.forEach(x=>{GKM[x.code]=x});GK.forEach(x=>{if(x.parent)(GKKIDS[x.parent]=GKKIDS[x.parent]||[]).push(x.code)})}
gkIndex();
const gkKids=code=>(GKKIDS[code]||[]).map(k=>GKM[k]).filter(Boolean);
// Контрагенту выбирается только код нижнего уровня — подкласс
const gkLeaf=x=>!!x&&x.level==='subclass';
function gkUp(code){const a=[];let x=GKM[code],n=0;while(x&&x.parent&&n<8){x=GKM[x.parent];if(x)a.push(x.code);n++}return a}
function gkSec(code){const x=GKM[code];if(x&&x.level==='section')return x.code;return gkUp(code).find(k=>GKM[k].level==='section')||''}
const gkName=code=>(GKM[code]||{}).name||'';
const gkT=code=>code?`${code} — ${gkName(code)||'код не найден в справочнике'}`:'';
const gkOff=code=>!!code&&(!GKM[code]||GKM[code].active===false);
const cpCodes=c=>[c&&c.gked,...((c&&c.gked2)||[])].filter(Boolean);
// Код подходит под начало кода p: «47» — весь раздел, «47.1» — группа, «G» — вся секция
const gkHit=(code,p)=>/^[A-Z]+$/.test(p)?code===p||gkUp(code).includes(p):code===p||code.startsWith(p);
const gkEmpty=r=>!r||(!(r.in||[]).length&&!(r.ex||[]).length);
// Какие из кодов подходят под правило; null — правило пустое (без ограничения)
function gkFit(r,codes,c){if(gkEmpty(r))return null;if(r.main&&c)codes=c.gked?[c.gked]:[];return codes.filter(c=>(!(r.in||[]).length||r.in.some(p=>gkHit(c,p)))&&!(r.ex||[]).some(p=>gkHit(c,p)))}
const gkRuleTxt=r=>gkEmpty(r)?'':[(r.in||[]).length?(r.in||[]).join(', '):'все',(r.ex||[]).length?'кроме '+r.ex.join(', '):''].filter(Boolean).join('; ');
// Ввод перечня: коды через запятую, точку с запятой или пробел; каждый код должен быть в справочнике
function gkParse(s){const a=String(s||'').split(/[,;\s]+/).map(x=>x.trim().toUpperCase()).filter(Boolean);const bad=a.filter(p=>!GKM[p]);
  return bad.length?{err:`Нет в справочнике ГКЭД: ${bad.join(', ')}`}:{v:[...new Set(a)]}}
// Поиск: по коду или началу кода и по словам названия
function gkSearch(q,o={}){const s=norm(q||'').trim();const words=s.split(/\s+/).filter(Boolean);
  return GK.filter(x=>(!o.leaf||gkLeaf(x))&&(o.all||x.active!==false)&&(!s||x.code.toLowerCase().startsWith(s)||words.every(w=>norm(x.name).includes(w))))}

/* Ставка единого налога по виду деятельности: строка ст. 423 с самым точным совпадением */
const GK_EN_SPECIAL=['ЕНС-05','ЕНС-07','ЕНС-14'];
// Ставки для особого статуса: предлагаются только контрагенту с этим статусом, и тогда — первой
const GK_EN_BEN={'ЕНС-13':'Резидент ПКИ'};
const GK_EN_ONE=['ЕНС-01','ЕНС-13','ЕНС-15'];
// Строки ст. 423 с самым точным совпадением (несколько — если ставка зависит от выручки или признаков контрагента); иначе «Остальные виды деятельности»
function gkEnRows(code,c){const bens=(c&&c.ben)||[];const sb=(EN_TABLE||[]).filter(x=>GK_EN_BEN[x.code]&&bens.includes(GK_EN_BEN[x.code])&&!gkEmpty(x.gked)&&gkFit(x.gked,[code]).length);if(sb.length)return sb;
  let best=[],bl=-1;(EN_TABLE||[]).forEach(x=>{const r=x.gked;if(GK_EN_BEN[x.code]||gkEmpty(r)||!(r.in||[]).length)return;if(!gkFit(r,[code]).length)return;const l=Math.max(...r.in.filter(p=>gkHit(code,p)).map(p=>/^[A-Z]+$/.test(p)?0:p.length));if(l>bl){bl=l;best=[x]}else if(l===bl)best.push(x)});
  // Реэкспорт, ввоз в СЭЗ и деятельность вне КР — признаки контрагента, а не вида деятельности: такие ставки не предлагаются, если есть обычная
  const base=best.filter(x=>!GK_EN_SPECIAL.includes(x.code));if(base.length)best=base;
  if(!best.length){const o=(EN_TABLE||[]).find(x=>x.code==='ЕНС-04');if(o)best=[o]}return best}
const gkEnRow=(code,c)=>gkEnRows(code,c)[0]||null;
const gkFitType=(t,c)=>{const f=gkFit(t.gked,cpCodes(c),c);return !!(f&&f.length)};

/* Сверка контрагента с ГКЭД: режимы, льготы, ставка ЕН, назначенные отчёты. Ничего не меняет, только предупреждает */
// Перечень помечен «сверить» — к предупреждению добавляется оговорка; verify — перечень по документу, сверяются отдельные позиции
const gkVer=r=>!r?'':r.verify?' (часть перечня ещё сверяется)':/сверить/i.test(r.note||'')?' (перечень ещё сверяется)':'';
const gkToVerify=r=>!!r&&(!!r.verify||/сверить/i.test(r.note||''));
function gkCheck(c,sel){const codes=cpCodes(c);const out={block:[],regime:[],ben:[],rate:[],types:[],off:codes.filter(gkOff)};if(!codes.length)return out;
  regsOf(c).forEach(n=>{const r=DICT.regimes.items.find(x=>x.name===n);if(!r||gkEmpty(r.gked))return;const g=r.gked;
    // who:'org' — перечень задан только для организаций (у ИП — по другому перечню), ИП не проверяется
    if(g.who==='org'&&formEnd(c)==='ip')return;
    if(g.strict==='main'&&c.gked&&(g.ex||[]).some(p=>gkHit(c.gked,p))){out.block.push(`Режим «${n}» нельзя применять при основном ГКЭД ${c.gked}: этот вид деятельности запрещён для него (${((g.note||'').match(/ст\. \d+/)||[])[0]||r.art||'НК КР'})`);return}
    const bad=codes.filter(k=>(g.ex||[]).some(p=>gkHit(k,p)));const f=gkFit(g,codes,c);
    if(!f.length)out.regime.push(`Режим «${n}» не подходит к видам деятельности контрагента${gkVer(g)}`);else if(bad.length)out.regime.push(`Режим «${n}» не применяется к ГКЭД ${bad.join(', ')}: по этим видам деятельности — другой режим${gkVer(g)}`)});
  benOf(c).forEach(b=>{const f=gkFit(b.gked,codes,c);if(f&&!f.length)out.ben.push(`Виды деятельности контрагента не соответствуют статусу «${b.name}»${gkVer(b.gked)}`)});
  if(regsOf(c).includes('Единый налог')&&c.gked){const ms=gkEnRows(c.gked,c),m=ms[0];if(m)out.rate.push(`Ставка единого налога по основному ГКЭД ${c.gked}: ${ms.map(x=>`${x.rate} (${x.activity})`).join(' или ')}`);
    // ЕНС-01, ЕНС-13, ЕНС-15 — одна ставка на всю деятельность: по дополнительным ГКЭД налог отдельно не считается
    const one=ms.filter(x=>GK_EN_ONE.includes(x.code));
    if(one.length===ms.length){if((c.gked2||[]).length)out.rate.push(`При этой ставке налог считается по ней со всей деятельности, дополнительные виды отдельно не облагаются (ст. 423 ч. 7)`)}
    else (c.gked2||[]).forEach(k=>{const x=gkEnRow(k,c);if(x&&m&&x.rate!==m.rate)out.rate.push(`ГКЭД ${k}: ставка ${x.rate} (${x.activity}) — налог считается отдельно по каждому виду деятельности (ст. 423 ч. 7)${one.length?`; при ставке ${one.map(o=>o.rate).join(', ')} — одна ставка на всю деятельность`:''}`)})}
  const ids=sel?[...sel]:(c.assign||[]).filter(a=>!a.to).map(a=>a.t);ids.forEach(id=>{const t=T[id];const f=t&&gkFit(t.gked,codes,c);if(f&&!f.length)out.types.push(t.short)});
  return out}
// Ставка ЕН из каталога видов, которая соответствует основному ГКЭД (если такая есть в списке ставок вида)
function gkEnRate(c,t){const m=c&&c.gked&&gkEnRow(c.gked,c);const r=m&&(String(m.rate).match(/\d+(,\d+)? %/)||[])[0];return r&&t&&t.rates&&t.rates.includes(r)?r:null}
// Excel: «47, 56.10; кроме 47.26» ↔ {in, ex}; «все; кроме …» — только исключения; пусто — без ограничения
function gkRuleIn(v){const s=String(v||'').trim();if(!s||norm(s)==='все')return {in:[],ex:[]};const[a,b]=s.split(/;\s*кроме\s*/i);const A=norm(a).trim()==='все'?{v:[]}:gkParse(a),B=gkParse(b||'');
  if(A.err||B.err)return {err:'«Виды деятельности (ГКЭД)»: '+(A.err||B.err)};return {in:A.v,ex:B.v}}
// Новый перечень сохраняет служебные признаки правила (по основному, запрет, примечание «сверить»)
const gkRuleKeep=(o,n)=>Object.assign({},o||{},{in:n.in||[],ex:n.ex||[]});
