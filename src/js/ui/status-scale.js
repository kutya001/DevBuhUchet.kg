'use strict';
// Шкала статусов, переходы, откат, «История статусов»
/* ═════════════ Шкала статусов и история статусов ═════════════ */
const SCALES={
 rep:{map:()=>ST,steps:['К сдаче','В работе','Сдан','Принят'],side:{'Требует исправления':{at:2,cls:'red'}},none:['Не требуется']},
 pay:{map:()=>PST,steps:['Не оплачено','Оплачено частично','Оплачено'],none:['Не требуется']},
 task:{map:()=>TST,steps:['К выполнению','В работе','Выполнена'],side:{'Не выполнена':{at:2,cls:'red'},'Отменена':{at:2,cls:'faint'}}},
 svc:{map:()=>SVST,steps:['Обслуживается','Приостановлен','В архиве']},
 proj:{map:()=>PRS,steps:['Планируется','В работе','Завершён'],side:{'Отменён':{at:2,cls:'faint'}}},
 ind:{map:()=>KST,steps:['Не заполнено','Заполнено','Проверено']}};
const SC_NAME={rep:'Сдача',pay:'Оплата',task:'Задача',svc:'Обслуживание',proj:'Проект',ind:'Заполнение месяца'};
function scPos(k,st){const D=SCALES[k];let i=D.steps.indexOf(st),side=null;if(i<0&&D.side&&D.side[st]){side=D.side[st];i=side.at}return {i,side,n:D.steps.length}}
const scCol=(k,st)=>((SCALES[k].map()[st])||['gray'])[0];
const objOf=(k,id)=>k==='rep'||k==='pay'?REPORTS.find(x=>x.id===+id):k==='task'?TASKS.find(x=>x.id===id):k==='svc'?CPM[+id]:k==='proj'?PROJECTS.find(x=>x.id===id):k==='ind'?KMI[id]:null;
function stSince(k,o){if(!o)return null;const h=statusHist(k,o);return h.length?h[h.length-1]:null}
function scaleMini(k,st,o){const h=scaleMini0(k,st);const e=o&&stSince(k,o);return e?`<span class="scm-w" title="Установлен ${fmtDT(e.at)}${e.who?', '+esc(whoName(e.who)):''}">${h}<small>${fmtDT(e.at)}</small></span>`:h}
function scaleMini0(k,st){const D=SCALES[k];if(!st)return '<span class="faint">—</span>';if((D.none||[]).includes(st))return `<span class="scm none" title="${esc(st)}: шкала не ведётся">${ic('ban','sm')}${esc(st)}</span>`;
  const {i,side,n}=scPos(k,st);if(i<0)return pill(st,D.map());
  return `<span class="scm sc-${scCol(k,st)}" title="Этап ${i+1} из ${n}: ${esc(st)}"><span class="scm-d">${D.steps.map((x,j)=>`<i class="${j<i?'p':j===i?(side?'c x':'c'):''}"></i>`).join('')}</span><b>${i+1}/${n}</b><span class="scm-l">${esc(stl(st))}</span></span>`}
function scNext(k,st,o){
  if(k==='rep')return st==='К сдаче'?['В работе','Сдан']:st==='В работе'||st==='Требует исправления'?['Сдан']:st==='Сдан'?['Принят']:[];
  if(k==='pay')return st==='Не оплачено'?['Оплачено частично','Оплачено']:st==='Оплачено частично'?['Оплачено']:[];
  if(k==='task')return st==='К выполнению'?['В работе']:st==='В работе'?['Выполнена']:[];
  if(k==='svc')return st==='Обслуживается'?['Приостановлен','В архиве']:st==='Приостановлен'?['В архиве']:st==='В архиве'?['Обслуживается']:[];
  if(k==='proj')return st==='Планируется'?['В работе']:st==='В работе'?['Завершён']:[];
  if(k==='ind')return st==='Заполнено'?['Проверено']:[];return []}
function scBack(k,st,o){
  if(k==='rep')return o&&o.superseded&&st!=='Не требуется'?{no:'Сначала откатите уточнённую версию отчёта'}:st==='Принят'?'Сдан':st==='Сдан'?'В работе':st==='Требует исправления'?'Сдан':st==='В работе'?'К сдаче':st==='Не требуется'?'К сдаче':null;
  if(k==='pay'&&o){const l0=OPS.filter(x=>x.kind==='pay'&&x.report===o.id).sort((a,b)=>a.date<b.date?1:-1)[0];if(l0&&CLOSED.has(ym(l0.date)))return {no:`${ymLabel(ym(l0.date))} закрыт отчётом о списаниях: отменить оплату нельзя, нужна корректирующая запись`}}
  if(k==='pay'){if(!o)return null;const l=OPS.filter(x=>x.kind==='pay'&&x.report===o.id).sort((a,b)=>a.date<b.date?1:-1)[0];if(!l)return null;const rest=o.paid-l.amount;return rest<=0?'Не оплачено':'Оплачено частично'}
  if(k==='task')return ['Выполнена','Не выполнена','Отменена'].includes(st)?'В работе':st==='В работе'?'К выполнению':null;
  if(k==='svc')return st==='Приостановлен'?'Обслуживается':null;
  if(k==='proj')return st==='Завершён'||st==='Отменён'?'В работе':st==='В работе'?'Планируется':null;
  if(k==='ind')return st==='Проверено'?'Заполнено':null;return null}
