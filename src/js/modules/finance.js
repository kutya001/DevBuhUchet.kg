'use strict';
// Модуль «Финансовые операции по контрагентам» и журнал поступлений
/* ═════════════ Финансовые операции по контрагентам ═════════════ */
/* grp — вкладка модуля: tax · fee · proj · wo */
/* Операции контрагента: модуль «Финансы», а если он отключён в учётной политике — карточка контрагента */
function cpOps(c){if(feat('finops'))go('fin','all',{cp:{type:'enum',vals:[c.name]}});else openCp(c)}
function finRows(){const out=[];const vc=new Set(visCps(true,'fin').map(c=>c.id));const tax=taxVis(),fee=feat('fee')&&can('fee'),pj=moneyVis();
  if(tax)OPS.forEach(o=>{if(!vc.has(o.cp)||!OPK[o.kind])return;const k=OPK[o.kind];const fa=o.kind==='in'?(o.feeAlloc||[]).reduce((a,x)=>a+x.a,0):0;const amt=o.amount;const sign=o.kind==='corr'?(o.amount<0?'−':'+'):k[2];
    out.push({id:'o'+o.id,ref:o,src:'op',_ca:o._ca,_cb:o._cb||o.by,_ua:o._ua,_ub:o._ub,rep:o.report?(()=>{const r=REPORTS.find(y=>y.id===o.report);return r?T[r.t].short:''})():(o.alloc||[]).map(x=>{const r=REPORTS.find(y=>y.id===x.r);return r?T[r.t].short:''}).filter(Boolean).join(', '),per:o.report?(()=>{const r=REPORTS.find(y=>y.id===o.report);return r?r.plabel:''})():[...new Set((o.alloc||[]).map(x=>{const r=REPORTS.find(y=>y.id===x.r);return r?r.plabel:''}).filter(Boolean))].join(', '),note:o.note||'',grp:['bonus','refund'].includes(o.kind)?'wo':'tax',cp:o.cp,date:o.date,cat:k[0],color:k[1],sign,amount:Math.abs(amt),what:o.kind==='in'?(allocText(Object.assign({},o,{feeAlloc:[]}))||'Аванс')+(fa&&fee?` · ещё ${som(fa)} за обслуживание — отдельной строкой`:''):(o.note||''),by:o.by,files:(o.files||[]).length,acc:o.holder})});
  if(fee)FEEPAYS.forEach(f=>{if(!vc.has(f.cp))return;out.push({id:'f:'+f.id,ref:f,src:'fee',_ca:f._ca||f.date+' 10:00',_cb:f._cb||f.by,per:ymLabel(f.month),note:f.note||'',grp:'fee',dup:false,cp:f.cp,date:f.date,cat:'Оплата за обслуживание',color:'purple',sign:'+',amount:f.amount,what:'Обслуживание за '+ymLabel(f.month)+(f.op?' · из общего поступления':''),by:f.by,files:0,acc:'org'})});
  if(pj){SERVICES.forEach(s=>{if(!vc.has(s.cp))return;out.push({id:'s:'+s.id,ref:s,src:'svc',_ca:s._ca||s.date+' 10:00',_cb:s._cb||s.resp,_ua:s._ua,_ub:s._ub,note:s.note||s.desc||'',grp:'proj',cp:s.cp,date:s.date,cat:'Разовая услуга',color:'orange',sign:'+',amount:s.amount,paid:svcPaid(s),st:svcStatus(s),what:s.name,by:s.resp,files:s.files.length+s.pays.reduce((a,p)=>a+(p.files||[]).length,0),acc:'org'})});
    if(feat('projects'))PROJECTS.forEach(p=>{if(!vc.has(p.cp))return;p.pays.forEach((x,i)=>out.push({id:'p:'+p.id+':'+i,ref:p,src:'proj',_ca:x._ca||x.date+' 10:00',_cb:x.by,proj:p.name,note:x.note||'',grp:'proj',cp:p.cp,date:x.date,cat:'Оплата по проекту',color:'blue',sign:'+',amount:x.amount,what:`${p.name}${x.note?' · '+x.note:''}`,by:x.by,files:(x.files||[]).length,acc:'org'}))})}
  return out}
