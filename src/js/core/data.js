'use strict';
// Загрузка данных: demoDB.json, TemDB.json, refDB.json (папка data или встроенная копия), даты и деньги
/* ═════════════ Данные прототипа: demoDB.json, TemDB.json, refDB.json ═════════════ */
/* Прототип — каркас: ни одной записи данных в коде. На GitHub Pages файлы читаются из папки data,
   в артефакте и при открытии с диска — из копии, которую сборка встраивает в страницу (блоки db-*). */
const DB_VER=1,DB_KEY='bu.temdb';
const DB_FILES={demo:'demoDB.json',empty:'TemDB.json',ref:'refDB.json',gked:'gkedDB.json'};
const DB_ORG_KEYS=['organization','roles','employees','contractors','reports','moneyOps','history','tasks','feePayments','services','projects','files','indicators','indicatorValues','indicatorMonths','indicatorHistory','kbProgress','newsRead','platformOrgs','platformUsers','dictRequests','telegramLog'];
const DB_REF_KEYS=['dictionaries','taxes','enRates','propertyRates','bizSize','notes','reportTypes','singleTaxRates','taxRates','defaultRates','phoneCodes','holidays','workingSaturdays','statuses','statusNames','roleTemplates','messageTemplates','localization','kbGroups','kbSteps','kbLevels','kbArticles','news','dictHistory','dictLoads','calendarAudit'];
const DB_OBJ=new Set(['notes','organization','kbProgress','newsRead','dictionaries','taxRates','defaultRates','holidays','statuses','statusNames','messageTemplates','kbLevels','calendarAudit']);
const DB_T={organization:'Организация',roles:'Роли',employees:'Сотрудники',contractors:'Контрагенты',reports:'Отчёты',moneyOps:'Поступления и оплаты',history:'История',tasks:'Задачи',feePayments:'Оплаты за обслуживание',services:'Разовые услуги',projects:'Проекты',files:'Файлы',indicators:'Показатели',indicatorValues:'Значения показателей',indicatorMonths:'Статусы месяцев показателей',indicatorHistory:'История показателей',kbProgress:'Прогресс в Базе знаний',newsRead:'Прочитанные новости',platformOrgs:'Организации платформы',platformUsers:'Учётные записи',dictRequests:'Запросы на справочники',telegramLog:'Журнал Telegram'};
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
  ['dictGroups','statusNotes','templateNotes'].forEach(k=>{if(db.ref[k]==null)db.ref[k]=structuredClone(r[k]||(k==='dictGroups'?[]:{}))});
  {const cs=db.ref.dictionaries&&db.ref.dictionaries.cats;const o=cs&&cs.items.find(x=>x.name==='Другое'&&x.code==='КАТ-005');if(o&&cs.items.some(x=>x!==o&&x.code==='КАТ-005'))o.code='КАТ-007'}
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