function scaleFull(k,st,id){const D=SCALES[k];const o=objOf(k,id);const H=o?statusHist(k,o):[];const when=x=>{for(let q=H.length-1;q>=0;q--)if(H[q].to===x)return H[q].at;return null};
  const bk=can('rollback')?scBack(k,st,o):null;const bkT=typeof bk==='string'?bk:null;
  if((D.none||[]).includes(st))return `<div class="scf-wrap"><span class="scf-t">${SC_NAME[k]}</span><div class="scf" data-sk="${k}" data-sid="${esc(String(id))}"><span class="scf-none">${ic('ban','sm')}${esc(st)} — шкала не ведётся${when(st)?` <small>с ${fmtDT(when(st))}</small>`:''}</span>${bkT?`<button type="button" class="btn sm" data-back="${esc(bkT)}" style="margin-left:10px">${ic('history','sm')}Снять «${esc(st)}»</button>`:''}</div></div>`;
  const {i,side}=scPos(k,st);const nx=scNext(k,st);const col=scCol(k,st);
  return `<div class="scf-wrap"><span class="scf-t">${SC_NAME[k]}</span><div class="scf" data-sk="${k}" data-sid="${esc(String(id))}" role="list">${D.steps.map((x,j)=>{const cls=j<i?'p':j===i?'c sc-'+(side?side.cls==='red'?'red':'faint':col):'f';const go=nx.includes(x);const back=!go&&bkT===x&&(j<i||(j===i&&side));const w=j<=i?when(j===i&&side?st:x):null;
    return `<button type="button" role="listitem" class="scf-s ${cls} ${go?'go':''} ${back?'back':''}" ${go?`data-step="${esc(x)}" title="Перевести в «${esc(x)}»"`:back?`data-back="${esc(x)}" title="Откатить в «${esc(x)}»"`:`tabindex="-1" aria-disabled="true"`} aria-current="${j===i?'step':'false'}"><span class="n">${j<i?ic('check','sm'):j===i&&side?ic(side.cls==='red'?'x':'ban','sm'):j+1}</span><span class="l">${j===i&&side?`${esc(stl(st))}<em class="scf-side">на шаге ${j+1} «${esc(stl(x))}»</em>`:esc(stl(x))}${w?`<small class="scf-at">${fmtDT(w)}</small>`:''}${back?`<small class="scf-bk">${ic('history','sm')}откатить</small>`:''}</span></button>${j<D.steps.length-1?`<span class="scf-ln ${j<i?'p':''}"></span>`:''}`}).join('')}</div>${bk&&bk.no?`<span class="hint">${esc(bk.no)}</span>`:''}${k==='svc'&&o?svcPlanNote(o):''}</div>`}
// Пауза в периодах: [{from,to:'последний месяц обслуживания'}, {from:'месяц возобновления',to:null}]. planPause — пауза ещё не началась.
function planPause(c){const ps=c.periods||[];let l=ps[ps.length-1];if(!l||c.archived)return null;const fut=!l.to&&l.from>ym(TODAY)&&ps.length>1;const prev=fut?ps[ps.length-2]:l;
  return prev&&prev.to&&prev.to>=ym(TODAY)?{prev,fut,from:addMonths(prev.to,1),resume:fut?l.from:null}:null}
function svcPlanNote(c){const pp=planPause(c);const l=lastPeriod(c);const res=!pp&&c.status==='Приостановлен'&&l&&!l.to&&l.from>ym(TODAY)?l.from:null;if(!pp&&!res)return '';
  return `<div class="row" style="gap:8px">${pp?`<span class="pill yellow sm">${ic('pause')}Запланирована приостановка с ${ymG(pp.from)}${pp.resume?`, возобновление с ${ymG(pp.resume)}`:''}</span>${can('rollback')?`<button type="button" class="btn sm" data-unpause="${c.id}">Отменить приостановку</button>`:''}`:`<span class="pill blue sm">${ic('play')}Возобновление запланировано с ${ymG(res)}</span>`}</div>`}