function finCols(){return [
 {key:'date',label:'Дата',type:'date',w:110,val:x=>x.date},
 {key:'cp',label:'Контрагент',type:'enum',w:220,val:x=>CPM[x.cp].name,html:x=>`<span class="strong">${esc(CPM[x.cp].name)}</span>`},
 {key:'cat',label:'Тип операции',type:'enum',w:230,val:x=>x.cat,html:x=>`<span class="pill sm ${x.color}">${esc(x.cat)}</span>`},
 {key:'what',label:'За что',type:'text',w:320,val:x=>x.what},
 {key:'amount',label:'Сумма',type:'money',w:140,num:true,total:true,val:x=>x.src==='op'&&x.ref.kind==='xfer'?null:x.sign==='−'?-x.amount:x.amount,html:x=>`<span class="${x.sign==='+'&&x.src!=='svc'?'green':''}">${x.src==='svc'?'':x.sign}${fmtM(x.amount)}</span>`},
 {key:'st',label:'Оплата',type:'enum',w:165,val:x=>x.st||'',html:x=>x.st?pill(x.st,PST)+(x.st==='Оплачено частично'?` <span class="faint tnum">${fmtM(x.paid,false)}</span>`:''):'<span class="faint">—</span>'},
 {key:'acc',label:'Счёт',type:'enum',w:160,val:x=>x.acc==='org'?'Организация':empName(x.acc),html:x=>x.acc==='org'?`${ic('building','sm')} организация`:`${ic('user','sm')} ${esc(empName(x.acc))}`},
 {key:'by',label:'Кто внёс',type:'enum',w:130,val:x=>whoName(x.by),hide:true},
 {key:'files',label:'Файлы',type:'int',w:90,num:true,val:x=>x.files,html:x=>x.files?`${ic('clip','sm')} ${x.files}`:'<span class="faint">—</span>',hide:true},
 {key:'rep',label:'Отчёт',type:'text',w:160,val:x=>x.rep||'',hide:true},
 {key:'per',label:'Период',type:'text',w:140,val:x=>x.per||'',hide:true},
 {key:'proj',label:'Проект',type:'text',w:200,val:x=>x.proj||'',hide:true},
 {key:'note',label:'Комментарий',type:'text',w:220,val:x=>x.note||'',hide:true}]}
