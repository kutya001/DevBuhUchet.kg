'use strict';
// Модуль «Задачи»
/* ═════════════ Задачи ═════════════ */
const taskOpen=t=>t.reg?t.status!=='Принят'&&t.status!=='Не требуется':t.status==='К выполнению'||t.status==='В работе';
const taskOver=t=>(t.reg?OPEN.has(t.status):taskOpen(t))&&t.date<TODAY;
function allTasks(){
  const m=ym(TODAY);
  const reg=REPORTS.filter(r=>!r.superseded&&r.status!=='Не требуется'&&!CPM[r.cp].archived&&(ym(r.due)===m||(OPEN.has(r.status)&&r.due<TODAY&&r.due>=addDays(TODAY,-75)))).map(r=>({id:'r'+r.id,reg:true,rid:r.id,title:`${tR(r).payOnly?'Оплатить':'Сдать'} ${tR(r).payOnly?T[r.t].name.toLowerCase():T[r.t].short} за ${r.phuman} — ${CPM[r.cp].name}`,cat:tR(r).payOnly?'Оплата':'Сдача отчёта',cp:r.cp,exec:r.resp,by:null,kind:'day',date:r.due,needFile:!!(ORG.types[r.t]&&ORG.types[r.t].needFile),_cb:'system',_ca:r._ca,_ub:r._ub,_ua:r._ua,status:r.status}));
  return TASKS.concat(reg)}
function taskScope(){return can('tasksAll')?allTasks():allTasks().filter(t=>t.exec===S.me||t.by===S.me)}
function taskTabs(){const sc=taskScope();return [
 {id:'mine',label:'Мои',icon:'user',count:sc.filter(t=>t.exec===S.me&&taskOpen(t)).length},
 can('tasksCreate')?{id:'byme',label:'Поставленные мной',icon:'send',count:TASKS.filter(t=>t.by===S.me&&taskOpen(t)).length}:null,
 can('tasksAll')?{id:'all',label:'Все',icon:'list'}:null,
 {id:'overdue',label:'Просроченные',icon:'alert',count:sc.filter(taskOver).length,red:true}]}
function taskAdd(){return can('tasksCreate')?[{label:'Задача',icon:'task',run:()=>taskDlg()}]:[]}
function taskCols(){return [
 {key:'title',label:'Задача',type:'text',w:330,val:t=>t.title,html:t=>`${t.reg?'<span class="tag" title="Создана системой по отчёту">регулярная</span> ':''}<span class="strong">${esc(t.title)}</span>`},
 {key:'cp',label:'Контрагент',type:'enum',w:190,val:t=>t.cp?CPM[t.cp].name:'Общие задачи',text:t=>t.cp?CPM[t.cp].name:'',html:t=>t.cp?esc(CPM[t.cp].name):'<span class="faint">Общая</span>',pin:'Общие задачи',hide:true},
 {key:'proj',label:'Проект',type:'enum',w:200,val:t=>t.proj?(PROJECTS.find(p=>p.id===t.proj)||{}).name||'':'',hide:true},
 {key:'cat',label:'Категория',type:'enum',w:150,val:t=>t.cat},
 {key:'exec',label:'Исполнитель',type:'enum',w:130,val:t=>empName(t.exec)},
 {key:'date',label:'Срок',type:'date',w:150,val:t=>t.date,html:t=>`<span class="${taskOver(t)?'red strong':''}">${taskOver(t)?ic('alert','sm')+' ':''}${t.kind==='month'?'до '+fmtD(t.date):fmtD(t.date)}</span> <span class="tag ${t.kind==='month'?'kd-month':'kd-day'}">${t.kind==='month'?'Месяц':'День'}</span>`},
 {key:'status',label:'Статус',type:'enum',w:220,val:t=>t.status,html:t=>t.reg?scaleMini('rep',t.status,REPORTS.find(r=>r.id===t.rid))+' <span class="tag" title="Статус берётся из отчёта">отчёт</span>':scaleMini('task',t.status,t)},
 {key:'needf',label:'Нужен файл',type:'enum',w:110,val:t=>t.needFile?'Да':'Нет',hide:true},{key:'doneAt',label:'Дата выполнения',type:'date',w:130,val:t=>t.doneAt||null,hide:true},{key:'file',label:'Файл',type:'enum',w:110,val:t=>t.needFile?(t.file?'Приложен':'Нужен'):'',html:t=>t.needFile?(t.file?`<span class="pill green sm">${ic('clip')}приложен</span>`:`<span class="pill sm">${ic('clip')}нужен</span>`):'<span class="faint">—</span>'},
 {key:'by',label:'Поставил',type:'enum',w:120,val:t=>t.reg?'Система':empName(t.by)},
 {key:'scope',label:'Вид задачи',type:'enum',w:140,val:t=>t.cp?'По контрагенту':'Общая',hide:true,xls:true},
 {key:'tkind',label:'Тип задачи',type:'enum',w:120,val:t=>t.reg?'Регулярная':'Ручная',hide:true},
 {key:'term',label:'Вид срока',type:'enum',w:120,val:t=>t.kind==='month'?'На месяц':'На день',hide:true},
 {key:'open',label:'Открыта',type:'enum',w:100,val:t=>taskOpen(t)?'Да':'Нет',hide:true}]}
