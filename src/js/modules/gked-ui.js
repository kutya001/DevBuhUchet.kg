'use strict';
// ГКЭД в формах: выбор вида деятельности поиском, поля «Основной» и «Дополнительные», предупреждения по налогам
/* ═════════════ ГКЭД: выбор, поля контрагента, сверка с налогами ═════════════ */
const GK_MAX=80;
// Окно выбора: поиск по коду, началу кода или словам названия; выбираются только коды нижнего уровня
function gkPickDlg({title='Вид деятельности (ГКЭД)',exclude=[],cur='',onPick}){const st={q:''};
  const path=x=>gkUp(x.code).reverse().join(' › ');
  const list=()=>{const l=gkSearch(st.q,{leaf:true});return `<div class="gk-n hint">${l.length?`Найдено: ${l.length}${l.length>GK_MAX?` — показаны первые ${GK_MAX}, уточните поиск`:''}`:'Ничего не найдено: попробуйте начало кода, например «47», или слово из названия'}</div>
    <div class="gk-list" role="listbox">${l.slice(0,GK_MAX).map(x=>{const ex=exclude.includes(x.code);return `<button type="button" class="gk-i ${x.code===cur?'on':''}" data-gk="${esc(x.code)}" ${ex?'disabled title="Уже указан у контрагента"':''} role="option"><span class="mono strong">${esc(x.code)}</span><span class="grow">${esc(x.name)}<small>${esc(path(x))}</small></span>${x.code===cur?ic('check','sm'):''}</button>`}).join('')}</div>`};
  openModal({size:'mid',noMax:true,render:m=>({title,sub:`Справочник ГКЭД, ред. 2022 · выбирается код нижнего уровня`,
    body:`<div class="search gk-q"><span>${ic('search')}</span><input id="gk-q" value="${esc(st.q)}" placeholder="Код или слово, например 69.20 или бухгалтер" autocomplete="off" aria-label="Поиск по ГКЭД"></div><div id="gk-res">${list()}</div>`,
    foot:'<button class="btn ghost" data-close>Отмена</button>',
    mount(el){const q=$('#gk-q',el);q.focus();q.oninput=()=>{st.q=q.value;$('#gk-res',el).innerHTML=list()};
      $('#gk-res',el).onclick=e=>{const b=e.target.closest('[data-gk]');if(!b||b.disabled)return;m.close();onPick(b.dataset.gk)}}})})}
// Поля контрагента: основной (обязателен) и дополнительные (сколько угодно, без повтора основного)
function gkFields(p,st){const off=c=>gkOff(c)?` <span class="pill yellow sm">${ic('alert')}Не действует</span>`:'';
  return `${fld('Основной вид деятельности (ГКЭД)',`<button type="button" class="btn gk-main ${st.gked?'':'gk-empty'}" id="${p}-gk">${ic('search','sm')}<span>${st.gked?esc(gkT(st.gked)):'Выбрать вид деятельности'}</span></button>${off(st.gked)}`,{req:true,full:true,id:p+'-gk',hint:'Поиск по коду или названию, например «69.20 — Деятельность в области бухгалтерского учёта»'})}
    ${fld('Дополнительные виды деятельности (ГКЭД)',`<div class="gk-x" id="${p}-gkx">${st.gked2.map(c=>`<span class="chip gk-chip" title="${esc(gkT(c))}"><span><b>${esc(c)}</b> ${esc(gkName(c))}</span>${off(c)}<button type="button" data-gkdel="${esc(c)}" aria-label="Убрать ${esc(c)}">${ic('x','sm')}</button></span>`).join('')}<button type="button" class="btn sm" data-gkadd>${ic('plus','sm')}Добавить</button></div>`,{full:true,id:p+'-gkx',hint:'Сколько угодно кодов; основной повторять нельзя'})}`}
function gkBind(el,p,st,redraw){const b=$('#'+p+'-gk',el);if(b)b.onclick=()=>gkPickDlg({title:'Основной вид деятельности (ГКЭД)',cur:st.gked,exclude:st.gked2,onPick:c=>{st.gked=c;redraw()}});
  const x=$('#'+p+'-gkx',el);if(x)x.onclick=e=>{const d=e.target.closest('[data-gkdel]');if(d){st.gked2=st.gked2.filter(k=>k!==d.dataset.gkdel);redraw();return}
    if(e.target.closest('[data-gkadd]'))gkPickDlg({title:'Дополнительный вид деятельности (ГКЭД)',exclude:[st.gked,...st.gked2].filter(Boolean),onPick:c=>{st.gked2=[...st.gked2,c];redraw()}})}}
// Предупреждения: режим, льготы и статусы, назначенные отчёты не подходят к видам деятельности; ставка ЕН по ГКЭД. Ничего не меняется само
function gkNote(c,sel){if(!c.gked&&!(c.gked2||[]).length)return '';const k=gkCheck(c,sel);const warn=[...k.block,...k.regime,...k.ben,...(k.types.length?[`Не подходят по ГКЭД назначенные отчёты: ${k.types.join(', ')}`]:[]),...k.off.map(x=>`Код ${x} больше не действует: замените его`)];
  return `${warn.length?`<div class="note warn gk-warn">${ic('alert')}<span>${warn.map(esc).join('<br>')}</span></div>`:''}${k.rate.length?`<div class="note">${ic('info')}<span>${k.rate.map(esc).join('<br>')}</span></div>`:''}`}
// Отметка «Подходит по ГКЭД» у видов отчётов при назначении
function gkFitHint(c,sel){const codes=cpCodes(c);if(!codes.length)return '';const fit=RT.filter(t=>ORG.types[t.id]&&ORG.types[t.id].on&&t.active!==false&&gkFitType(t,c));if(!fit.length)return '';
  const miss=fit.filter(t=>!sel.has(t.id));return `<div class="hint">${ic('check','sm')} Подходит по ГКЭД: ${fit.map(t=>esc(t.short)).join(', ')}${miss.length?` · не выбраны: ${miss.map(t=>esc(t.short)).join(', ')}`:''}</div>`}