function openFinRow(x){if(x.src==='fee'&&x.ref.op){const o=OPS.find(y=>y.id===x.ref.op);if(o&&taxVis())return inCard(o)}if(x.src==='op')return x.ref.kind==='in'?inCard(x.ref):openCp(CPM[x.cp],'money');if(x.src==='fee')return openCp(CPM[x.cp],'fee');if(x.src==='svc')return serviceCard(x.ref);if(x.src==='proj')return openProject(x.ref)}
function finActions(x){const it=[{label:'Открыть',icon:'list',run:()=>openFinRow(x)}];if(x.src==='op'&&x.ref.kind==='in')it.push(...inActions(x.ref).slice(1,3));if(x.src==='op')it.push(...woActs(x.ref));it.push({label:'Карточка контрагента',icon:'building',run:()=>openCp(CPM[x.cp])});return it}
const FIN_TABS={all:'Все',tax:'Налоги',fee:'Обслуживание',proj:'Проекты и услуги',wo:'Списания и возвраты'};
function finTabs(){const fee=feat('fee')&&can('fee');return [{id:'all',label:'Все',icon:'list'},taxVis()?{id:'tax',label:'Налоги',icon:'send'}:null,fee?{id:'fee',label:'Обслуживание',icon:'coins'}:null,moneyVis()?{id:'proj',label:'Проекты и услуги',icon:'briefcase',count:SERVICES.filter(s=>svcStatus(s)!=='Оплачено'&&visCps(true,'fin').some(c=>c.id===s.cp)).length}:null,taxVis()?{id:'wo',label:'Списания и возвраты',icon:'gift'}:null,taxVis()?{id:'journal',label:'Журнал поступлений',icon:'wallet'}:null]}
function finAdd(){return [taxVis()?{label:'Поступление',icon:'wallet',run:()=>inDlg()}:null,can('projects')?{label:'Разовая услуга',icon:'coins',run:()=>serviceDlg()}:null].filter(Boolean)}
function renderFin(body,tab,fresh){
  if(!taxVis()&&!moneyVis()){body.innerHTML=`<div class="note">${ic('lock')}<span>Финансовые операции видны сотрудникам с правом «Учёт денег и оплата налогов», «Видеть плату за обслуживание» или «Вести проекты и разовые услуги».</span></div>`;return}
  if(tab==='journal')return renderJournal(body,fresh);
  if(tab==='services')tab='proj';
  const m=ym(TODAY);const rs=finRows().filter(x=>ym(x.date)===m&&!x.dup);const s=f=>rs.filter(f).reduce((a,x)=>a+x.amount,0);
  const inT=s(x=>x.src==='op'&&x.ref.kind==='in'),pay=s(x=>x.src==='op'&&x.ref.kind==='pay'),fee=finRows().filter(x=>x.src==='fee'&&ym(x.date)===m).reduce((a,x)=>a+x.amount,0),pj=s(x=>x.src==='proj')+SERVICES.reduce((a,v)=>a+v.pays.filter(p=>ym(p.date)===m).reduce((b,p)=>b+p.amount,0),0),wo=s(x=>x.grp==='wo');
  body.innerHTML=`<div class="plates">
    ${taxVis()?plate({id:'tax',icon:'wallet',color:'green',label:'Поступило на налоги',value:fmtM(inT,false),unit:'сом',sub:`оплачено в бюджет ${fmtM(pay,false)}`,on:tab==='tax'}):''}
    ${feat('fee')&&can('fee')?plate({id:'fee',icon:'coins',color:'purple',label:'Получено за обслуживание',value:fmtM(fee,false),unit:'сом',sub:ymLabel(m),on:tab==='fee'}):''}
    ${moneyVis()?plate({id:'proj',icon:'briefcase',color:'orange',label:'Проекты и разовые услуги',value:fmtM(pj,false),unit:'сом',sub:'получено за '+ymLabel(m).toLowerCase(),on:tab==='proj'}):''}
    ${taxVis()?plate({id:'wo',icon:'gift',color:'blue',label:'Списания и возвраты',value:fmtM(wo,false),unit:'сом',sub:ymLabel(m),on:tab==='wo'}):''}
  </div>${tab==='proj'?`<div class="note">${ic('info')}<span>Разовая услуга — одна операция со статусом оплаты. Оплаты по проектам — отдельные поступления (транши).</span></div>`:''}${tab==='fee'&&taxVis()?`<div class="note">${ic('info')}<span>Оплаты за обслуживание поступают только на счёт организации. Часть общего поступления «налоги + обслуживание» показана здесь отдельной строкой.</span></div>`:''}<div id="fg"></div>`;
  body.querySelector('.plates').onclick=e=>{const b=e.target.closest('[data-plate]');if(!b)return;go('fin',b.dataset.plate===tab?'all':b.dataset.plate)};
  const rows=()=>finRows().filter(x=>tab==='all'?!x.dup:tab==='fee'?x.grp==='fee':x.grp===tab);
  grid($('#fg',body),{id:'fin-'+tab,cols:finCols(),rows,title:'what',noun:['операция','операции','операций'],sort:{key:'date',dir:-1},preset:S.preset,simulateLoad:fresh,open:openFinRow,actions:finActions,
    empty:{icon:'coins',title:'Операций пока нет',add:tab==='proj'&&can('projects')?()=>serviceDlg():null}});
}
/* Журнал поступлений: одна строка — один перевод контрагента с детализацией */
/* Поступление можно править, пока из него не оплачен налог (оплата по отчёту из его детализации, а для аванса — любая оплата после него) */
const inEditable=o=>{const rs=new Set((o.alloc||[]).map(x=>x.r));return !OPS.some(p=>p.cp===o.cp&&p.kind==='pay'&&p.id>o.id&&(!rs.size||rs.has(p.report)))};
const corrOf=o=>OPS.filter(x=>x.kind==='corr'&&x.ref===o.id).reduce((a,x)=>a+x.amount,0);
function inActions(o){const c=CPM[o.cp];const ed=inEditable(o);return [{label:'Открыть',icon:'wallet',run:()=>inCard(o)},{label:'Изменить',icon:'edit',disabled:!ed||c.archived,reason:!ed?'Из этих денег уже оплачен налог — исправить можно только обратной записью':'',run:()=>inDlg(c,o)},{label:'Обратная запись',icon:'refresh',sub:'С причиной, исходная запись остаётся',run:()=>corrDlg(o)},{label:'Карточка контрагента',icon:'building',run:()=>openCp(c)}]}
function orgHeld(c){let b=0;OPS.forEach(o=>{if(o.cp!==c.id||!OPK[o.kind])return;if(o.kind==='xfer'){b-=o.amount;return}if(o.holder!=='org')return;b+=['in','back','corr'].includes(o.kind)?o.amount:-o.amount});return Math.max(0,b)}
function xferDlg(c){const max=Math.min(orgHeld(c),c.avail);openModal({form:true,render:()=>({title:'Перевод на счёт сотрудника',sub:`${esc(c.name)} · на счёте организации ${som(max)}`,body:`<div class="form">${fld('Кому',sel('xf-to',EMP.filter(e=>e.active&&e.role!=='owner').map(e=>[e.id,e.fio+(e.id===c.resp?' — ответственный':'')]),c.resp),{req:true,id:'xf-to'})}${fld('Сумма',inp('xf-sum',fmtM(max,false),'inputmode="decimal"'),{req:true,id:'xf-sum',hint:'Не больше '+som(max)})}${fld('Дата',inp('xf-date',TODAY,'type="date"'),{req:true,id:'xf-date'})}${fld('Комментарий',inp('xf-note',''),{id:'xf-note',full:true})}</div><div class="note">${ic('info')}<span>Остаток контрагента не меняется: деньги только переходят со счёта организации на счёт сотрудника, который оплачивает налоги этого контрагента.</span></div>`,
  foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="xf-ok">Перевести</button>',
  mount(el,m){$('#xf-ok',el).onclick=()=>{const a=parseNum(val(el,'xf-sum'));if(!setErr(el,'xf-sum',!(a>0)?'Введите сумму':a>max+0.001?'Больше, чем есть на счёте организации по этому контрагенту':''))return;const to=val(el,'xf-to');
    OPS.push(born({id:OPID++,cp:c.id,kind:'xfer',amount:a,date:val(el,'xf-date')||TODAY,by:S.me,holder:to,from:'org',note:'Со счёта организации на счёт '+empName(to)+(val(el,'xf-note')?'. '+val(el,'xf-note'):'')}));log('cp',c.id,`Перевод ${som(a)} со счёта организации на счёт ${empName(to)}`,c.id);m.close();derive();refreshAll();toast('Перевод записан','send')}}})})}