function taskActions(t){
  if(t.reg){const r=REPORTS.find(x=>x.id===t.rid);return [{label:'Открыть отчёт',icon:'file',run:()=>openReport(r)},...(OPEN.has(r.status)?[{label:'Отметить отчёт сданным',icon:'send',disabled:!can('changeStatus'),run:()=>submitDlg([r])}]:[]),{label:'Задача закроется сама, когда отчёт будет принят',icon:'info',disabled:true}]}
  const mine=t.exec===S.me,boss=t.by===S.me||me().role==='owner';const it=[{label:'Открыть',icon:'task',run:()=>openTask(t)}];
  if(taskOpen(t)){if(t.status==='К выполнению')it.push({label:'Взять в работу',icon:'clock',disabled:!mine&&!boss,run:()=>{t.status='В работе';log('t',t.id,'Статус: К выполнению → В работе');refreshAll();toast('Задача в работе')}});
    it.push({label:'Выполнена',icon:'ok',disabled:!mine,reason:!mine&&'Отметить может только исполнитель',run:()=>taskDoneDlg(t)});
    it.push({label:'Не выполнена',icon:'x',disabled:!mine,reason:!mine&&'Отметить может только исполнитель',run:()=>taskFailDlg(t)});
    if(boss)it.push({label:'Изменить',icon:'edit',run:()=>taskDlg(t)},{sep:true},{label:'Отменить задачу',icon:'ban',danger:true,run:()=>confirmDlg({title:'Отменить задачу?',text:`«${esc(t.title)}» получит статус «Отменена». Исполнитель увидит это в Telegram.`,ok:'Отменить задачу',danger:true,run:()=>{t.status='Отменена';log('t',t.id,'Задача отменена');refreshAll();toast('Задача отменена')}})})}
  return it}