function rollbackDlg(k,id,to){const o=objOf(k,id);if(!o)return;const st=k==='pay'?o.payStatus:o.status;const bk=scBack(k,st,o);if(bk&&bk.no)return toast(bk.no,'alert',true);
  let cons='',extra='',title=`Откатить: «${esc(st)}» → «${esc(to)}»`;
  if(k==='rep'){const ov=o.due<TODAY;cons=[st==='Не требуется'?'Отчёт и его регулярная задача снова станут активными.':'Регулярная задача по отчёту снова станет открытой.',ov&&['К сдаче','В работе','Сдан'].includes(to)&&st!=='Требует исправления'?'Срок уже прошёл — отчёт снова попадёт в просроченные, пойдут напоминания.':'',st==='Принят'?'Дата принятия будет снята.':'',st==='Сдан'?'Дата сдачи будет снята.':'','Приложенные файлы не удаляются.'].filter(Boolean).join(' ')}
  if(k==='pay'){const l=OPS.filter(x=>x.kind==='pay'&&x.report===o.id).sort((a,b)=>a.date<b.date?1:-1)[0];const bon=OPS.find(x=>x.kind==='bonus'&&x.cp===o.cp&&x.date>=l.date);if(bon)return toast(`Сначала отмените списание остатка от ${fmtD(bon.date)}: оно сделано после этой оплаты`,'alert',true);
    title='Отменить запись об оплате';cons=`Оплата ${som(l.amount)} от ${fmtD(l.date)} будет отменена: сумма вернётся в свободный остаток контрагента на счёте, статус оплаты станет «${esc(to)}».`}
  if(k==='task')cons=to==='В работе'?'Задача снова станет открытой у исполнителя. Приложенный файл останется.':'Задача вернётся в «К выполнению».';
  if(k==='ind')cons='Месяц снова будет ждать проверки. Внесённые значения не меняются.';
  if(k==='proj')cons=to==='В работе'?'Проект снова станет активным, по нему можно вести работы и принимать оплаты.':'Проект вернётся в план.';
  if(k==='svc'){if(o.archived)cons='Контрагент вернётся из архива, обслуживание продолжится с текущего месяца.';else{const l=lastPeriod(o);const from=l&&l.to?addMonths(l.to,1):ym(TODAY);const ms=[];for(let x=from;x<=ym(TODAY);x=addMonths(x,1))ms.push(x);
    cons='Приостановка будет отменена, обслуживание продолжится без перерыва.';if(ms.length)extra=`<div class="lbl" style="margin-top:10px">Пропущенные месяцы — что досоздать</div>${ms.map(x=>`<label class="check-row"><input type="checkbox" class="rb-m" value="${x}" checked><span class="grow">${esc(ymLabel(x))}: начисление за обслуживание и отчёты</span></label>`).join('')}`}}
  openModal({form:true,render:()=>({title,sub:esc(k==='rep'||k==='pay'?`${T[o.t].short} · ${CPM[o.cp].name} · ${o.phuman}`:o.name||o.title||''),
    body:`<div class="note">${ic('history')}<span>${cons}</span></div>${extra}${fld('Причина отката',`<textarea class="inp" id="rb-why" style="min-height:64px" placeholder="Например: статус поставили по ошибке"></textarea>`,{req:true,full:true,id:'rb-why'})}<div class="hint">Откат делается на один шаг и попадает в историю статусов с пометкой «Откат».</div>`,
    foot:`<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="rb-ok">${ic('history','sm')}Откатить</button>`,
    mount(el,m){$('#rb-ok',el).onclick=()=>{const why=val(el,'rb-why');if(!setErr(el,'rb-why',why?'':'Укажите причину'))return;const tag=`(откат: ${why})`;
      if(k==='rep'){if(st==='Принят')o.accDate=null;if(st==='Сдан')o.subDate=null;o.status=to;log('r',o.id,`Статус: ${st} → ${to} ${tag}`,o.cp)}
      if(k==='pay'){const l=OPS.filter(x=>x.kind==='pay'&&x.report===o.id).sort((a,b)=>a.date<b.date?1:-1)[0];l.kind='pay_x';l.xAt=nowStamp();l.xBy=S.me;l.xWhy=why;o.paid=Math.max(0,o.paid-l.amount);log('r',o.id,`Отменена оплата в бюджет ${som(l.amount)} от ${fmtD(l.date)} ${tag}`,o.cp)}
      if(k==='task'){o.status=to;if(to!=='Выполнена')o.doneAt=null;log('t',o.id,`Статус: ${st} → ${to} ${tag}`)}
      if(k==='proj'){o.status=to;log('p',o.id,`Статус: ${st} → ${to} ${tag}`,o.cp)}
      if(k==='ind'){o.status=to;log('km',o.id,`Статус: ${st} → ${to} ${tag}`,o.cp)}
      if(k==='svc'){if(o.archived){o.archived=false;const l=lastPeriod(o);if(l&&l.to&&l.to>=ym(TODAY))l.to=null;else o.periods.push({from:ym(TODAY),to:null});applyService(o);log('cp',o.id,`Возвращён из архива ${tag}`,o.id)}
        else{const ps=o.periods;// a pause from the very first month leaves no period at all
          if(!ps.length)ps.push({from:ym(TODAY),to:null});let l=ps[ps.length-1];if(l.from>ym(TODAY)&&ps.length>1){ps.pop();l=ps[ps.length-1]}if(l.from>ym(TODAY))l.from=ym(TODAY);l.to=null;applyService(o);
          const fill=$$('.rb-m',el).filter(x=>x.checked).map(x=>ymLabel(x.value));log('cp',o.id,`Приостановка отменена ${tag}${fill.length?'; досоздано за: '+fill.join(', '):''}`,o.id)}}
      m.close();refreshAll();toast('Откат выполнен','history')}}})})}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.scf [data-back],[data-unpause]');if(!b)return;e.stopPropagation();
  if(b.dataset.unpause)return unpauseCp(CPM[+b.dataset.unpause]);const w=b.closest('.scf');if(!can('rollback'))return toast('Нет права «Откат статусов»','alert',true);rollbackDlg(w.dataset.sk,w.dataset.sid,b.dataset.back)},true);
