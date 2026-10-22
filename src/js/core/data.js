'use strict';
// Загрузка данных: demoDB.json, TemDB.json, refDB.json (папка data или встроенная копия), даты и деньги
/* ═════════════ Данные прототипа: demoDB.json, TemDB.json, refDB.json ═════════════ */
/* Прототип — каркас: ни одной записи данных в коде. На GitHub Pages файлы читаются из папки data,
   в артефакте и при открытии с диска — из копии, которую сборка встраивает в страницу (блоки db-*). */
const DB_VER=1,DB_KEY='bu.temdb';
const DB_FILES={demo:'demoDB.json',empty:'TemDB.json',ref:'refDB.json',gked:'gkedDB.json'};
const DB_ORG_KEYS=['organization','roles','employees','contractors','reports','moneyOps','history','tasks','feePayments','services','projects','files','indicators','indicatorValues','indicatorMonths','indicatorHistory','indicatorImports','kbProgress','newsRead','platformOrgs','platformUsers','dictRequests','telegramLog'];
const DB_REF_KEYS=['dictionaries','taxes','enRates','propertyRates','bizSize','notes','reportTypes','singleTaxRates','taxRates','defaultRates','phoneCodes','holidays','workingSaturdays','statuses','statusNames','roleTemplates','messageTemplates','localization','kbGroups','kbSteps','kbLevels','kbArticles','news','dictHistory','dictLoads','calendarAudit','permissions','kbUi','kbShows','onboarding'];
const DB_OBJ=new Set(['notes','organization','kbProgress','newsRead','dictionaries','taxRates','defaultRates','holidays','statuses','statusNames','messageTemplates','kbLevels','calendarAudit','kbUi','onboarding']);
const DB_T={organization:'Организация',roles:'Роли',employees:'Сотрудники',contractors:'Контрагенты',reports:'Отчёты',moneyOps:'Поступления и оплаты',history:'История',tasks:'Задачи',feePayments:'Оплаты за обслуживание',services:'Разовые услуги',projects:'Проекты',files:'Файлы',indicators:'Показатели',indicatorValues:'Значения показателей',indicatorMonths:'Статусы месяцев показателей',indicatorHistory:'История показателей',indicatorImports:'Загрузки показателей из Excel',kbProgress:'Прогресс в Базе знаний',newsRead:'Прочитанные новости',platformOrgs:'Организации платформы',platformUsers:'Учётные записи',dictRequests:'Запросы на справочники',telegramLog:'Журнал Telegram'};
function dbRead(name,id){
  if(/^https?:/.test(location.protocol))try{const x=new XMLHttpRequest();x.open('GET','data/'+name+'?v='+Date.now(),false);x.send();
    if(x.status===200){const v=JSON.parse(x.responseText);if(v&&v.meta&&v.meta.file===name)return {db:v,from:'папка data'}}}catch(e){}
  const el=document.getElementById(id);if(el)try{return {db:JSON.parse(el.textContent),from:'встроенная копия'}}catch(e){}
  return {db:{meta:{file:name}},from:'нет файла'}}
