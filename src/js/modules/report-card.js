'use strict';
// Карточка отчёта
/* ── Report card ── */
function openReport(r){
  if(!r)return;
  openModal({size:'mid',live:true,render:m=>{
    r=REPORTS.find(x=>x.id===r.id)||r;const t=tR(r),c=CPM[r.cp];const sch=schedule(r);
    const versions=REPORTS.filter(x=>x.cp===r.cp&&x.t===r.t&&x.pkey===r.pkey).sort((a,b)=>a.ver-b.ver);
    const hist=HIST.filter(h=>h.ent==='r'&&h.id===r.id).sort((a,b)=>a.at<b.at?1:-1);
    const primary=OPEN.has(r.status)&&!t.payOnly?{l:'Отметить сданным',i:'send',f:()=>submitDlg([r]),ok:can('changeStatus')}:r.status==='Сдан'?{l:'Отметить принятым',i:'ok',f:()=>acceptDlg(r),ok:can('changeStatus')}:(feat('taxpay')&&t.sum&&r.sum>0&&r.paid<r.sum&&r.money&&r.money.s==='ok')?{l:'Отметить оплаченным',i:'wallet',f:()=>payDlg(r),ok:can('money')}:null;
    return {title:`${esc(t.name)} ${actPill(t.act)}${r.ver?` <span class="tag blue" style="font-size:12px;vertical-align:3px">уточнённый ${r.ver}</span>`:''}`,sub:`${esc(c.name)} · ${esc(r.phuman)} · ${esc(t.organ)}${t.sum&&(t.pays||[]).length?`<br>Что уплачивается: ${esc(paysTxt(t))}`:''}`,
    body:`<div class="box"><div class="scales">${t.payOnly?'':scaleFull('rep',r.status,r.id)}${t.sum&&feat('taxpay')?scaleFull('pay',r.payStatus,r.id):''}</div></div><div class="row">${r.overdue?`<span class="pill red">${ic('alert')}Просрочен на ${diffDays(TODAY,r.due)} ${plural(diffDays(TODAY,r.due),'день','дня','дней')}</span>`:''}${r.status==='Сдан'?`<span class="pill blue">${ic('hourglass')}Ждём подтверждения ${diffDays(TODAY,r.subDate)} дн.</span>`:''}</div>
    <div class="box"><div class="kv">
      ${auditKv(r)}<div><span class="k">Контрагент</span><span class="v"><button class="linkbtn" id="rc-cp">${esc(c.name)}</button></span></div>
      <div><span class="k">ИНН</span><span class="v mono">${c.inn}</span></div>
      <div><span class="k">Код формы · периодичность</span><span class="v">${esc(t.code)} · ${PER_LABEL[tFor(r).per].toLowerCase()}</span></div>${rateOf(r)?`<div><span class="k">Ставка</span><span class="v">${esc(rateOf(r))}</span></div>`:''}${sfTypeIds().includes(t.id)&&sfState(c)?`<div><span class="k">Тариф Соцфонда</span><span class="v">${sfPill(sfState(c).cur,1)}${(sfState(c).cur&&sfCapTxt(sfState(c).cur))?`<div class="hint">Взносы не начисляются на часть зарплаты выше предельной базы (${esc(sfCapTxt(sfState(c).cur))})</div>`:''}</span></div>`:''}${c.ugns?`<div><span class="k">УГНС</span><span class="v">${esc(ugnsLabel(c.ugns))}</span></div>`:''}
      ${t.payOnly?'':`<div><span class="k">Срок сдачи</span><span class="v ${r.overdue?'red strong':''}">${fmtD(r.due)}${r.due!==r.dueBase?`<div class="hint">перенесён с ${fmtD(r.dueBase)}: ${esc(holidayName(r.dueBase)||'выходной')}</div>`:''}</span></div>`}
      <div><span class="k">Ответственный</span><span class="v">${esc(empName(r.resp)||'—')}${can('assign')?` <button class="linkbtn" id="rc-resp" style="font-size:12px">сменить</button>`:''}</span></div>
      ${t.payOnly?'':`<div><span class="k">Дата сдачи · принятия</span><span class="v">${r.subDate?fmtD(r.subDate):'—'} · ${r.accDate?fmtD(r.accDate):'—'}</span></div>`}
      ${t.sum?`<div><span class="k">Сумма к уплате</span><span class="v strong tnum">${r.sum==null?'<span class="faint">не указана</span>':som(r.sum)}${r.auto?` <span class="tag">${ic('repeat','sm')} повторяющаяся</span>`:''}</span></div>
      ${feat('taxpay')&&r.sum>0?`<div><span class="k">Получено под этот отчёт</span><span class="v tnum">${som(r.recv||0)} <span class="faint">· ${r.recv>=r.sum?'получены':r.recv>0?'получены частично':'ожидаем'}</span></span></div>`:''}
      ${feat('taxpay')?`<div><span class="k">Оплачено в бюджет</span><span class="v tnum">${som(r.paid)}${r.sum!=null&&r.paid>r.sum?` <span class="tag yellow">+${fmtM(r.paid-r.sum)} пеня/переплата</span>`:''}</span></div>
      <div><span class="k">Срок оплаты</span><span class="v ${r.payOverdue?'red strong':''}">${fmtD(r.payDue)}</span></div>
      <div><span class="k">Деньги контрагента</span><span class="v">${moneyHtml(r)}</span></div>`:''}`:`<div><span class="k">Сумма к уплате</span><span class="v faint">у этого вида отчёта суммы нет</span></div>`}
    </div>${sfPeniNote(r)}</div>
    ${t.sum&&sch.length>1?`<div class="box"><h3>График оплаты · ${sch.length} платежа</h3><table class="mini"><thead><tr><th>Срок</th><th class="num">Сумма</th><th class="num">Оплачено</th><th>Статус</th></tr></thead><tbody>${sch.map(s=>`<tr><td class="${s.paid<s.amount&&s.due<TODAY?'red strong':''}">${fmtD(s.due)}</td><td class="num">${fmtM(s.amount)}</td><td class="num">${fmtM(s.paid)}</td><td>${pill(s.paid>=s.amount?'Оплачено':s.paid>0?'Оплачено частично':'Не оплачено',PST)}</td></tr>`).join('')}</tbody></table></div>`:''}
    ${versions.length>1?`<div class="box"><h3>Версии</h3><table class="mini"><tbody>${versions.map(v=>`<tr class="clk" data-ver="${v.id}"><td>${v.ver?'Уточнённый '+v.ver:'Первичный'}${v.id===r.id?' <span class="tag">открыт</span>':''}</td><td>${pill(v.status,ST)}</td><td class="num">${v.sum==null?'—':fmtM(v.sum)}</td></tr>`).join('')}</tbody></table></div>`:''}
    ${feat('files')?`<div class="box"><h3>Файлы<span class="grow"></span><button class="btn sm" id="rc-file">${ic('clip','sm')}Прикрепить</button></h3>${r.files.length?(FBOX['rc-'+r.id]={files:r.files,ent:'r',id:r.id,cp:r.cp},r.files.map((f,i)=>`<div class="row">${ic('file','sm')}<span class="grow">${esc(f)}</span>${can('changeStatus')?`<button class="icon-btn sm" data-fdel="rc-${r.id}:${i}" title="Удалить файл" aria-label="Удалить ${esc(f)}">${ic('trash','sm')}</button>`:''}</div>`).join('')):'<span class="faint">Файлов нет</span>'}</div>`:''}
    <div class="box"><h3>История статусов</h3>${t.payOnly?'':statusHistHtml('rep',r,t.sum&&feat('taxpay')?'Сдача':'')}${t.sum&&feat('taxpay')?statusHistHtml('pay',r,t.payOnly?'':'Оплата'):''}</div>
    <div class="box"><h3>История изменений</h3>${hist.length?`<ul class="tl">${hist.map(h=>`<li><span class="t">${fmtD(h.at.slice(0,10))}<br>${h.at.slice(11)}</span><span>${esc(h.what)}<br><span class="w">${esc(whoName(h.who))}</span></span></li>`).join('')}</ul>`:'<span class="faint">Изменений пока не было</span>'}</div>`,
    foot:`<button class="btn" id="rc-more">${ic('more','sm')}Ещё действия</button><div class="grow"></div>${canRecv(r)?`<button class="btn" id="rc-recv">${ic('download','sm')}Принять деньги</button>`:''}${primary?`<button class="btn cta" id="rc-main" ${primary.ok?'':'disabled'}>${ic(primary.i,'sm')}${primary.l}</button>`:''}`,
    mount(el,mm){const q=s=>el.querySelector(s);
      q('#rc-more').onclick=e=>menu(e.currentTarget,reportActions(r).filter(x=>x.label!=='Открыть карточку'));
      if(q('#rc-main'))q('#rc-main').onclick=primary.f;if(q('#rc-recv'))q('#rc-recv').onclick=()=>recvDlg(r);
      q('#rc-cp').onclick=()=>openCp(c);
      if(q('#rc-file'))q('#rc-file').onclick=()=>fileDlg(r);
      if(q('#rc-resp'))q('#rc-resp').onclick=e=>menu(e.currentTarget,EMP.filter(x=>x.active).map(x=>({label:x.short,icon:'user',on:x.id===r.resp,run:()=>{const o=r.resp;r.resp=x.id;log('r',r.id,`Ответственный: ${empName(o)||'—'} → ${x.short}`,r.cp);refreshAll();toast('Ответственный изменён. Задача перешла к новому сотруднику.')}})));
      $$('[data-ver]',el).forEach(tr=>tr.onclick=()=>{const v=REPORTS.find(x=>x.id===+tr.dataset.ver);if(v.id!==r.id){mm.close();openReport(v)}});
    }};
  }});
}
function adhocDlg(){
  const cps=visCps();
  openModal({form:true,render:()=>({title:'Разовый отчёт',sub:'Например, пропущенный период или отчёт по запросу органа',body:`<div class="form">${fld('Контрагент',sel('ah-cp',cps.map(c=>[c.id,c.name]),cps[0]&&cps[0].id),{req:true,full:true,id:'ah-cp'})}${fld('Вид отчёта',sel('ah-t',RT.filter(t=>ORG.types[t.id]&&ORG.types[t.id].on&&t.active!==false).map(t=>[t.id,t.name]),'nds'),{req:true,full:true,id:'ah-t'})}${fld('Месяц периода',inp('ah-p',addMonths(ym(TODAY),-1),'type="month"'),{req:true,id:'ah-p',hint:'Для квартальных и годовых берётся квартал или год этого месяца'})}${fld('Срок сдачи',inp('ah-d',addDays(TODAY,7),'type="date"'),{req:true,id:'ah-d'})}${fld('Причина',sel('ah-rs',DICT.reasons.items.filter(x=>x.active).map(x=>x.name),'Другое'),{full:true,id:'ah-rs'})}</div>`,
    foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="ah-ok">Создать отчёт</button>',
    mount(el,m){$('#ah-ok',el).onclick=()=>{const c=CPM[+val(el,'ah-cp')],t=T[val(el,'ah-t')];if(![setErr(el,'ah-cp',c?'':'Нет контрагентов: сначала добавьте контрагента'),setErr(el,'ah-t',t?'':'Нет подключённых видов отчётов: подключите их в «Справочники» → «Виды отчётов»'),setErr(el,'ah-p',/^\d{4}-\d{2}$/.test(val(el,'ah-p'))?'':'Укажите месяц')].every(Boolean))return;const p=perOfYm(t,val(el,'ah-p'));
      if(REPORTS.some(r=>r.cp===c.id&&r.t===t.id&&r.pkey===pstart(t,p)&&!r.superseded)){setErr(el,'ah-p','Такой отчёт уже есть: один контрагент + вид + период = один отчёт');return}
      const r=born(makeReport(c,t,p,c.resp));r.due=r.dueBase=val(el,'ah-d');REPORTS.push(r);log('r',r.id,`Создан вручную (${val(el,'ah-rs')})`,c.id);m.close();refreshAll();toast('Отчёт создан');openReport(r)}}})});
}

