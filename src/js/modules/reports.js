'use strict';
// Модуль «Отчеты для сдачи»: список, матрица, календарь, действия
/* ═════════════ Отчеты для сдачи ═════════════ */
function repTabs(){const c=counts();return [
 {id:'week',label:'На неделе',icon:'calendar',count:c.week},
 {id:'overdue',label:'Просрочено',icon:'alert',count:c.overdue,red:true},
 {id:'waiting',label:'Ожидают подтверждения',icon:'hourglass',count:c.waiting},
 {id:'all',label:'Все отчёты',icon:'list'},
 {id:'matrix',label:'Кто что сдаёт',icon:'matrix'},
 feat('calendar')?{id:'calendar',label:'Календарь',icon:'calendar'}:null]}
function repAdd(){return [can('assign')?{label:'Назначить отчёты массово',icon:'matrix',run:massAssignDlg}:null,can('changeStatus')?{label:'Разовый отчёт',icon:'file',run:adhocDlg}:null].filter(Boolean)}
const isDone=r=>DONE.has(r.status);
function moneyTxt(r){if(!r.money)return '';return r.money.s==='paid'?'Оплачено':r.money.s==='ok'?'Достаточно':'Недостача'}
function moneyHtml(r){const rb=canRecv(r)&&(r.recv||0)<r.sum?` <button class="btn xs" data-recv="${r.id}" title="Принять деньги от контрагента под этот отчёт">${ic('plus','sm')}Принять</button>`:'';return rb?`<span class="mwrap">${moneyHtml0(r)}${rb}</span>`:moneyHtml0(r)}
function moneyHtml0(r){if(!r.money)return '<span class="faint">—</span>';if(r.money.s==='paid')return `<span class="pill faint">${ic('check')}Оплачено</span>`;if(r.money.s==='ok')return `<span class="pill green">${ic('ok')}Достаточно</span>`;return `<span class="pill red" title="Не хватает ${som(r.money.n)}">${ic('alert')}Недостача ${fmtM(r.money.n,false)}</span>`}
function dueHtml(r){return `${r.overdue?`<span class="red" title="Просрочен">${ic('alert','sm')}</span> `:''}<span class="${r.overdue?'red strong':''}">${fmtD(r.due)}</span>${r.due!==r.dueBase?` <span class="tag" title="Перенесён с ${fmtD(r.dueBase)}: ${esc(holidayName(r.dueBase)||'выходной день')}">перенос</span>`:''}`}
function daysHtml(r){if(isDone(r))return '<span class="faint">—</span>';const d=diffDays(r.due,TODAY);if(d<0)return `<span class="pill red sm">${d}</span>`;if(d===0)return '<span class="pill yellow sm">сегодня</span>';return d<=3?`<span class="yellow strong">${d}</span>`:String(d)}
const rateOf=r=>{const a=CPM[r.cp].assign.find(a=>a.t===r.t);return a&&a.rate||''};
function reportCols(o={}){const tp=feat('taxpay');const cols=[
 {key:'cp',label:'Контрагент',type:'text',w:220,val:r=>CPM[r.cp].name,html:r=>`<span class="strong">${esc(CPM[r.cp].name)}</span>`},
 {key:'inn',label:'ИНН',type:'text',w:150,val:r=>CPM[r.cp].inn,cls:'mono',hide:true},
 {key:'ugns',label:'УГНС',type:'enum',w:200,val:r=>ugnsLabel(CPM[r.cp].ugns),hide:true},
 {key:'type',label:'Вид отчёта',type:'enum',w:140,val:r=>T[r.t].short,html:r=>`<span title="${esc(T[r.t].name)}">${esc(T[r.t].short)}</span>${r.ver?` <span class="tag blue">уточн. ${r.ver}</span>`:''}${isMobile()?' '+actPill(actOf(r),1):''}`},
 {key:'act',label:'Что сделать',type:'enum',w:175,deskOnly:true,val:r=>ACT_L[actOf(r)],html:r=>actPill(actOf(r),1)},
 {key:'rate',label:'Ставка',type:'enum',w:90,val:r=>rateOf(r),hide:true},
 {key:'organ',label:'Орган',type:'enum',w:110,val:r=>T[r.t].organ,hide:!!o.compact},
 {key:'period',label:'Период',type:'enum',w:112,val:r=>r.plabel,sortVal:r=>r.pkey},
 {key:'due',label:'Срок сдачи',type:'date',w:176,val:r=>r.due,html:dueHtml},
 {key:'days',label:'Дней до срока',type:'int',w:132,num:true,val:r=>isDone(r)?null:diffDays(r.due,TODAY),html:daysHtml,hide:!!o.compact},
 {key:'status',label:'Статус сдачи',type:'enum',w:175,val:r=>tR(r).payOnly?'—':r.status,html:r=>tR(r).payOnly?'<span class="faint">—</span>':scaleMini('rep',r.status,r)},
 ...(o.waiting?[{key:'wait',label:'Ждём, дней',type:'int',w:100,num:true,val:r=>r.subDate?diffDays(TODAY,r.subDate):null,html:r=>{const d=diffDays(TODAY,r.subDate);return d>=ORG.waitDays?`<span class="pill orange sm">${d}</span>`:String(d)}}]:[]),
 {key:'sub',label:'Дата сдачи',type:'date',w:108,val:r=>tR(r).payOnly?null:r.subDate,html:r=>tR(r).payOnly?'<span class="faint">—</span>':r.subDate?fmtD(r.subDate):'',hide:!!o.compact},
 {key:'sum',label:'Сумма к уплате',type:'money',w:140,num:true,total:true,val:r=>tR(r).sum?r.sum:null,html:r=>!tR(r).sum?'<span class="faint">—</span>':r.sum==null?'<span class="faint">не указана</span>':fmtM(r.sum)+(r.auto?` <span title="Повторяющаяся сумма из назначения">${ic('repeat','sm')}</span>`:'')},
 ...(tp?[
 {key:'paydue',label:'Срок оплаты',type:'date',w:116,val:r=>tR(r).sum?r.payDue:null,html:r=>tR(r).sum?`<span class="${r.payOverdue?'red strong':''}">${fmtD(r.payDue)}</span>`:'<span class="faint">—</span>',hide:true},
 {key:'paystatus',label:'Статус оплаты',type:'enum',w:170,val:r=>tR(r).sum?r.payStatus:'—',html:r=>!tR(r).sum?'<span class="faint">—</span>':scaleMini('pay',r.payStatus,r)+(canRecv(r)&&r.sum>0&&(r.recv||0)<r.sum&&r.paid<r.sum?` <button class="btn xs" data-recv="${r.id}" title="Принять деньги от контрагента под этот отчёт">${ic('plus','sm')}Принять деньги</button>`:'')+(r.payOverdue?` <span class="pill red sm" title="Срок оплаты прошёл">${ic('alert')}просрочено</span>`:'')},
 {key:'paid',label:'Оплачено',type:'money',w:126,num:true,total:true,val:r=>tR(r).sum?r.paid:null,html:r=>tR(r).sum?fmtM(r.paid):'<span class="faint">—</span>',hide:!!o.compact},
 {key:'money',label:'Деньги',type:'enum',w:290,val:moneyTxt,html:moneyHtml}]:[]),
 {key:'ovk',label:'Просрочка',type:'enum',w:140,val:r=>r.overdue&&r.payOverdue?'Сдача и оплата':r.overdue?'Сдача':r.payOverdue?'Оплата':'',hide:true},
 {key:'pays',label:'Что уплачивается',type:'text',w:220,val:r=>tR(r).sum?paysTxt(T[r.t]):'',hide:true},
 {key:'resp',label:'Ответственный',type:'enum',w:132,val:r=>empName(r.resp),hide:!!o.compact&&!can('viewAll')},
 {key:'fcode',label:'Код формы',type:'text',w:110,val:r=>T[r.t].code||'',cls:'mono',hide:true},
 {key:'funds',label:'Средства от контрагента',type:'enum',w:190,val:r=>!r.sum||!tR(r).sum?'':(r.recv||0)>=r.sum?'Получены':(r.recv||0)>0?'Получены частично':'Ожидаем',hide:true},
 {key:'pfull',label:'Период полностью',type:'text',w:170,val:r=>r.phuman,sortVal:r=>r.pkey,hide:true},
 {key:'duebase',label:'Срок по закону',type:'date',w:120,val:r=>r.dueBase,hide:true},
 {key:'acc',label:'Дата принятия',type:'date',w:120,val:r=>r.accDate,hide:true},
 {key:'ver',label:'Версия',type:'enum',w:110,val:r=>r.ver?'Уточнённый '+r.ver:'Первичный',hide:true},
 {key:'rfiles',label:'Файлов',type:'int',w:90,num:true,val:r=>r.files.length,hide:true},
 {key:'form',label:'Форма собственности',type:'enum',w:120,val:r=>CPM[r.cp].form,hide:true},
 {key:'regime',label:'Режим',type:'enum',w:150,val:r=>CPM[r.cp].regime||'',hide:true}];
 return cols}