function renderTasks(body,tab,fresh){
  const v=S.taskView;const m=ym(TODAY);
  const reg=taskScope().filter(t=>t.reg&&ym(t.date)===m&&(tab==='mine'?t.exec===S.me:true));const done=reg.filter(t=>{const r=REPORTS.find(x=>x.id===t.rid);return r.status==='Сдан'||r.status==='Принят'}).length;
  body.innerHTML=`<div class="row"><span class="kd-legend"><span class="tag kd-day">День</span> задача на дату <span class="tag kd-month">Месяц</span> задача на месяц</span><span class="muted">${tab==='overdue'?'Все просроченные задачи':`С ${ymG(m)}, вперёд и всё просроченное`}</span><div class="grow"></div>
  ${tab!=='byme'&&reg.length?`<div style="min-width:260px;display:flex;flex-direction:column;gap:4px"><span class="hint">Отчёты ${tab==='mine'?'мои':'всех'} за месяц: <b>сдано ${done} из ${reg.length}</b></span><div class="bar"><i style="width:${Math.round(done/reg.length*100)}%"></i></div></div>`:''}</div><div id="tg"></div>`;
  const rows=()=>{let l=taskScope();if(tab==='mine')l=l.filter(t=>t.exec===S.me);if(tab==='byme')l=TASKS.filter(t=>t.by===S.me);if(tab==='overdue')return l.filter(taskOver);
    return l.filter(t=>ym(t.date)>=m||taskOver(t))};
  grid($('#tg',body),{id:'tasks-'+tab,cols:taskCols(),rows,title:'title',noun:['задача','задачи','задач'],rowClass:t=>(t.kind==='month'?'k-month ':'k-day ')+(taskOver(t)?'overdue':!taskOpen(t)?'muted':''),actions:taskActions,open:openTask,sort:{key:'date',dir:1},preset:S.preset,simulateLoad:fresh,
    empty:{icon:'ok',title:tab==='overdue'?'Просроченных задач нет':'Задач нет',text:'',add:can('tasksCreate')&&tab!=='overdue'?()=>taskDlg():null}});
}
function openTask(t){
  if(!t)return;if(t.reg){openReport(REPORTS.find(r=>r.id===t.rid));return}
  openModal({size:'mid',live:true,render:m=>{const hs=HIST.filter(h=>h.ent==='t'&&h.id===t.id).sort((a,b)=>a.at<b.at?1:-1);
    const pj=t.proj&&PROJECTS.find(p=>p.id===t.proj);
    return {title:esc(t.title),sub:esc(t.cat),body:`<div class="box">${scaleFull('task',t.status,t.id)}</div><div class="row">${taskOver(t)?`<span class="pill red">${ic('alert')}просрочена</span>`:''}${t.needFile?`<span class="pill ${t.file?'green':''}">${ic('clip')}${t.file?'файл приложен':'нужен файл при выполнении'}</span>`:''}</div>
    <div class="box"><div class="kv">${t.cp?`<div><span class="k">Контрагент</span><span class="v"><button class="linkbtn" id="tk-cpl">${esc(CPM[t.cp].name)}</button></span></div>${pj?`<div><span class="k">Проект</span><span class="v"><button class="linkbtn" id="tk-pjl">${esc(pj.name)}</button></span></div>`:''}`:`<div><span class="k">Вид задачи</span><span class="v">Общая задача</span></div>`}${auditKv(t)}<div><span class="k">Исполнитель</span><span class="v">${esc(EM[t.exec]?EM[t.exec].fio:'—')}</span></div><div><span class="k">Поставил</span><span class="v">${esc(empName(t.by))}, ${fmtD(t.created)}</span></div><div><span class="k">Срок</span><span class="v">${t.kind==='month'?'в течение месяца, до '+fmtD(t.date):fmtD(t.date)}</span></div>${t.doneAt?`<div><span class="k">Выполнена</span><span class="v">${fmtD(t.doneAt)}</span></div>`:''}${t.file?`<div><span class="k">Файл</span><span class="v">${ic('file','sm')} ${esc(t.file)}</span></div>`:''}${t.reason?`<div><span class="k">Причина</span><span class="v">${esc(t.reason)}</span></div>`:''}</div>${t.desc?`<p style="margin:0">${esc(t.desc)}</p>`:''}</div>
    <div class="box"><h3>Комментарии · ${t.comments.length}</h3>${t.comments.map(c=>`<div><b>${esc(empName(c.who))}</b> <span class="faint">${fmtD(c.at.slice(0,10))} ${c.at.slice(11)}</span><div>${esc(c.text)}</div></div>`).join('')}<div class="row" style="flex-wrap:nowrap"><input class="inp" id="tk-c" placeholder="Написать комментарий"><button class="btn" id="tk-cs">${ic('send','sm')}</button></div></div>
    <div class="box"><h3>История статусов</h3>${statusHistHtml('task',t)}</div>
    ${hs.length?`<div class="box"><h3>История</h3><ul class="tl">${hs.map(h=>`<li><span class="t">${fmtD(h.at.slice(0,10))}<br>${h.at.slice(11)}</span><span>${esc(h.what)}<br><span class="w">${esc(whoName(h.who))}</span></span></li>`).join('')}</ul></div>`:''}`,
    foot:`<button class="btn" id="tk-more">${ic('more','sm')}Действия</button><div class="grow"></div>${taskOpen(t)&&t.exec===S.me?`<button class="btn ok" id="tk-done">${ic('ok','sm')}Выполнена</button>`:''}`,
    mount(el){const send=()=>{const v=val(el,'tk-c');if(!v)return;t.comments.push({who:S.me,at:TODAY+' '+bishkekNow().hm,text:v});m.draw()};$('#tk-cs',el).onclick=send;$('#tk-c',el).onkeydown=e=>{if(e.key==='Enter')send()};
      if($('#tk-cpl',el))$('#tk-cpl',el).onclick=()=>openCp(CPM[t.cp]);if($('#tk-pjl',el))$('#tk-pjl',el).onclick=()=>openProject(pj);
      $('#tk-more',el).onclick=e=>menu(e.currentTarget,taskActions(t).filter(x=>x.label!=='Открыть'));if($('#tk-done',el))$('#tk-done',el).onclick=()=>taskDoneDlg(t)}}}});
}
function taskDoneDlg(t){openModal({form:true,render:()=>({title:'Задача выполнена',sub:esc(t.title),body:t.needFile?fld('Файл',`<input class="inp" type="file" id="td-f">`,{req:true,id:'td-f',hint:'Постановщик указал, что без файла задачу закрыть нельзя'}):'<p class="muted" style="margin:0">Постановщик увидит, когда и кем задача выполнена.</p>',
  foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn ok" id="td-ok">Выполнена</button>',mount(el,m){$('#td-ok',el).onclick=()=>{let f=null;if(t.needFile){const x=$('#td-f',el).files[0];if(!setErr(el,'td-f',x?'':'Прикрепите файл'))return;f=x.name}t.status='Выполнена';t.doneAt=TODAY;if(f)t.file=f;log('t',t.id,'Задача выполнена'+(f?', файл: '+f:''));m.close();refreshAll();toast('Задача выполнена','ok')}}})})}
function taskFailDlg(t){openModal({form:true,render:()=>({title:'Задача не выполнена',sub:esc(t.title),body:fld('Причина',`<textarea class="inp" id="tf-r" style="min-height:70px"></textarea>`,{req:true,id:'tf-r'}),
  foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="tf-ok">Сохранить</button>',mount(el,m){$('#tf-ok',el).onclick=()=>{const r=val(el,'tf-r');if(!setErr(el,'tf-r',r?'':'Укажите причину'))return;t.status='Не выполнена';t.reason=r;log('t',t.id,'Не выполнена: '+r);m.close();refreshAll();toast('Сохранено')}}})})}
function taskDlg(t,pre){const e=t||Object.assign({},pre||{});const st={kind:e.kind||'day',scope:e.cp?'cp':'gen',withProj:!!e.proj};const wasCp=!!(t&&t.cp);
  const projsOf=cp=>PROJECTS.filter(p=>p.cp===cp&&p.status!=='Отменён'&&(p.status!=='Завершён'||p.id===e.proj));
  openModal({form:true,size:'mid',render:m=>{const cpOn=st.scope==='cp',projOn=cpOn&&feat('projects')&&st.withProj;
    return {title:t?'Изменить задачу':'Новая задача',body:`<div class="form">
    <div class="fld full"><span class="lbl">Вид задачи</span><div class="seg" role="group" aria-label="Вид задачи" id="tk-scope" style="align-self:flex-start;width:max-content">${[['gen','Общая'],['cp','По контрагенту']].map(([k,l])=>`<button type="button" data-k="${k}" class="${st.scope===k?'on':''}">${l}</button>`).join('')}</div>${t&&wasCp&&!cpOn?`<div class="hint red">Контрагент и проект будут убраны из задачи</div>`:''}</div>
    ${fld('Название',inp('tk-title',e.title||''),{req:true,full:true,id:'tk-title'})}${fld('Описание',`<textarea class="inp" id="tk-desc" style="min-height:70px">${esc(e.desc||'')}</textarea>`,{full:true,id:'tk-desc'})}
    ${cpOn?`${fld('Контрагент',sel('tk-cp',[['','— выберите контрагента —'],...visCps().map(c=>[c.id,c.name])],e.cp||''),{req:true,id:'tk-cp'})}${feat('projects')?`<div class="fld"><span class="lbl m-sp">&nbsp;</span><label class="row" style="min-height:35px"><input type="checkbox" class="sw" id="tk-wp" ${st.withProj?'checked':''}> Проект</label></div>`:'<div></div>'}`:''}
    ${projOn?fld('Проект',sel('tk-proj',[['',e.cp?(projsOf(e.cp).length?'— выберите проект —':'— у контрагента нет активных проектов —'):'— сначала выберите контрагента —'],...(e.cp?projsOf(e.cp).map(p=>[p.id,p.name]):[])],e.proj||''),{req:true,full:true,id:'tk-proj',hint:'Задача появится в карточке проекта'}):''}
    ${fld('Категория',sel('tk-cat',DICT.cats.items.filter(x=>x.active).map(x=>x.name),e.cat||'Сбор документов'),{id:'tk-cat'})}<div></div>
    ${fld('Исполнитель',sel('tk-exec',EMP.filter(x=>x.active).map(x=>[x.id,x.short]),e.exec||'e3'),{req:true,id:'tk-exec'})}${fld('Вид срока',sel('tk-kind',[['day','На день'],['month','На месяц']],st.kind),{id:'tk-kind'})}
    ${st.kind==='day'?fld('Дата',inp('tk-date',e.date||addDays(TODAY,1),'type="date"'),{req:true,id:'tk-date'}):fld('Месяц',inp('tk-month',e.date?ym(e.date):ym(TODAY),'type="month"'),{req:true,id:'tk-month',hint:'Срок — последний день месяца'})}
    <div class="fld"><label class="lbl">При выполнении</label><label class="row" style="min-height:35px"><input type="checkbox" class="sw" id="tk-file" ${e.needFile?'checked':''}> Требуется файл</label></div></div><div class="hint">Исполнитель получит уведомление в Telegram о новой задаче и о сроке.</div>`,
    foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="tk-ok">'+(t?'Сохранить':'Поставить задачу')+'</button>',
    mount(el){const snapT=()=>{e.title=val(el,'tk-title');e.desc=val(el,'tk-desc');e.cat=val(el,'tk-cat');if($('#tk-cp',el))e.cp=+val(el,'tk-cp')||'';if($('#tk-proj',el))e.proj=val(el,'tk-proj')||null;e.exec=val(el,'tk-exec');e.needFile=$('#tk-file',el).checked;if($('#tk-date',el))e.date=val(el,'tk-date')};
      $$('#tk-scope button',el).forEach(b=>b.onclick=()=>{snapT();st.scope=b.dataset.k;m.draw()});
      $('#tk-kind',el).onchange=ev=>{snapT();st.kind=ev.target.value;m.draw()};
      if($('#tk-cp',el))$('#tk-cp',el).onchange=()=>{snapT();e.proj=null;m.draw()};
      if($('#tk-wp',el))$('#tk-wp',el).onchange=ev=>{snapT();st.withProj=ev.target.checked;if(!st.withProj)e.proj=null;m.draw()};
      $('#tk-ok',el).onclick=()=>{const title=val(el,'tk-title');if(!setErr(el,'tk-title',title?'':'Введите название'))return;
        const cp=st.scope==='cp'?+val(el,'tk-cp')||null:null;if(st.scope==='cp'&&!setErr(el,'tk-cp',cp?'':'Выберите контрагента'))return;
        const proj=st.scope==='cp'&&$('#tk-proj',el)?val(el,'tk-proj')||null:null;if($('#tk-proj',el)&&!setErr(el,'tk-proj',proj?'':'Выберите проект или снимите галочку «Проект»'))return;
        const date=st.kind==='day'?val(el,'tk-date'):lastDay(val(el,'tk-month'));if(st.kind==='day'&&!setErr(el,'tk-date',date?'':'Укажите дату'))return;
        const o={title,desc:val(el,'tk-desc'),cat:val(el,'tk-cat'),cp,proj,exec:val(el,'tk-exec'),kind:st.kind,date,needFile:$('#tk-file',el).checked};
        if(t){const was=t.cp?'По контрагенту':'Общая',now=cp?'По контрагенту':'Общая';Object.assign(t,o);log('t',t.id,was!==now?`Вид задачи изменён: «${was}» → «${now}»`:'Задача изменена')}else{const n=Object.assign({id:'t'+(TID++),by:S.me,status:'К выполнению',file:null,reason:'',created:TODAY,doneAt:null,comments:[]},o);born(n);TASKS.push(n);log('t',n.id,'Задача поставлена')}
        m.close();refreshAll();toast(t?'Задача сохранена':`Задача поставлена: ${empName(o.exec)}`,'task')}}}}});
}