function empBal(e){let b=0;OPS.forEach(o=>{if(o.holder!==e.id||!OPK[o.kind])return;b+=['in','back','corr','xfer'].includes(o.kind)?o.amount:-o.amount});return b}
function renderJournal(body,fresh){
  body.innerHTML=`<div class="note">${ic('info')}<span>Контрагент может перевести одну общую сумму сразу за несколько налогов, например «Укс»: 15 000 сом = ЕН 5 000 + Соцфонд 5 000 + ПН 5 000. Общая сумма может быть больше детализации (излишек — аванс), но не меньше. Пока из поступления не оплачен налог, его можно изменить; после оплаты — только обратной записью с причиной.</span></div><div id="jg"></div>`;
  const rows=()=>{const vc=new Set(visCps(true,'fin').map(c=>c.id));return OPS.filter(o=>o.kind==='in'&&vc.has(o.cp))};
  grid($('#jg',body),{id:'fin-journal',cols:[
    {key:'date',label:'Дата',type:'date',w:110,val:o=>o.date},
    {key:'cp',label:'Контрагент',type:'enum',w:220,val:o=>CPM[o.cp].name,html:o=>`<span class="strong">${esc(CPM[o.cp].name)}</span>`},
    {key:'total',label:'Общая сумма',type:'money',w:140,num:true,total:true,val:o=>o.total??o.amount},
    {key:'dist',label:'Распределено',type:'money',w:140,num:true,total:true,val:o=>(o.alloc||[]).reduce((a,x)=>a+x.a,0)+(o.feeAlloc||[]).reduce((a,x)=>a+x.a,0)},
    {key:'alloc',label:'Детализация',type:'text',w:360,hide:true,val:o=>allocText(o)||'аванс',html:o=>(o.alloc||[]).length+(o.feeAlloc||[]).length>1?`<span class="tag">${(o.alloc||[]).length+(o.feeAlloc||[]).length} строки</span> ${esc(allocText(o))}`:esc(allocText(o)||'аванс')},
    {key:'tax',label:'На налоги',type:'money',w:130,num:true,total:true,val:o=>o.amount,hide:true},
    {key:'fee',label:'За обслуживание',type:'money',w:140,num:true,total:true,val:o=>(o.feeAlloc||[]).reduce((a,x)=>a+x.a,0),hide:!(feat('fee')&&can('fee'))},
    {key:'adv',label:'Остаток (аванс)',type:'money',w:140,num:true,total:true,val:o=>advOf(o)},
    {key:'corr',label:'Обратные записи',type:'money',w:130,num:true,val:o=>corrOf(o)||null,hide:true},
    {key:'ed',label:'Изменение',type:'enum',w:170,val:o=>inEditable(o)?'Можно изменить':'Только обратная запись',html:o=>inEditable(o)?`<span class="pill green sm">${ic('edit')}можно изменить</span>`:`<span class="pill sm">${ic('lock')}обратной записью</span>`},
    {key:'files',label:'Файл',type:'int',w:90,num:true,val:o=>(o.files||[]).length,html:o=>(o.files||[]).length?`${ic('clip','sm')} ${(o.files||[]).length}`:'<span class="faint">—</span>'},
    {key:'by',label:'Кто внёс',type:'enum',w:130,val:o=>whoName(o.by),hide:true},
    {key:'note',label:'Комментарий',type:'text',w:220,val:o=>o.note||'',hide:true},
    {key:'holder',label:'На счёт',type:'enum',w:140,val:o=>o.holder==='org'?'Организации':empName(o.holder),hide:true}],
    rows,title:'cp',noun:['поступление','поступления','поступлений'],sort:{key:'date',dir:-1},preset:S.preset,simulateLoad:fresh,open:inCard,actions:inActions,empty:{icon:'wallet',title:'Поступлений пока нет'}});
}
function inCard(o){const c=CPM[o.cp];
  openModal({size:'mid',live:true,render:()=>{const fa=(o.feeAlloc||[]).reduce((a,x)=>a+x.a,0),corr=OPS.filter(x=>x.kind==='corr'&&x.ref===o.id);const ed=inEditable(o);
    return {title:`Поступление ${som(o.total??o.amount)}`,sub:`${esc(c.name)} · ${fmtD(o.date)}`,body:`<div class="row">${ed?`<span class="pill green">${ic('edit')}можно изменить</span>`:`<span class="pill">${ic('lock')}из него оплачен налог: изменение только обратной записью</span>`}</div>
    <div class="box"><div class="kv"><div><span class="k">Общая сумма</span><span class="v tnum strong">${som(o.total??o.amount)}</span></div><div><span class="k">На налоги</span><span class="v tnum">${som(o.amount)}</span></div>${fa?`<div><span class="k">За обслуживание</span><span class="v tnum">${som(fa)}</span></div>`:''}<div><span class="k">Аванс</span><span class="v tnum">${som(advOf(o))}</span></div><div><span class="k">На счёт</span><span class="v">${o.holder==='org'?'организации':'сотрудника '+esc(empName(o.holder))}</span></div>${auditKv(o._cb?o:Object.assign({_cb:o.by,_ca:o.date+' 00:00'},o))}</div></div>
    <div class="box"><h3>Детализация</h3><table class="mini"><thead><tr><th>За что</th><th class="num">Сумма</th></tr></thead><tbody>${(o.alloc||[]).map(x=>{const r=REPORTS.find(y=>y.id===x.r);return `<tr class="clk" data-rep="${x.r}"><td>${r?esc(T[r.t].short+' · '+r.plabel):'—'}</td><td class="num">${fmtM(x.a)}</td></tr>`}).join('')}${(o.feeAlloc||[]).map(x=>`<tr><td>${ic('coins','sm')} Обслуживание · ${esc(ymLabel(x.m))}</td><td class="num">${fmtM(x.a)}</td></tr>`).join('')}${advOf(o)>0?`<tr><td class="muted">Аванс, не распределён</td><td class="num">${fmtM(advOf(o))}</td></tr>`:''}<tr><td><b>Итого</b></td><td class="num"><b>${fmtM(o.total??o.amount)}</b></td></tr></tbody></table></div>
    ${corr.length?`<div class="box"><h3>Обратные записи</h3><table class="mini"><tbody>${corr.map(x=>`<tr><td>${fmtD(x.date)}</td><td>${esc(x.note)}</td><td>${esc(whoName(x.by))}</td><td class="num">${x.amount>0?'+':''}${fmtM(x.amount)}</td></tr>`).join('')}</tbody></table></div>`:''}
    ${filesBox(o.files=o.files||[],'ic-f',true,'Файлы',{ent:'in',id:o.id,cp:o.cp})}${histBox('in',o.id)}`,
    foot:`<button class="btn" id="ic-corr">${ic('refresh','sm')}Обратная запись</button>${ed&&!c.archived?`<button class="btn" id="ic-edit">${ic('edit','sm')}Изменить</button>`:''}<div class="grow"></div><button class="btn cta" data-close>Готово</button>`,
    mount(el,m){$('#ic-corr',el).onclick=()=>corrDlg(o);if($('#ic-edit',el))$('#ic-edit',el).onclick=()=>inDlg(c,o);$$('[data-rep]',el).forEach(x=>x.onclick=()=>openReport(REPORTS.find(r=>r.id===+x.dataset.rep)));bindFiles(el,'ic-f',o.files,f=>{HIST.push({at:nowStamp(),who:S.me,ent:'in',id:o.id,cp:o.cp,what:'Прикреплены файлы: '+f.join(', ')});m.draw()})}}}});
}
function corrDlg(o){const c=CPM[o.cp];
  openModal({form:true,render:()=>({title:'Обратная запись к поступлению',sub:`${esc(c.name)} · ${som(o.total??o.amount)} от ${fmtD(o.date)}`,body:`<div class="form">${fld('Что сделать',sel('cr-sign',[['-','Уменьшить: поступило меньше'],['+','Увеличить: поступило больше']],'-'),{id:'cr-sign'})}${fld('Сумма, сом',inp('cr-sum','','inputmode="decimal" class="inp tnum"'),{req:true,id:'cr-sum'})}${fld('Дата',inp('cr-date',TODAY,'type="date"'),{req:true,id:'cr-date'})}<div></div>${fld('Причина',inp('cr-why','','placeholder="Например: ошибка в сумме платёжки"'),{req:true,full:true,id:'cr-why'})}</div>
    <div class="note">${ic('info')}<span>Обратная запись — отдельная строка журнала с причиной. Исходное поступление и оплаты налогов не меняются, остаток на счёте пересчитается. Если денег на неоплаченные налоги станет меньше, у них появится «Недостача». Всё попадает в историю.</span></div>`,
    foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="cr-ok">Записать</button>',
    mount(el,m){$('#cr-ok',el).onclick=()=>{const n=parseNum(val(el,'cr-sum'));const minus=val(el,'cr-sign')==='-';
      const ok=[setErr(el,'cr-sum',isNaN(n)||n<=0?'Введите сумму больше нуля':minus&&n>Math.min(c.avail,(o.amount||0)+corrOf(o))?`Уменьшить можно не больше чем на ${som(Math.max(0,Math.min(c.avail,(o.amount||0)+corrOf(o))))}: столько осталось на счёте от денег контрагента и от этого поступления`:''),setErr(el,'cr-why',val(el,'cr-why')?'':'Укажите причину')].every(Boolean);if(!ok)return;
      const amt=minus?-n:n;const x={id:OPID++,cp:c.id,kind:'corr',amount:amt,date:val(el,'cr-date')||TODAY,by:S.me,holder:o.holder,ref:o.id,note:`К поступлению от ${fmtD(o.date)}: ${val(el,'cr-why')}`,_cb:S.me,_ca:nowStamp()};OPS.push(x);
      HIST.push({at:nowStamp(),who:S.me,ent:'in',id:o.id,cp:c.id,what:`Обратная запись ${amt>0?'+':'−'}${som(n)}: ${val(el,'cr-why')}`});log('cp',c.id,`Обратная запись к поступлению от ${fmtD(o.date)}: ${amt>0?'+':'−'}${som(n)}`,c.id);m.close();refreshAll();toast('Обратная запись сделана')}}})});
}
function renderServices(body,fresh){body.innerHTML='<div id="sg"></div>';
  grid($('#sg',body),{id:'fin-svc',cols:[{key:'date',label:'Дата',type:'date',w:110,val:s=>s.date},{key:'cp',label:'Контрагент',type:'enum',w:220,val:s=>CPM[s.cp].name,html:s=>`<span class="strong">${esc(CPM[s.cp].name)}</span>${CPM[s.cp].kind==='oneoff'?' <span class="tag">разовый</span>':''}`},{key:'name',label:'Услуга',type:'text',w:300,val:s=>s.name},{key:'resp',label:'Исполнитель',type:'enum',w:130,val:s=>empName(s.resp)},
    {key:'amount',label:'Стоимость',type:'money',w:130,num:true,total:true,val:s=>s.amount},{key:'paid',label:'Получено',type:'money',w:130,num:true,total:true,val:s=>svcPaid(s)},{key:'left',label:'Осталось',type:'money',w:130,num:true,total:true,val:s=>s.amount-svcPaid(s),html:s=>s.amount>svcPaid(s)?`<span class="red strong">${fmtM(s.amount-svcPaid(s))}</span>`:'<span class="faint">0,00</span>'},
    {key:'st',label:'Оплата',type:'enum',w:170,val:svcStatus,html:s=>pill(svcStatus(s),PST)},{key:'files',label:'Файлов',type:'int',w:90,num:true,val:s=>s.files.length,hide:true}],
    rows:()=>{const vc=new Set(visCps(true,'fin').map(c=>c.id));return SERVICES.filter(s=>vc.has(s.cp))},title:'name',noun:['услуга','услуги','услуг'],sort:{key:'date',dir:-1},preset:S.preset,simulateLoad:fresh,open:serviceCard,actions:svcActions,
    empty:{icon:'coins',title:'Разовых услуг пока нет',add:can('projects')?()=>serviceDlg():null}})}