const repRowClass=r=>r.overdue||r.payOverdue?'overdue':r.status==='Не требуется'?'muted':'';
function repGrid(host,id,rows,extra={}){
  return grid(host,Object.assign({id,cols:reportCols(extra),rows,title:'cp',noun:['отчёт','отчёта','отчётов'],rowClass:repRowClass,actions:reportActions,open:openReport,
    sort:{key:'due',dir:1},preset:S.preset,simulateLoad:extra.load,
    bulk:can('changeStatus')?[{label:'Отметить сданными',icon:'send',run:(rs,done)=>{const ok=rs.filter(r=>OPEN.has(r.status)&&!tR(r).payOnly);if(!ok.length){toast('Среди выбранных нет отчётов, которые можно сдать','alert',true);return}submitDlg(ok,done)}}]:null,
    empty:{icon:'ok',title:extra.emptyTitle||'Отчётов нет',text:extra.emptyText||''}},extra.cfg||{}));
}
// «Сдать» — not yet submitted reports that need submitting; «Уплатить» — not yet paid reports that need paying.
function actQ(r,q){if(q==='all')return true;const t=tR(r);if(r.status==='Не требуется'||r.superseded)return false;
  if(q==='sub')return !t.payOnly&&OPEN.has(r.status);return t.sum&&(r.sum==null||r.sum>0&&r.paid<r.sum)}