// Ввод перечня «Виды деятельности (ГКЭД)» и «Кроме» в формах справочников
// warnOn — у статусов: поле «Предупреждать при ГКЭД» (коды, при которых статус можно выбрать только с предупреждением)
function gkRuleFields(p,r,raw,warnOn){r=r||{};raw=raw||{};const note=(r.note?`<div class="note ${gkToVerify(r)&&!r.verify?'warn':''} full" style="grid-column:1/-1">${ic(gkToVerify(r)&&!r.verify?'alert':'info')}<span>Примечание к перечню: ${esc(r.note)}</span></div>`:'')+(r.verify?`<div class="note warn full" style="grid-column:1/-1">${ic('alert')}<span>Сверить: ${esc(r.verify)}</span></div>`:'');
  return `${note}${fld('Виды деятельности (ГКЭД)',inp(p+'-gin',raw.in!=null?raw.in:(r.in||[]).join(', '),'class="inp mono" placeholder="Например: 47, 56.10, G"'),{full:true,id:p+'-gin',hint:'Коды или начала кодов через запятую; секция — буквой. Пусто — для всех видов деятельности'})}
  ${fld('Кроме (ГКЭД)',inp(p+'-gex',raw.ex!=null?raw.ex:(r.ex||[]).join(', '),'class="inp mono" placeholder="Например: 47.26"'),{full:true,id:p+'-gex',hint:'Виды деятельности, для которых не подходит'})}
  ${warnOn||(r.warn||[]).length?fld('Предупреждать при ГКЭД',inp(p+'-gwarn',raw.warn!=null?raw.warn:(r.warn||[]).join(', '),'class="inp mono" placeholder="Например: 64.92.0, 05"'),{full:true,id:p+'-gwarn',hint:'При таком основном ГКЭД статус предлагается с жёлтым предупреждением «Проверьте право по виду деятельности»'}):''}`}
// undefined — ошибка в кодах, null — пусто (без ограничения), иначе {in, ex} с прежними признаками правила
function gkRuleRead(el,p,old){const a=gkParse(val(el,p+'-gin')),b=gkParse(val(el,p+'-gex')),w=$('#'+p+'-gwarn',el)?gkParse(val(el,p+'-gwarn')):null;const ok=[setErr(el,p+'-gin',a.err||''),setErr(el,p+'-gex',b.err||''),w?setErr(el,p+'-gwarn',w.err||''):true].every(Boolean);
  if(!ok)return undefined;const wv=w?w.v:(old&&old.warn)||[];if(!a.v.length&&!b.v.length&&!wv.length)return null;const r=gkRuleKeep(old,{in:a.v,ex:b.v});if(wv.length)r.warn=wv;else delete r.warn;return r}
const gkRaw=(el,p)=>$('#'+p+'-gin',el)?{in:val(el,p+'-gin'),ex:val(el,p+'-gex'),warn:$('#'+p+'-gwarn',el)?val(el,p+'-gwarn'):undefined}:undefined;
const gkRuleSame=(a,b)=>gkRuleTxt(a)===gkRuleTxt(b)&&((a||{}).warn||[]).join()===((b||{}).warn||[]).join();
// Льгота или статус не подходит к видам деятельности: сохранить можно после подтверждения, в карточке останется жёлтая отметка
function gkBenOk(c,st,again){const b=gkCheck(c).ben;if(!b.length||st.gkBenOk===gkSig(c))return true;
  confirmDlg({title:'Сохранить с несоответствием?',text:esc(b.join('. '))+'. Перечни видов деятельности для статусов ещё сверяются с законами, поэтому сохранить можно; в карточке останется предупреждение.',ok:'Сохранить',run:()=>{st.gkBenOk=gkSig(c);again()}});return false}
const gkSig=c=>JSON.stringify([c.gked,c.gked2,c.ben]);
// Карточка контрагента, «Основное»: основной ГКЭД первым, дополнительные списком ниже; без ГКЭД — предупреждение
function gkKv(c){const off=k=>gkOff(k)?` <span class="pill yellow sm">${ic('alert')}Не действует — замените</span>`:'';const row=k=>`<div><span class="mono strong">${esc(k)}</span> ${esc(gkName(k))}${off(k)}</div>`;
  return `<div><span class="k">Основной вид деятельности (ГКЭД)</span><span class="v">${c.gked?row(c.gked):`<span class="pill yellow">${ic('alert')}Укажите основной вид деятельности (ГКЭД)</span>${can('createCp')&&!c.archived?` <button type="button" class="linkbtn" data-gkfix="${c.id}">Указать</button>`:''}`}</span></div>
    ${(c.gked2||[]).length?`<div><span class="k">Дополнительные виды деятельности</span><span class="v">${c.gked2.map(row).join('')}</span></div>`:''}`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-gkfix]');if(b){const c=CPM[b.dataset.gkfix];if(c)editCpDlg(c)}});
// Фильтр списка контрагентов по ГКЭД: код, начало кода («47» — вся розничная торговля) или секция («G»); основной и дополнительные коды; иначе — по словам названия
function gkMatch(c,q){const Q=String(q||'').trim().toUpperCase();if(!Q)return true;const ks=cpCodes(c);if(/^([A-Z]{1,2}|\d\d(\.[\d.]*)?)$/.test(Q))return ks.some(k=>gkHit(k,Q));const n=norm(Q);return ks.some(k=>norm(gkName(k)).includes(n))}