const DBSRC={demo:dbRead(DB_FILES.demo,'db-demo'),empty:dbRead(DB_FILES.empty,'db-tem'),ref:dbRead(DB_FILES.ref,'db-ref'),gked:dbRead(DB_FILES.gked,'db-gked')};
// Поле «Виды деятельности (ГКЭД)» появилось в v37: у справочников, сохранённых в браузере раньше, его берём из refDB.json
const DB_GK_REF=[['regimes',r=>r.dictionaries.regimes.items,x=>x.code||x.name],['benefits',r=>r.dictionaries.benefits.items,x=>x.code||x.name],['enRates',r=>r.enRates,x=>x.code],['reportTypes',r=>r.reportTypes,x=>x.id]];
const DB_TXT_REF=[[r=>r.taxes,x=>x.code,['guide']],[r=>r.enRates,x=>x.code,['explain']],[r=>r.dictionaries.forms.items,x=>x.code||x.name,['note']],[r=>r.dictionaries.organs.items,x=>x.code||x.name,['note']],[r=>r.dictionaries.regimes.items,x=>x.code||x.name,['acc']]];
let DATA_MODE=store.get('data','demo'),DBMISS=[];
// Недостающие разделы (старый или чужой файл) берутся из пустого шаблона и refDB.json — прототип не ломается, а показывает, чего не хватило
function dbFill(db){const miss=[],e=DBSRC.empty.db,r=DBSRC.ref.db;db.meta=db.meta||{};
  DB_ORG_KEYS.forEach(k=>{if(db[k]==null){miss.push(DB_T[k]||k);db[k]=structuredClone(e[k]!=null?e[k]:DB_OBJ.has(k)?{}:[])}});
  const hadRef=!!db.ref;db.ref=db.ref||{};
  DB_REF_KEYS.forEach(k=>{if(db.ref[k]==null){if(hadRef)miss.push('справочник '+k);db.ref[k]=structuredClone(r[k]!=null?r[k]:DB_OBJ.has(k)?{}:[])}});
  // Справочник ГКЭД — отдельный файл gkedDB.json; правки администратора платформы хранятся в TemDB (ref.gked)
  if(db.ref.gked==null)db.ref.gked=structuredClone(DBSRC.gked.db.items||[]);
  DB_GK_REF.forEach(([k,get,key])=>{let a,b;try{a=get(db.ref);b=get(r)}catch(e){return}if(!a||!b)return;const m=Object.fromEntries(b.map(x=>[key(x),x]));a.forEach(x=>{if(!('gked' in x)&&m[key(x)]&&m[key(x)].gked)x.gked=structuredClone(m[key(x)].gked)})});
  // Пояснения справочников (v43) — содержимое платформы: у справочников, сохранённых в браузере раньше, берутся из refDB.json
  DB_TXT_REF.forEach(([get,key,fs])=>{let a,b;try{a=get(db.ref);b=get(r)}catch(e){return}if(!a||!b)return;const m=Object.fromEntries(b.map(x=>[key(x),x]));a.forEach(x=>{const f=m[key(x)];if(f)fs.forEach(k=>{if(!(k in x)&&f[k]!=null)x[k]=structuredClone(f[k])})})});
  // Тарифы Соцфонда (v45): у данных, сохранённых в браузере раньше, ПЛТ-01, вид отчёта soc и орган ОРГ-02 обновляются из refDB.json, пока администратор их не менял
  {const pick=(a,k,v)=>(a||[]).find(x=>x[k]===v);const tx=pick(db.ref.taxes,'code','ПЛТ-01'),ftx=pick(r.taxes,'code','ПЛТ-01');
    if(tx&&ftx&&ftx.guide&&ftx.guide.tariffs&&!(tx.guide&&tx.guide.tariffs)&&tx._ua<='2026-10-18 09:54')['base','rates','art','verify','guide','_ua'].forEach(k=>{if(ftx[k]!==undefined)tx[k]=structuredClone(ftx[k])});
    const rt=pick(db.ref.reportTypes,'id','soc'),frt=pick(r.reportTypes,'id','soc');if(rt&&frt&&/27,25 % от фонда оплаты \(17,25/.test(rt.desc||''))['desc','verifyNote'].forEach(k=>rt[k]=frt[k]);
    const og=db.ref.dictionaries&&pick(db.ref.dictionaries.organs.items,'code','ОРГ-02'),fog=r.dictionaries&&pick(r.dictionaries.organs.items,'code','ОРГ-02');if(og&&fog&&fog.contacts&&!og.contacts&&og._ua<='2026-10-18 09:54')['note','contacts','hours','site','contactsNote'].forEach(k=>{if(fog[k]!==undefined)og[k]=structuredClone(fog[k])})}
  ['dictGroups','statusNotes','templateNotes'].forEach(k=>{if(db.ref[k]==null)db.ref[k]=structuredClone(r[k]||(k==='dictGroups'?[]:{}))});
  {const cs=db.ref.dictionaries&&db.ref.dictionaries.cats;const o=cs&&cs.items.find(x=>x.name==='Другое'&&x.code==='КАТ-005');if(o&&cs.items.some(x=>x!==o&&x.code==='КАТ-005'))o.code='КАТ-007'}
  // Подтверждение задач и права по модулям (v47): у данных, сохранённых в браузере раньше, — новые статусы задач, право «Подтверждать задачи» у главного бухгалтера, шаг урока, справочник «Права ролей» и тексты статей из refDB.json
  if(!db.meta.v47){db.meta.v47=1;const ts=db.ref.statuses&&db.ref.statuses.task;if(ts)Object.entries(r.statuses.task).forEach(([k,v])=>{if(!ts[k])ts[k]=structuredClone(v)});
    (db.roles||[]).forEach(x=>{if((x.id==='chief'||x.id==='owner')&&!x.perms.includes('tasksConfirm'))x.perms.push('tasksConfirm')});(db.ref.roleTemplates||[]).forEach(x=>{if(x.id==='chief'&&!x.perms.includes('tasksConfirm'))x.perms.push('tasksConfirm')});
    const ks=db.ref.kbSteps||[];const nk=(r.kbSteps||[]).find(x=>x.id==='tconf');if(nk&&!ks.some(x=>x.id==='tconf')){const td=ks.find(x=>x.id==='tdone');ks.forEach(x=>{if(td&&x.ord>td.ord)x.ord++});ks.splice(td?ks.indexOf(td)+1:ks.length,0,Object.assign(structuredClone(nk),{ord:td?td.ord+1:nk.ord}))}
    ['roles'].forEach(id=>{const a=ks.find(x=>x.id===id),b=(r.kbSteps||[]).find(x=>x.id===id);if(a&&b)a.w=b.w});
    ['a3','a13'].forEach(id=>{const a=(db.ref.kbArticles||[]).find(x=>x.id===id),b=(r.kbArticles||[]).find(x=>x.id===id);if(a&&b)a.html=b.html});
    const g=(db.ref.dictGroups||[]).find(x=>x.group==='Работа системы'),fg=(r.dictGroups||[]).find(x=>x.group==='Работа системы');const ft=fg&&fg.tabs.find(x=>x.tab==='Права ролей');if(g&&ft&&!g.tabs.some(x=>x.tab==='Права ролей'))g.tabs.push(structuredClone(ft))}
  // Права по действиям и область (37 прав вместо 20): у данных, сохранённых в браузере раньше, — новый справочник «Права ролей», роли сохраняют прежние возможности:
  // просмотр всех модулей, «Создавать…» → ещё загрузка списком, приостановка, архив; «Назначать отчёты» → ещё «Изменять срок»; ввод показателей, загрузка файлов и выгрузка — всем, как было
  if(!db.meta.perms2){db.meta.perms2=1;if(r.permissions)db.ref.permissions=structuredClone(r.permissions);
    const sg=['cps','reports','fin','projects','kpi','files'],mig=x=>{if(!x||x.scope)return;const p=new Set(x.perms||[]);
      ['cpView','repView','finView','projView','kpiView','filesView','kpiEdit','filesUpload','export'].forEach(k=>p.add(k));
      if(p.has('createCp'))['cpImport','cpPause','cpArchive'].forEach(k=>p.add(k));if(p.has('assign'))p.add('repDue');if(p.has('indSetup'))p.add('kpiImport');if(p.has('staff'))['staffView','kbLevels'].forEach(k=>p.add(k));
      x.perms=[...p];x.scope=Object.fromEntries(sg.map(g=>[g,p.has('viewAll')?'all':'own']))};
    (db.roles||[]).forEach(mig);(db.ref.roleTemplates||[]).forEach(mig);const ow=(db.roles||[]).find(x=>x.id==='owner');if(ow)ow.perms=(r.permissions||[]).map(x=>x.id);
    // Шаги «Кому вести» и «Ввод из Excel», права шагов и статьи «Роли и права», «Показатели контрагентов» — из refDB
    const ks=db.ref.kbSteps||[],rk=r.kbSteps||[];['kwho','kxls'].forEach(id=>{const nk=rk.find(x=>x.id===id);if(!nk||ks.some(x=>x.id===id))return;const prev=rk[rk.indexOf(nk)-1];const a=prev&&ks.find(x=>x.id===prev.id);ks.forEach(x=>{if(a&&x.ord>a.ord)x.ord++});ks.splice(a?ks.indexOf(a)+1:ks.length,0,Object.assign(structuredClone(nk),{ord:a?a.ord+1:nk.ord}))});
    ['import','xls','kval','roles'].forEach(id=>{const a=ks.find(x=>x.id===id),b=rk.find(x=>x.id===id);if(a&&b){a.perm=b.perm;a.w=b.w}});
    ['a3','a_kpi'].forEach(id=>{const a=(db.ref.kbArticles||[]).find(x=>x.id===id),b=(r.kbArticles||[]).find(x=>x.id===id);if(a&&b)a.html=b.html});
    const nw=db.ref.news||[];(r.news||[]).forEach(x=>{const i=nw.findIndex(y=>y.id===x.id);if(i<0)nw.push(structuredClone(x));else if(nw[i].status==='Черновик'&&nw[i]._cb==='admin'&&nw[i]._ua<=x._ua)nw[i]=structuredClone(x)})}
  // Обучение и первый запуск (v49): шаги уроков — новые названия, права и признаки из refDB; статьи — пересобранные под текущий прототип, если администратор их не менял;
  // пустая организация, в которой ещё ничего не сделано, получает основной набор модулей и приветствие с опросником, как новая
  if(!db.meta.v49){db.meta.v49=1;const ks=db.ref.kbSteps||[],rk=r.kbSteps||[];
    rk.forEach(b=>{const a=ks.find(x=>x.id===b.id);if(!a)return;['t','w','perm','art','learn'].forEach(k=>{if(b[k]!==undefined)a[k]=b[k]});delete a.mob});
    (r.kbGroups||[]).forEach(b=>{const a=(db.ref.kbGroups||[]).find(x=>x.id===b.id);if(a&&b.scr)a.scr=b.scr});
    const arts=db.ref.kbArticles||[];(r.kbArticles||[]).forEach(b=>{const i=arts.findIndex(x=>x.id===b.id);if(i<0)arts.push(structuredClone(b));else if(!arts[i]._ub||arts[i]._ub==='system')arts[i]=structuredClone(b)});
    const nw=db.ref.news||[];(r.news||[]).forEach(x=>{const i=nw.findIndex(y=>y.id===x.id);if(i<0)nw.push(structuredClone(x));else if(nw[i].status==='Черновик'&&nw[i]._cb==='admin')nw[i]=structuredClone(x)});
    const o=db.organization;if(db.meta.mode==='empty'&&o&&!o.onboard&&!(db.contractors||[]).length&&!(db.history||[]).some(h=>h.who!=='system')){o.onboard={state:'new'};Object.assign(o.features,(r.onboarding||{}).base||{})}}
  // Сверка с прототипом (v51): статьи, облачка показов и подсказки «Базы знаний» с новыми названиями прав и кнопок, шаблон Telegram «Должники по обслуживанию», описания прав «Просматривать финансовые операции» и «Просматривать отчёты» —
  // у данных, сохранённых в браузере раньше, берутся из refDB, если администратор их не менял (статья без его правки, облачко со старым текстом, подсказки, которых ещё не было, в том числе подсказки админки)
  if(!db.meta.v51){db.meta.v51=1;const arts=db.ref.kbArticles||[];
    ['a_kbadm','a14','a12','a7','a_kb','a3','a15'].forEach(id=>{const b=(r.kbArticles||[]).find(x=>x.id===id),i=arts.findIndex(x=>x.id===id);if(b&&i>=0&&(!arts[i]._ub||arts[i]._ub==='system'))arts[i]=structuredClone(b)});
    const old=['Нужно право «Выгрузка в Excel».','Нужно право «Тариф и оплата обслуживания».','прежние тарифы остаются в журнале.'];
    ['sh-xls','sh-feepay','sh-tariff'].forEach(id=>{const a=(db.ref.kbShows||[]).find(x=>x.id===id),b=(r.kbShows||[]).find(x=>x.id===id);if(!a||!b)return;
      b.items.forEach(bi=>{const ai=bi.s&&(a.items||[]).find(x=>x.s===bi.s);if(ai&&old.some(o=>(ai.x||'').includes(o))){ai.t=bi.t;ai.x=bi.x}})});
    const tc=(db.ref.kbShows||[]).find(x=>x.id==='sh-typecfg'),tcb=(r.kbShows||[]).find(x=>x.id==='sh-typecfg');if(tc&&tcb){const i=(tc.items||[]).findIndex(x=>x.t==='Подключённый вид отчёта');if(i>=0)tc.items[i]=structuredClone(tcb.items[0])}
    // «Создать уточнённый», «Отметить оплаченным» и «Принять деньги» есть не у всех отчётов: показ открывает меню и карточку отчёта, у которого это действие есть
    ['sh-ver','sh-pay','sh-in'].forEach(id=>{const a=(db.ref.kbShows||[]).find(x=>x.id===id),b=(r.kbShows||[]).find(x=>x.id===id);if(!a||!b||!a.items||!a.items.length)return;
      if(JSON.stringify(a.items[0].sub)==='["menu"]'){a.items[0].sub=structuredClone(b.items[0].sub);if(a.items[1]&&b.items[1]&&JSON.stringify(a.items[1].pre)==='["row"]')a.items[1].pre=structuredClone(b.items[1].pre);if(id==='sh-ver'&&a.scr==='reports.all')a.scr=b.scr}});
    const u=db.ref.kbUi,ru=r.kbUi;if(u&&ru){['fields','forms','boxes','rows','acts','tabs','add','addItems','plates','plateMode','buttons'].forEach(k=>{u[k]=u[k]||{};Object.entries(ru[k]||{}).forEach(([n,v])=>{if(!(n in u[k]))u[k][n]=structuredClone(v)})});
      if(u.ui&&ru.ui){if(/^Форма новой записи/.test(u.ui.form||''))u.ui.form=ru.ui.form;Object.entries(ru.ui).forEach(([n,v])=>{if(!(n in u.ui))u.ui[n]=v})}const tf=u.fields['Тип обслуживания'];if(tf&&/«Постоянный»/.test(tf.x||''))tf.x=ru.fields['Тип обслуживания'].x;
      if(u.acts['Заблокировать']==='Запрещает вход; данные сотрудника сохраняются.')u.acts['Заблокировать']=ru.acts['Заблокировать']}
    [['finView',/«Финансы»/],['repView',/вкладку «Отчёты» в/]].forEach(([id,re])=>{const a=(db.ref.permissions||[]).find(x=>x.id===id),b=(r.permissions||[]).find(x=>x.id===id);if(a&&b&&re.test(a.desc||''))a.desc=b.desc});
    ['messageTemplates','templateNotes'].forEach(k=>{const a=db.ref[k];if(a&&r[k])Object.entries(r[k]).forEach(([n,v])=>{if(a[n]==null)a[n]=v})})}
  if(db.organization&&db.organization.taskConfirm==null)db.organization.taskConfirm=true;
  if(!db.kbProgress.u)db.kbProgress.u={};
  return {db,miss}}
function dbFresh(mode){const db=structuredClone(mode==='empty'?DBSRC.empty.db:DBSRC.demo.db);delete db.ref;
  db.meta={file:'TemDB.json',version:DB_VER,mode,from:DB_FILES[mode==='empty'?'empty':'demo'],created:TODAY+' '+bishkekNow().hm};
  const f=dbFill(db).db;if(mode==='empty')f.organization.created=TODAY;return f}
function dbBoot(){let s=null;try{s=JSON.parse(localStorage.getItem(DB_KEY)||'null')}catch(e){}
  if(s&&s.meta&&s.meta.file==='TemDB.json'){const f=dbFill(s);DBMISS=f.miss;return f.db}
  return dbFresh(DATA_MODE)}
const DB=dbBoot();DATA_MODE=DB.meta.mode||DATA_MODE;
const dbSets=o=>{const x={};Object.entries(o||{}).forEach(([k,v])=>x[k]=new Set(v));return x};
const nowStamp=()=>TODAY+' '+bishkekNow().hm;
const D=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))};
const toIso=dt=>dt.toISOString().slice(0,10);
const mkDate=(y,m,d)=>toIso(new Date(Date.UTC(y,m-1,d)));
const addDays=(s,n)=>{const d=D(s);d.setUTCDate(d.getUTCDate()+n);return toIso(d)};
const diffDays=(a,b)=>Math.round((D(a)-D(b))/864e5);
const fmtD=s=>s?`${s.slice(8,10)}.${s.slice(5,7)}.${s.slice(0,4)}`:'';
const minIso=(a,b)=>a<b?a:b, maxIso=(a,b)=>a>b?a:b;
const MONTHS=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const MONTHS_G=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DOW=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const DOW_S=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const ym=s=>s.slice(0,7);
const ymG=k=>{const[y,m]=k.split('-').map(Number);return `${MONTHS_G[m-1]} ${y}`};
const ymLabel=k=>{const[y,m]=k.split('-').map(Number);return `${MONTHS[m-1]} ${y}`};
const addMonths=(k,n)=>{const[y,m]=k.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+n,1));return toIso(d).slice(0,7)};
const lastDay=k=>{const[y,m]=k.split('-').map(Number);return mkDate(y,m+1,0)};
const isWeekend=()=>{const d=D(TODAY).getUTCDay();return d===0||d===6};
function weekRange(){const wd=(D(TODAY).getUTCDay()+6)%7;let mon=addDays(TODAY,-wd);if(isWeekend())mon=addDays(mon,7);return [mon,addDays(mon,6)]}

/* Money: «1 250,50», only soms */
function fmtM(n,dec=true){if(n==null||n===''||isNaN(n))return '';const neg=n<0;const v=Math.abs(+n);const[i,f]=v.toFixed(dec?2:0).split('.');return (neg?'−':'')+i.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(f?','+f:'')}
const som=n=>fmtM(n,(Math.round(n*100)%100)!==0)+' сом';
const parseNum=s=>{if(s==null)return NaN;const t=String(s).replace(/[\s ]/g,'').replace(',','.');return t===''?NaN:+t};