function renderReports(body,tab,fresh){
  const vr=visReports();const[w0,w1]=weekRange();const month=ym(TODAY);
  if(['week','overdue','waiting','all'].includes(tab)){
    const c=counts();const accepted=vr.filter(r=>r.accDate&&ym(r.accDate)===month).length;
    const toPay=vr.filter(r=>tR(r).sum&&r.sum>0&&r.payDue&&ym(r.payDue)===month);
    body.innerHTML=`<div class="plates">
      ${plate({id:'overdue',icon:'alert',color:c.overdue?'red':'green',label:'Просрочено',value:c.overdue,sub:'сдача или оплата',on:tab==='overdue'})}
      ${plate({id:'week',icon:'calendar',color:'yellow',label:'На этой неделе',value:c.week,sub:`${fmtD(w0).slice(0,5)}–${fmtD(w1).slice(0,5)}`,on:tab==='week'})}
      ${plate({id:'waiting',icon:'hourglass',color:'blue',label:'Ожидают подтверждения',value:c.waiting,sub:'сданы, не приняты',on:tab==='waiting'})}
      ${plate({id:'acc',icon:'ok',color:'green',label:'Принято в этом месяце',value:accepted,sub:ymLabel(month)})}
      ${plate({id:'sum',icon:'coins',color:'purple',label:'К уплате за '+MONTHS[+month.slice(5)-1],value:fmtM(toPay.reduce((a,r)=>a+r.sum,0),false),unit:'сом',sub:`оплачено ${fmtM(toPay.reduce((a,r)=>a+r.paid,0),false)}`})}
    </div><div id="rg"></div>`;
    body.querySelector('.plates').onclick=e=>{const b=e.target.closest('[data-plate]');if(!b)return;const id=b.dataset.plate;
      if(['overdue','week','waiting'].includes(id))go('reports',id);
      if(id==='acc')go('reports','all',{status:{type:'enum',vals:['Принят']}});
      if(id==='sum')go('reports','all',{paydue:{type:'date',from:month+'-01',to:lastDay(month)}})};
    let rows,extra={load:fresh};
    if(tab==='week'){rows=()=>visReports().filter(r=>inWeek(r,w0,w1));extra.emptyTitle='На этой неделе всё сдано и оплачено';}
    if(tab==='overdue'){rows=()=>visReports().filter(r=>r.overdue||r.payOverdue);extra.emptyTitle='Просрочек нет';extra.emptyText='Все отчёты сданы и оплачены в срок.'}
    if(tab==='waiting'){rows=()=>visReports().filter(r=>r.status==='Сдан');extra.waiting=true;extra.emptyTitle='Нет отчётов, ожидающих подтверждения'}
    if(tab==='all'){rows=()=>visReports()}
    const base=rows;const q=S.repAct||'all';rows=()=>base().filter(r=>actQ(r,q));
    $('#rg',body).insertAdjacentHTML('beforebegin',`<div class="chipsel actq" id="actq" role="group" aria-label="Что нужно сделать">${[['all','Все'],['sub','Сдать'],['pay','Уплатить']].map(([k,l])=>`<button type="button" data-aq="${k}" class="${q===k?'on':''}">${l}<span class="n">${base().filter(r=>actQ(r,k)).length}</span></button>`).join('')}</div>`);
    $('#actq',body).onclick=e=>{const b=e.target.closest('[data-aq]');if(!b)return;S.repAct=b.dataset.aq;renderPage()};
    repGrid($('#rg',body),'rep-'+tab,rows,extra);
    return;
  }
  if(tab==='matrix')return renderMatrix(body);
  if(tab==='calendar')return renderCalendar(body);
}
function renderMatrix(body){
  const types=RT.filter(t=>ORG.types[t.id]&&ORG.types[t.id].on);
  const q=norm(S.search);const cps=visCps().filter(c=>!q||norm(c.name).includes(q)||c.inn.includes(q));
  const ca=can('assign');
  body.innerHTML=`<div class="note">${ic('info')}<span>Галочка назначает отчёт контрагенту, снятая — завершает назначение: сданные отчёты остаются, будущие несданные получают статус «Не требуется». Заштрихованные ячейки не подходят по режиму или форме собственности.${ca?'':' <b>У вас нет права назначать отчёты.</b>'}</span></div>
  <div class="mx"><table><thead><tr><th>Контрагент · режим</th>${types.map(t=>`<th title="${esc(t.name)}">${esc(t.short)}</th>`).join('')}</tr></thead><tbody>${cps.map(c=>`<tr><th title="${esc(c.name)}"><div style="max-width:230px;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</div><div class="faint" style="font-weight:450;font-size:11.5px">${esc(c.regime||'режим не указан')}</div></th>${types.map(t=>{const a=c.assign.find(a=>a.t===t.id&&!a.to);const why=compatible(t,c);return `<td class="${why&&!a?'na':''}" title="${esc(why||t.name)}"><input type="checkbox" data-cp="${c.id}" data-t="${t.id}" ${a?'checked':''} ${(!ca||(why&&!a))?'disabled':''} aria-label="${esc(t.short)} — ${esc(c.name)}"></td>`}).join('')}</tr>`).join('')}</tbody>
  <tfoot><tr><th>Назначено</th>${types.map(t=>`<td>${cps.filter(c=>c.assign.some(a=>a.t===t.id&&!a.to)).length}</td>`).join('')}</tr></tfoot></table></div>`;
  body.onchange=e=>{const x=e.target;if(!x.dataset.cp)return;const c=CPM[+x.dataset.cp],t=T[x.dataset.t];
    if(x.checked&&t.active===false){x.checked=false;return toast('Вид отключён администратором платформы: новые назначения недоступны','alert',true)}
    if(x.checked){assignTypes(c,[t.id]);toast(`${t.short} назначен: ${c.name}`);refreshAll()}
    else{x.checked=true;unassignDlg(c,[t.id])}};
}
function renderCalendar(body){
  if(!S.cal)S.cal=ym(TODAY);const m=S.cal;const[y,mo]=m.split('-').map(Number);
  const first=mkDate(y,mo,1);const wd=(D(first).getUTCDay()+6)%7;const start=addDays(first,-wd);
  const vr=visReports().filter(r=>r.status!=='Не требуется');
  const byDue={};vr.forEach(r=>{(byDue[r.due]=byDue[r.due]||[]).push(r)});
  const byPay={};if(feat('taxpay'))vr.forEach(r=>{if(tR(r).sum&&r.sum>0&&r.paid<r.sum){(byPay[r.payDue]=byPay[r.payDue]||[]).push(r)}});
  let cells='';for(let i=0;i<42;i++){const d=addDays(start,i);const inM=d.slice(0,7)===m;const list=byDue[d]||[];const todo=list.filter(r=>OPEN.has(r.status)&&!tR(r).payOnly).length;const done=list.length-todo;const pay=(byPay[d]||[]).length;const hol=holidayName(d);
    cells+=`<button class="cday ${isWorking(d)?'':'off'} ${inM?'':'other'} ${d===TODAY?'today':''} ${S.calSel===d?'sel':''}" data-day="${d}" aria-label="${fmtD(d)}: ${list.length} отчётов"><span class="dn"><span>${+d.slice(8)}</span>${!isWorking(d)&&inM?'<span class="faint" style="font-weight:450;font-size:11px">вых.</span>':''}</span>${hol&&inM?`<span class="hol" title="${esc(hol)}">${esc(hol)}</span>`:''}<span class="cnts">${todo?`<span class="pill sm ${d<TODAY?'red':'yellow'}">${ic('send')}${todo} к сдаче</span>`:''}${done?`<span class="pill sm green">${ic('check')}${done} сдано</span>`:''}${pay?`<span class="pill sm purple">${ic('coins')}${pay} оплат</span>`:''}</span></button>`}
  body.innerHTML=`<div class="calhead"><button class="icon-btn raised" data-cm="-1" aria-label="Предыдущий месяц">${ic('left')}</button><h3>${ymLabel(m)}</h3><button class="icon-btn raised" data-cm="1" aria-label="Следующий месяц">${ic('right')}</button><button class="btn sm ghost" data-cm="0">Сегодня</button><div class="grow" style="flex:1"></div><span class="hint">Сроки уже сдвинуты по производственному календарю КР</span></div>
  <div class="cal">${DOW_S.map(d=>`<div class="dow">${d}</div>`).join('')}${cells}</div>${S.calSel?`<div class="sec-h" style="margin-top:6px">Отчёты со сроком ${fmtD(S.calSel)}${holidayName(S.calSel)?' · '+esc(holidayName(S.calSel)):''}</div><div id="cal-grid"></div>`:'<div class="hint">Нажмите на день, чтобы открыть список отчётов на эту дату.</div>'}`;
  body.onclick=e=>{let b;if(b=e.target.closest('[data-cm]')){const k=+b.dataset.cm;S.cal=k?addMonths(S.cal,k):ym(TODAY);renderPage();return}
    if(b=e.target.closest('[data-day]')){S.calSel=S.calSel===b.dataset.day?null:b.dataset.day;renderPage();const g=$('#cal-grid');if(g)g.scrollIntoView({block:'nearest',behavior:'smooth'})}};
  if(S.calSel)repGrid($('#cal-grid'),'rep-cal',()=>visReports().filter(r=>r.due===S.calSel||(feat('taxpay')&&r.payDue===S.calSel&&r.sum>0&&r.paid<r.sum)),{emptyTitle:'На эту дату отчётов нет'});
}

/* ── Report actions ── */
function reportActions(r){
  const t=tR(r),st=t.payOnly?'—':r.status,cs=can('changeStatus');const no='Нет права менять статус';const it=[];
  it.push({label:'Открыть карточку',icon:'file',run:()=>openReport(r)});
  if(OPEN.has(st))it.push({label:'Отметить сданным',icon:'send',disabled:!cs,reason:!cs&&no,run:()=>submitDlg([r])});
  if(st==='К сдаче')it.push({label:'Взять в работу',icon:'clock',disabled:!cs,reason:!cs&&no,run:()=>setStatus(r,'В работе')});
  if(st==='Сдан'){it.push({label:'Отметить принятым',icon:'ok',disabled:!cs,reason:!cs&&no,run:()=>acceptDlg(r)});it.push({label:'Требует исправления',icon:'alert',disabled:!cs,run:()=>setStatus(r,'Требует исправления')})}
  if(OPEN.has(r.status)&&!t.payOnly)it.push({label:'Изменить срок',icon:'calendar',disabled:!can('assign'),reason:'Нужно право «Назначать отчёты контрагентам»',run:()=>dueEditDlg(r)});
  if(t.sum&&r.status!=='Не требуется')it.push({label:'Указать сумму',icon:'coins',disabled:!can('changeSum'),reason:!can('changeSum')&&'Нет права менять сумму',run:()=>sumDlg(r)});
  if(feat('taxpay')&&t.sum&&r.sum>0&&r.paid<r.sum&&r.status!=='Не требуется'){const ok=r.money&&r.money.s==='ok';
    it.push({label:'Принять деньги',icon:'download',sub:'Поступление от контрагента под этот отчёт',disabled:!can('money'),reason:'Нет права на учёт денег',run:()=>recvDlg(r)});
    it.push({label:'Отметить оплаченным',icon:'wallet',disabled:!ok||!can('money'),reason:!can('money')?'Нет права на учёт денег':!ok?`Денег контрагента не хватает: ${som(r.money?r.money.n:r.sum-r.paid)}`:'',run:()=>payDlg(r)});
    it.push({label:'Напомнить в WhatsApp',icon:'chat',run:()=>waDlg({r})})}
  if(feat('files'))it.push({label:'Прикрепить файл',icon:'clip',run:()=>fileDlg(r)});
  if(st==='Сдан'||st==='Принят')it.push({label:'Создать уточнённый',icon:'repeat',disabled:!cs,reason:!cs&&no,run:()=>createRevision(r)});
  it.push({sep:true});
  if(st==='Сдан'||st==='Принят'){const bk=scBack('rep',st,r);it.push({label:`Откатить в «${bk&&!bk.no?bk:'—'}»`,icon:'history',disabled:!can('rollback')||!bk||!!bk.no,reason:!can('rollback')?'Нужно право «Откат статусов»':bk&&bk.no?bk.no:'',run:()=>rollbackDlg('rep',r.id,bk)})}
  if(r.status!=='Не требуется'&&r.status!=='Принят')it.push({label:'Не требуется',icon:'ban',disabled:!cs,run:()=>confirmDlg({title:'Отметить «Не требуется»?',text:'Отчёт не нужно сдавать за этот период. Напоминания по нему прекратятся.',ok:'Отметить',run:()=>setStatus(r,'Не требуется')})});
  return it;
}
const canRecv=r=>feat('taxpay')&&can('money')&&tR(r).sum&&r.sum>0&&r.paid<r.sum&&r.status!=='Не требуется'&&!r.superseded&&!CPM[r.cp].archived;
function recvDlg(r){const amt=Math.max(0,r.sum-Math.max(r.paid,r.recv||0));inDlg(CPM[r.cp],null,{r:r.id,amt:amt||r.sum-r.paid})}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-recv]');if(!b)return;e.stopPropagation();e.preventDefault();recvDlg(REPORTS.find(r=>r.id===+b.dataset.recv))},true);