function stepTo(k,id,to){
  if(k==='rep'||k==='pay'){const r=REPORTS.find(x=>x.id===+id);if(!r)return;
    if(k==='pay'){if(!can('money'))return toast('Нет права на учёт денег','alert',true);if(!(r.money&&r.money.s==='ok'))return toast(`Денег контрагента не хватает: ${som(r.money?r.money.n:r.sum-r.paid)}. Сначала примите деньги.`,'alert',true);return payDlg(r)}
    if(!can('changeStatus'))return toast('Нет права менять статус','alert',true);
    if(to==='В работе')return setStatus(r,to);if(to==='Сдан')return submitDlg([r]);if(to==='Принят')return acceptDlg(r);return}
  if(k==='task'){const t=TASKS.find(x=>x.id===id);if(!t)return;const mine=t.exec===S.me,boss=t.by===S.me||me().role==='owner';
    if(to==='В работе'){if(!mine&&!boss)return toast('Менять статус может исполнитель или постановщик','alert',true);t.status='В работе';log('t',t.id,'Статус: К выполнению → В работе');refreshAll();return toast('Задача в работе')}
    if(to==='Выполнена'){if(!mine)return toast('Отметить может только исполнитель','alert',true);return taskDoneDlg(t)}return}
  if(k==='svc'){const c=CPM[+id];if(!c)return;const lab=to==='Приостановлен'?'Приостановить обслуживание':to==='В архиве'?'В архив':c.archived?'Вернуть из архива':'Возобновить обслуживание';
    const it=cpActions(c).find(x=>x&&x.label===lab)||(to==='Обслуживается'&&cpActions(c).find(x=>x&&x.label==='Отменить приостановку'));if(!it||it.disabled)return toast(it&&it.reason||'Нет права на это действие','alert',true);return it.run()}
  if(k==='ind'){const o=KMI[id];if(!o)return;if(!can('indCheck'))return toast('Нет права «Проверять показатели»','alert',true);
    return confirmDlg({title:'Отметить месяц проверенным?',text:`${esc(o.name)}: значения проверены. Если потом изменить значение, месяц вернётся в «Заполнено» и потребует повторной проверки.`,ok:'Проверено',run:()=>{log('km',o.id,'Статус: Заполнено → Проверено',o.cp);o.status='Проверено';refreshAll();toast('Месяц отмечен проверенным')}})}
  if(k==='proj'){const p=PROJECTS.find(x=>x.id===id);if(!p)return;if(!can('projects'))return toast('Нет права менять проекты','alert',true);
    return confirmDlg({title:`Перевести проект в «${to}»?`,text:`Проект «${esc(p.name)}»: ${esc(p.status)} → ${esc(to)}. Это попадёт в историю статусов.`,ok:to==='Завершён'?'Завершить':'В работу',run:()=>setProjStatus(p,to)})}
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.scf [data-step]');if(!b)return;e.stopPropagation();const w=b.closest('.scf');stepTo(w.dataset.sk,w.dataset.sid,b.dataset.step)},true);
/* История статусов: записи не редактируются; длительность — до следующей смены статуса или до сейчас */
let HIX=null,HIXn=-1;function histOf(ent,id){if(HIXn!==HIST.length){HIX={};HIST.forEach(h=>{const k=h.ent+'|'+h.id;(HIX[k]=HIX[k]||[]).push(h)});Object.values(HIX).forEach(a=>a.sort((x,y)=>x.at<y.at?-1:1));HIXn=HIST.length}return HIX[ent+'|'+id]||[]}
const stAt=s=>new Date(String(s).replace(' ','T')+(String(s).length>10?':00':'T00:00:00')+'+06:00').getTime();
function durTxt(ms){if(ms<0)ms=0;const h=ms/36e5;if(h<1)return 'меньше часа';if(h<24)return Math.round(h)+' ч';const d=Math.round(h/24);return d+' '+plural(d,'день','дня','дней')}
function statusHist(k,o){const out=[];const add=(at,from,to,who,note,file)=>{if(from===to)return;out.push({at,from,to,who,note:note||'',file:file||''})};
  const rx=/^Статус: (.+?) → (Требует исправления|[^,(]+?)\s*(?:\((.*?)\))?(?:,\s*(.*))?$/;
  const parse=(ent,id)=>histOf(ent,id);
  if(k==='rep'){add(o._ca,'','К сдаче',o._cb||'system','Отчёт создан по назначению');parse('r',o.id).forEach(h=>{const m=h.what.match(rx);if(!m)return;const rest=[m[3],m[4]].filter(Boolean).join(', ');const f=(rest.match(/файл[ыа]?:\s*(.+)$/)||[])[1];add(h.at,m[1],m[2].trim(),h.who,f?rest.replace(/,?\s*файл[ыа]?:.*$/,''):rest,f)})}
  if(k==='pay'){add(o._ca,'','Не оплачено',o._cb||'system','');let paid=0,cur='Не оплачено';const ev=[];OPS.filter(x=>(x.kind==='pay'||x.kind==='pay_x')&&x.report===o.id).forEach(x=>{ev.push({at:x._ca||x.date,a:x.amount,who:x.by,note:'Оплата в бюджет '+som(x.amount),f:(x.files||[])[0]});if(x.kind==='pay_x')ev.push({at:x.xAt,a:-x.amount,who:x.xBy,note:'откат: отменена оплата '+som(x.amount)+(x.xWhy?'. '+x.xWhy:'')})});
    ev.sort((a,b)=>a.at<b.at?-1:1).forEach(e=>{paid+=e.a;const nx=paid<=0?'Не оплачено':paid>=(o.sum||0)?'Оплачено':'Оплачено частично';add(e.at,cur,nx,e.who,e.note,e.f);cur=nx})}
  if(k==='task'){let cur='К выполнению';add(o._ca||o.created,'',cur,o.by,'Задача поставлена');if(o._st0){add(o.doneAt?o.doneAt+' 17:30':(o._ca||o.created),cur,o._st0,o.exec,'');cur=o._st0}parse('t',o.id).forEach(h=>{let to=null,note='',f='';const m=h.what.match(rx);if(m){to=m[2].trim();note=[m[3],m[4]].filter(Boolean).join(', ')}else if(/^Задача выполнена/.test(h.what)){to='Выполнена';f=(h.what.match(/файл: (.+)$/)||[])[1]||''}else if(/^Не выполнена: /.test(h.what)){to='Не выполнена';note=h.what.slice(14)}else if(/^Задача отменена/.test(h.what)){to='Отменена'}if(to){add(h.at,cur,to,h.who,note,f);cur=to}});if(cur!==o.status)add(o._ua||o._ca,cur,o.status,o._ub||o.by,'')}
  if(k==='svc'){let cur='Обслуживается';add(o._ca||o.start,'',cur,o._cb||'system','Начало обслуживания');parse('cp',o.id).forEach(h=>{let to=/приостановлено/.test(h.what)?'Приостановлен':/возобновлено|Возвращён из архива|Приостановка отменена/.test(h.what)?'Обслуживается':/Отправлен в архив/.test(h.what)?'В архиве':null;if(to){const rb=h.what.match(/\(откат: (.*?)\)/);add(h.at,cur,to,h.who,rb?'откат: '+rb[1]:h.what.replace(/^Обслуживание приостановлено\s*/,'').replace(/^\.\s*/,''));cur=to}});if(cur!==o.status)add(o._ua||o._ca,cur,o.status,o._ub||'system','')}
  if(k==='ind'){let cur='Не заполнено';add(o._ca,'',cur,o._cb||'system','Месяц открыт для заполнения');parse('km',o.id).forEach(h=>{const m=h.what.match(rx);if(!m)return;const to=m[2].trim();add(h.at,cur,to,h.who,[m[3],m[4]].filter(Boolean).join(', '));cur=to})}
  if(k==='proj'){const hs=parse('p',o.id).map(h=>[h,h.what.match(rx)]).filter(x=>x[1]);let cur=hs.length?hs[0][1][1]:o.status;add(o._ca||o.from,'',cur,o._cb||o.lead,'Проект создан');hs.forEach(([h,m])=>{add(h.at,cur,m[2].trim(),h.who,[m[3],m[4]].filter(Boolean).join(', '));cur=m[2].trim()})}
  out.forEach((e,i)=>{const nx=out[i+1];e.ms=(nx?stAt(nx.at):stAt(nowStamp()))-stAt(e.at);e.now=!nx});return out}
function statusHistHtml(k,o,title){const h=statusHist(k,o);if(!h.length)return '';if(k==='rep'||k==='pay'||k==='r')ckHit('hist');const map=SCALES[k].map();const tot={};h.forEach(e=>tot[e.to]=(tot[e.to]||0)+e.ms);
  return `<div class="sh-blk">${title?`<div class="sh-t">${esc(title)}</div>`:''}<div class="tbl-wrap"><table class="mini sh"><thead><tr><th>Когда</th><th>Статус</th><th>Кто</th><th>Комментарий, файл</th><th class="num">В статусе</th></tr></thead><tbody>${h.slice().reverse().map(e=>`<tr><td class="tnum">${fmtDT(e.at)}</td><td>${e.from?`<span class="faint">${esc(e.from)} →</span> `:''}${pill(e.to,map,'sm')}</td><td>${esc(whoName(e.who)||'—')}</td><td>${/^откат/i.test(e.note)?`<span class="pill orange sm">${ic('history')}Откат</span> ${esc(e.note.replace(/^откат:\s*/i,''))}`:esc(e.note)||''}${e.file?` <span class="tag">${ic('clip','sm')}${esc(e.file)}</span>`:''}${!e.note&&!e.file?'<span class="faint">—</span>':''}</td><td class="num tnum">${durTxt(e.ms)}${e.now?' <span class="faint">· сейчас</span>':''}</td></tr>`).join('')}</tbody></table></div>
  <div class="sh-sum">${Object.entries(tot).map(([s,ms])=>`<span>${esc(s)}: <b>${durTxt(ms)}</b></span>`).join('')}</div></div>`}
function setStatus(r,st){const o=r.status;r.status=st;if(st==='К сдаче'||st==='В работе'){}log('r',r.id,`Статус: ${o} → ${st}`,r.cp);refreshAll();toast(`Статус: ${st}`)}
const needF=r=>!!(ORG.types[r.t]&&ORG.types[r.t].needFile&&!(r.files||[]).length);
function submitDlg(rows,done){
  const one=rows.length===1;const r0=rows[0];const all=rows;
  openModal({form:true,size:one?'':'mid',render:()=>({title:one?'Отметить отчёт сданным':`Отметить сданными: ${rows.length}`,sub:one?`${esc(T[r0.t].name)} · ${esc(CPM[r0.cp].name)} · ${esc(r0.phuman)}`:'Одна дата сдачи для всех, суммы можно вписать здесь же',
    body:`<div class="form">${fld('Дата сдачи',inp('sb-date',TODAY,'type="date" max="'+TODAY+'"'),{req:true,id:'sb-date'})}${one&&tR(r0).sum?partsFld(r0,'sb-sum')+fld((T[r0.t].pays||[]).length>1?'Сумма к уплате, итог, сом':'Сумма к уплате, сом',inp('sb-sum',r0.sum??'','inputmode="decimal" class="inp tnum" placeholder="0 — нулевой отчёт"'),{id:'sb-sum',hint:headHint(r0)||'0 — допустимо (нулевой отчёт)'})+repeatBox(r0,'sb-rep'):''}${feat('files')&&one?fld('Файлы: отчёт, квитанция',`<input class="inp" type="file" id="sb-file" multiple>`,{full:true,id:'sb-file',hint:ORG.types[r0.t]&&ORG.types[r0.t].needFile?'Для этого вида отчёта файл обязателен':'Необязательно'}):''}</div>
    ${!one&&rows.some(needF)?`<div class="note warn">${ic('alert')}<span>Для ${rows.filter(needF).length} ${plural(rows.filter(needF).length,'отчёта','отчётов','отчётов')} файл при сдаче обязателен: они помечены и здесь не отмечаются. Сдайте их из карточки отчёта с файлом.</span></div>`:''}
    ${one?'':`<div class="tbl-wrap"><table class="mini"><thead><tr><th>Контрагент</th><th>Отчёт</th><th>Период</th><th class="num">Сумма к уплате</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(CPM[r.cp].name)}</td><td>${esc(T[r.t].short)}${needF(r)?` <span class="pill sm orange">${ic('clip')}нужен файл</span>`:''}</td><td>${esc(r.plabel)}</td><td class="num">${needF(r)?'<span class="faint">из карточки</span>':tR(r).sum?`<input class="inp tnum" style="max-width:130px;margin-left:auto;text-align:right" data-sum="${r.id}" value="${r.sum??''}" inputmode="decimal" aria-label="Сумма">`:'<span class="faint">без суммы</span>'}</td></tr>`).join('')}</tbody></table></div>`}`,
    foot:`<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="sb-ok">${ic('send','sm')}Отметить сданным</button>`,
    mount(el,m){bindHead(el,'sb-sum');if(one)bindParts(el,'sb-sum',r0);$('#sb-ok',el).onclick=()=>{const d=val(el,'sb-date');if(!setErr(el,'sb-date',d&&d<=TODAY?'':'Укажите дату не позже сегодняшней'))return;
      const files=$('#sb-file',el)?[...$('#sb-file',el).files].map(f=>f.name):[];
      if(one&&ORG.types[r0.t]&&ORG.types[r0.t].needFile&&!files.length&&!r0.files.length){setErr(el,'sb-file','Прикрепите файл: так настроен этот вид отчёта');return}
      if(one&&tR(r0).sum){const v=val(el,'sb-sum');if(v!==''){const n=parseNum(v);if(!setErr(el,'sb-sum',isNaN(n)||n<0?'Введите сумму числом, например 1 250,50':''))return;r0.sum=n;r0.auto=false;{const pp=readParts(el,'sb-sum',r0);if(pp)r0.parts=pp}applyRepeat(r0,n,$('#sb-rep',el).checked)}}
      if(!one)$$('[data-sum]',el).forEach(i=>{const n=parseNum(i.value);if(!isNaN(n)&&n>=0)REPORTS.find(r=>r.id===+i.dataset.sum).sum=n});
      const skip=one?[]:all.filter(needF);rows=one?all:all.filter(r=>!needF(r));if(!rows.length)return toast('Все выбранные отчёты требуют файл: сдайте их из карточки','alert',true);
      rows.forEach(r=>{const o=r.status;r.status='Сдан';r.subDate=d;r.files.push(...files);log('r',r.id,`Статус: ${o} → Сдан${r.sum!=null&&tR(r).sum?`, сумма к уплате ${som(r.sum)}`:''}${files.length?`, файлы: ${files.join(', ')}`:''}`,r.cp)});
      m.close();done&&done();refreshAll();toast(one?'Отчёт отмечен сданным. Ждём подтверждения от органа.':`Сданными отмечено: ${rows.length}${skip.length?`; без файла не отмечено: ${skip.length}`:''}`,'send')}}})});
}
function acceptDlg(r){const need=ORG.types[r.t]&&ORG.types[r.t].needReceipt;
  openModal({form:true,render:()=>({title:'Отчёт принят органом',sub:`${esc(T[r.t].short)} · ${esc(CPM[r.cp].name)} · ${esc(r.phuman)} · ${esc(T[r.t].organ)}`,
    body:`<div class="form">${fld('Дата принятия',inp('ac-date',TODAY,`type="date" min="${r.subDate||''}" max="${TODAY}"`),{req:true,id:'ac-date'})}${feat('files')?fld('Подтверждение: квитанция о приёме или скриншот',`<input class="inp" type="file" id="ac-file">`,{full:true,id:'ac-file',hint:need?'Для этого вида отчёта подтверждение обязательно':'Необязательно'}):''}</div>${r.ver&&r.paid>(r.sum||0)?`<div class="note">${ic('info')}<span>Уточнённый отчёт уменьшил налог: разница ${som(r.paid-(r.sum||0))} вернётся в свободный остаток контрагента.</span></div>`:''}`,
    foot:`<button class="btn ghost" data-close>Отмена</button><button class="btn ok" id="ac-ok">${ic('ok','sm')}Принят</button>`,
    mount(el,m){$('#ac-ok',el).onclick=()=>{const d=val(el,'ac-date');if(!setErr(el,'ac-date',d?'':'Укажите дату'))return;const f=$('#ac-file',el)?[...$('#ac-file',el).files].map(x=>x.name):[];if(need&&!f.length){setErr(el,'ac-file','Прикрепите подтверждение');return}
      r.status='Принят';r.accDate=d;r.files.push(...f);log('r',r.id,`Статус: Сдан → Принят${f.length?', подтверждение: '+f.join(', '):''}`,r.cp);
      if(r.ver&&r.paid>(r.sum||0)){const diff=r.paid-(r.sum||0);const c=CPM[r.cp];OPS.push({id:OPID++,cp:c.id,kind:'back',amount:diff,date:d,by:S.me,holder:c.paysTo==='org'?'org':c.resp,report:r.id,note:`Возврат по уточнённому расчёту (версия ${r.ver})`});r.paid=r.sum||0;log('r',r.id,`Возврат по уточнённому расчёту (версия ${r.ver}): ${som(diff)} в остаток контрагента`,r.cp)}
      m.close();refreshAll();toast('Отчёт принят','ok')}}})});
}
function assignOf(r){const c=CPM[r.cp];return c.assign.find(a=>a.t===r.t&&!a.to)||c.assign.find(a=>a.t===r.t)}
function partsFld(r,id){const ps=T[r.t].pays||[];if(!tR(r).sum||ps.length<2)return '';const pr=r.parts||[];
  return ps.map((p,k)=>fld(`${esc(p.n)}${p.to?' · '+esc(p.to):''}, сом`,inp(`${id}-p${k}`,pr[k]??'','inputmode="decimal" class="inp tnum"'),{id:`${id}-p${k}`,hint:p.kbk?'Код платежа: '+esc(p.kbk):''})).join('')}
function bindParts(el,id,r){const ps=T[r.t].pays||[];const tot=el.querySelector('#'+id);if(!tot||ps.length<2)return;tot.readOnly=true;
  const f=()=>{const v=ps.map((p,k)=>{const x=val(el,`${id}-p${k}`);return x===''?0:parseNum(x)});tot.value=ps.every((p,k)=>val(el,`${id}-p${k}`)==='')?'':v.some(isNaN)?'':String(Math.round(v.reduce((a,b)=>a+b,0)*100)/100)};
  ps.forEach((p,k)=>el.querySelector(`#${id}-p${k}`).addEventListener('input',f))}
function readParts(el,id,r){const ps=T[r.t].pays||[];if(ps.length<2||!el.querySelector(`#${id}-p0`))return null;return ps.map((p,k)=>{const x=val(el,`${id}-p${k}`);return x===''?0:parseNum(x)})}
function headHint(r){const t=T[r.t];if(t.id==='tbo')return 'Вносится одной общей суммой. Справочно: 100 сом на сотрудника в год.';return '';return c.staff?`Подсказка: ${c.staff} ${plural(c.staff,'сотрудник','сотрудника','сотрудников')} × ${t.perHead} сом = <b>${som(c.staff*t.perHead)}</b> · <button type="button" class="linkbtn" data-head="${c.staff*t.perHead}">подставить</button>`:'Укажите число сотрудников в карточке контрагента — система подскажет сумму (100 сом на сотрудника).'}
function bindHead(el,id){$$('[data-head]',el).forEach(b=>b.onclick=()=>{el.querySelector('#'+id).value=b.dataset.head})}
function repeatBox(r,id){const a=assignOf(r);return `<div class="fld full"><label class="row" style="gap:8px;min-height:30px"><input type="checkbox" id="${id}" ${a&&a.fixed!=null?'checked':''}> ${ic('repeat','sm')} Повторять эту сумму в следующих отчётах</label><div class="hint">Сумма сохранится в назначении «${esc(T[r.t].short)}» и будет подставляться во все следующие отчёты этого контрагента, пока её не изменят. В конкретном отчёте её можно поправить, повторяющаяся от этого не меняется.${a&&a.fixed!=null?` Сейчас повторяется: <b>${som(a.fixed)}</b>.`:''}</div></div>`}
function applyRepeat(r,n,on){const a=assignOf(r);if(!a)return;const was=a.fixed;
  if(on){a.fixed=n;REPORTS.filter(x=>x.cp===r.cp&&x.t===r.t&&x.pkey>r.pkey&&!x.superseded&&OPEN.has(x.status)&&(x.sum==null||x.auto)).forEach(x=>{x.sum=n;x.auto=true});if(was!==n)log('cp',r.cp,`Повторяющаяся сумма «${T[r.t].short}»: ${som(n)}`,r.cp)}
  else if(was!=null){delete a.fixed;REPORTS.filter(x=>x.cp===r.cp&&x.t===r.t&&x.pkey>r.pkey&&OPEN.has(x.status)&&x.auto).forEach(x=>{x.sum=null;x.auto=false});log('cp',r.cp,`Повторяющаяся сумма «${T[r.t].short}» отключена`,r.cp)}}
function sumDlg(r){openModal({form:true,render:()=>({title:'Сумма к уплате',sub:`${esc(T[r.t].short)} · ${esc(CPM[r.cp].name)} · ${esc(r.phuman)}`,body:`<div class="form">${partsFld(r,'sm-v')}${fld((T[r.t].pays||[]).length>1?'Сумма к уплате, итог, сом':'Сумма налога, сом',inp('sm-v',r.sum??'','inputmode="decimal" class="inp tnum" placeholder="1 250,50"'),{full:true,id:'sm-v',hint:headHint(r)||'Сумму вводят вручную. 0 — нулевой отчёт.'})}${repeatBox(r,'sm-rep')}</div>`,
  foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="sm-ok">Сохранить</button>',mount(el,m){bindHead(el,'sm-v');bindParts(el,'sm-v',r);const f=()=>{const n=parseNum(val(el,'sm-v'));if(!setErr(el,'sm-v',isNaN(n)||n<0?'Введите сумму числом, например 1 250,50':''))return;const o=r.sum;r.sum=Math.round(n*100)/100;r.auto=false;{const pp=readParts(el,'sm-v',r);if(pp)r.parts=pp}log('r',r.id,`Сумма к уплате: ${o==null?'не указана':som(o)} → ${som(r.sum)}`,r.cp);applyRepeat(r,r.sum,$('#sm-rep',el).checked);m.close();refreshAll();toast('Сумма сохранена')};$('#sm-ok',el).onclick=f;$('#sm-v',el).onkeydown=e=>{if(e.key==='Enter')f()}}})})}
function payDlg(r){const c=CPM[r.cp];const need=r.sum-r.paid;const sch=schedule(r);const next=sch.find(x=>x.paid<x.amount);const def=next?next.amount-next.paid:need;
  openModal({form:true,render:()=>({title:'Оплата налога в бюджет',sub:`${esc(T[r.t].short)} · ${esc(c.name)} · ${esc(r.phuman)}`,
    body:`<div class="kv"><div><span class="k">К уплате</span><span class="v tnum">${som(r.sum)}</span></div><div><span class="k">Уже оплачено</span><span class="v tnum">${som(r.paid)}</span></div><div><span class="k">Деньги контрагента на счёте</span><span class="v tnum strong">${som(c.avail)}</span></div></div>
    <div class="form">${fld('Дата оплаты',inp('py-date',TODAY,`type="date" max="${TODAY}"`),{req:true,id:'py-date'})}${fld('Оплачено в бюджет, сом',inp('py-sum',def,'inputmode="decimal" class="inp tnum"'),{req:true,id:'py-sum',hint:'Может отличаться от суммы к уплате, например на пеню'})}${feat('files')?fld('Платёжное поручение',`<input class="inp" type="file" id="py-file" multiple>`,{id:'py-file',full:true,hint:'Необязательно; файл появится в карточке отчёта и в «Файловом менеджере»'}):''}</div>
    <div class="note">${ic('lock')}<span>Налог контрагента оплачивается только его деньгами. Это правило не отключается.</span></div>`,
    foot:`<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="py-ok">${ic('wallet','sm')}Отметить оплаченным</button>`,
    mount(el,m){$('#py-ok',el).onclick=()=>{const n=parseNum(val(el,'py-sum'));if(!setErr(el,'py-sum',isNaN(n)||n<=0?'Введите сумму больше нуля':n>c.avail?`Денег контрагента не хватает: доступно ${som(c.avail)}`:''))return;
      const d=val(el,'py-date');const pf=$('#py-file',el)?[...$('#py-file',el).files]:[];if(!setErr(el,'py-file',pf.some(x=>x.size>20*1048576)?'Файл больше 20 МБ':''))return;OPS.push(born({id:OPID++,cp:c.id,kind:'pay',amount:n,date:d,by:S.me,holder:c.paysTo==='org'?'org':c.resp,report:r.id,note:`${T[r.t].short} ${r.plabel}`,files:pf.map(x=>x.name)}));r.paid=Math.round((r.paid+n)*100)/100;
      log('r',r.id,`Оплата в бюджет ${som(n)} от ${fmtD(d)}${n>need?` (больше суммы к уплате на ${som(n-need)})`:''}`,r.cp);m.close();refreshAll();toast('Оплата отмечена','wallet')}}})});
}
function fileDlg(r){openModal({form:true,render:()=>({title:'Прикрепить файлы',sub:`${esc(T[r.t].short)} · ${esc(CPM[r.cp].name)} · ${esc(r.phuman)}`,body:fld('Файлы',`<input class="inp" type="file" id="fl-f" multiple>`,{id:'fl-f',hint:'Отчёт, квитанция, скриншот из кабинета'}),
  foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="fl-ok">Прикрепить</button>',mount(el,m){$('#fl-ok',el).onclick=()=>{const f=[...$('#fl-f',el).files].map(x=>x.name);if(!setErr(el,'fl-f',f.length?'':'Выберите хотя бы один файл'))return;r.files.push(...f);log('r',r.id,'Прикреплены файлы: '+f.join(', '),r.cp);m.close();refreshAll();toast('Файлы прикреплены','clip')}}})})}
function createRevision(r){
  confirmDlg({title:`Создать уточнённый отчёт ${r.ver+1}?`,text:`Предыдущая версия ${esc(T[r.t].short)} за ${esc(r.phuman)} останется в истории без изменений. Новая версия получит свою сумму, срок, файлы и статусы и пройдёт путь «Сдан» → «Принят». Ответственному придёт регулярная задача.`,ok:'Создать',run:()=>{
    const n=Object.assign({},r,{id:RID++,ver:r.ver+1,status:'К сдаче',subDate:null,accDate:null,sum:null,files:[],superseded:false,due:maxIso(r.due,addDays(TODAY,10)),dueBase:maxIso(r.due,addDays(TODAY,10))});
    born(n);r.superseded=true;REPORTS.push(n);log('r',r.id,`Создан уточнённый отчёт, версия ${n.ver}`,r.cp);log('r',n.id,`Уточнённый отчёт создан на основе версии ${r.ver||'первичной'}`,r.cp);refreshAll();openReport(n);toast(`Создан уточнённый отчёт ${n.ver}`,'repeat')}});
}
function waDlg({r,cp,fee}){
  const c=cp||CPM[r.cp];const holderEmp=c.paysTo==='emp'?EM[c.resp]:null;
  const wallets=c.paysTo==='org'?ORG.accounts.map(a=>({prov:a.bank,num:`р/с ${a.acc}, БИК ${a.bik}`,main:a.main})):holderEmp?(holderEmp.wallets||[]):[];
  const st={on:new Set(wallets.map((w,i)=>w.main?i:-1).filter(i=>i>=0))};
  const build=()=>{const req=wallets.filter((w,i)=>st.on.has(i)).map(w=>`${w.prov}: ${w.num}`).join('; ');
    if(fee){const months=feeMonths(c).filter(m=>(feeCharge(c,m)-(c.feePaid[m]||0))>0);const m=months[months.length-1];return TPL.waFee.replace('{контрагент}',c.name).replace('{месяц}',months.map(ymLabel).join(', ')).replace('{сумма}',som(c.feeDebt)).replace('{дата}',(()=>{const d=m?mkDate(+m.slice(0,4),+m.slice(5,7)+1,c.feeDay):TODAY;return fmtD(d<TODAY?addDays(TODAY,1):d)})())}
    return TPL.waTax.replace('{контрагент}',c.name).replace('{отчёт}',T[r.t].name).replace('{период}',r.phuman).replace('{срок}',fmtD(r.due)).replace('{сумма}',som(r.sum-r.paid)).replace('{дата}',fmtD(r.payDue<TODAY?addDays(TODAY,1):addDays(r.payDue,-2)<TODAY?r.payDue:addDays(r.payDue,-2))).replace('{реквизиты}',req||'—')};
  openModal({form:true,size:'mid',render:m=>{
    const noPhone=!c.phone||!c.phone.digits;const noReq=!fee&&!wallets.length;
    return {title:'Напомнить в WhatsApp',sub:`${esc(c.name)} · ${esc(fmtPhone(c.phone))}`,body:`
    ${noPhone?`<div class="note bad">${ic('alert')}<span>У контрагента нет номера телефона — сообщение отправить нельзя. Добавьте номер в карточке.</span></div>`:''}
    ${noReq?`<div class="note warn">${ic('alert')}<span>${holderEmp?`В профиле ${esc(holderEmp.short)} нет реквизитов для переводов.`:'Не указан ответственный.'} Без реквизитов сообщение не отправляется.</span>${holderEmp&&holderEmp.id===S.me?`<button class="btn sm" id="wa-addw">Добавить реквизиты</button>`:''}</div>`:''}
    ${!fee&&wallets.length?`<div class="box flat"><h3>Куда переводить · ${c.paysTo==='org'?'счёт организации':'кошельки '+esc(holderEmp.short)}</h3>${wallets.map((w,i)=>`<label class="row"><input type="checkbox" data-w="${i}" ${st.on.has(i)?'checked':''}> <b>${esc(w.prov)}</b> <span class="mono">${esc(w.num)}</span>${w.main?' <span class="tag">основной</span>':''}</label>`).join('')}</div>`:''}
    ${fld('Текст сообщения',`<textarea class="inp" id="wa-text" style="min-height:150px">${esc(build())}</textarea>`,{full:true,id:'wa-text',hint:'Шаблон ведёт администратор платформы. Здесь текст можно поправить перед отправкой.'})}
    <div class="note">${ic('info')}<span>Сообщение откроется в WhatsApp на номер <span class="mono">${esc(fmtPhone(c.phone))}</span>, отправляете его вы сами. Нажатие записывается в историю.</span></div>`,
    foot:`<button class="btn ghost" data-close>Отмена</button><a class="btn cta ${noPhone||noReq?'dis':''}" id="wa-go" target="_blank" rel="noopener" href="#">${ic('chat','sm')}Открыть WhatsApp</a>`,
    mount(el,mm){const ta=$('#wa-text',el),a=$('#wa-go',el);const upd=()=>{a.href=noPhone||noReq?'#':waLink(c.phone,ta.value)};upd();ta.oninput=upd;
      $$('[data-w]',el).forEach(x=>x.onchange=()=>{x.checked?st.on.add(+x.dataset.w):st.on.delete(+x.dataset.w);ta.value=build();upd()});
      const aw=$('#wa-addw',el);if(aw)aw.onclick=()=>walletDlg(holderEmp,()=>{wallets.push(...holderEmp.wallets.filter(w=>!wallets.includes(w)));mm.draw()});
      a.onclick=e=>{if(noPhone||noReq){e.preventDefault();return}if(r)log('r',r.id,'Напоминание в WhatsApp отправлено контрагенту',c.id);else log('cp',c.id,'Напоминание в WhatsApp о долге за обслуживание',c.id);setTimeout(()=>{mm.close();toast('Записано в историю','chat')},150)}}};
  }});
}
const TPL_VARS={waTax:['контрагент','отчёт','период','срок','сумма','дата','реквизиты'],waFee:['контрагент','месяц','сумма','дата'],tgBefore:['дней','список'],tgToday:['список'],tgOver:['список'],tgPay:['дней','список'],tgWeek:['даты','n1','n2','n3'],tgCode:['код'],tgTask:['автор','задача','срок']};
const TPL=DB.ref.messageTemplates;

