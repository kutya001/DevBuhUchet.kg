'use strict';
// Пустые состояния и первый вход
/* ═════════════ Пустые состояния и первый вход ═════════════ */
// First-run empty states per module (ТЗ «Пустые состояния и первый вход»); shown only when the module has no data at all.
function firstEmpty(){const needCp=f=>()=>CPS.length?f():(toast('Сначала добавьте контрагента','info'),go('cps'));
  const F={
  cps:()=>!CPS.length&&{icon:'building',title:'Здесь будут ваши клиенты',text:'Добавьте контрагентов по одному или загрузите сразу списком из Excel.',btns:[can('createCp')&&['Добавить контрагента','plus',addCpDlg,1],can('cpImport')&&['Загрузить из Excel','paste',importDlg]]},
  reports:()=>!REPORTS.length&&{icon:'file',title:'Отчёты появятся, когда вы назначите виды отчётов контрагентам',text:'Отчёты создаются сами по назначенным видам и срокам, вручную их заводить не нужно.',btns:[['Перейти к контрагентам','building',()=>go('cps'),1]]},
  tasks:()=>!allTasks().length&&{icon:'task',title:'Регулярные задачи создадутся сами по отчётам; ручную задачу можно поставить сейчас',btns:[can('tasksCreate')&&['Добавить','plus',()=>taskDlg(),1]]},
  fin:()=>!OPS.length&&!FEEPAYS.length&&!SERVICES.length&&{icon:'coins',title:'Поступления и оплаты налогов появятся после первого приёма денег',btns:[taxVis()&&['Принять деньги','wallet',needCp(()=>inDlg()),1]]},
  projects:()=>!PROJECTS.length&&{icon:'briefcase',title:'Проекты — разовые работы для контрагента за отдельную плату',text:'Здесь будут сроки, ответственные, работы и оплаты по каждому проекту.',btns:[can('projects')&&['Добавить','plus',needCp(()=>projectDlg()),1]]},
  kpi:()=>!visCps().length&&{icon:'gauge',title:'Показатели вносятся по контрагентам',text:'Добавьте первого контрагента — и здесь можно будет вести его выручку, численность и другие показатели по месяцам.',btns:[['Перейти к контрагентам','building',()=>go('cps'),1]]},
  files:()=>!FILES.length&&{icon:'folder',title:'Здесь будут все файлы организации',text:'Отчёты, квитанции и документы, прикреплённые в любом модуле, собираются сюда сами.',btns:[['Добавить','plus',()=>uploadDlg(),1]]}};
  const f=F[S.mod];return f?f()||null:null}
function feHtml(e){return `<div class="state fe">${ic(e.icon,'lg')}<b>${esc(e.title)}</b>${e.text?`<span>${esc(e.text)}</span>`:''}<div class="row" style="justify-content:center">${e.btns.filter(Boolean).map((b,i)=>`<button class="btn ${b[3]?'cta':''}" data-a="fe" data-i="${i}">${ic(b[1])}${esc(b[0])}</button>`).join('')}</div></div>`}
function connectTypesDlg(){const st=new Set(RT.filter(t=>t.active&&t.common).map(t=>t.id));
  openModal({form:true,size:'mid',render:m=>({title:'Подключить виды отчётов',sub:'Каталог платформы. Подключите то, что сдают ваши контрагенты; позже можно поменять.',
    body:`<div class="fl-list" style="max-height:none">${RT.filter(t=>t.active).map(t=>`<label><input type="checkbox" data-ct="${t.id}" ${st.has(t.id)?'checked':''}><span><b>${esc(t.name)}</b> ${actPill(t.act,1)}<span class="sub" style="display:block;font-size:11.5px;color:var(--faint)">${esc(t.organ)} · ${esc(PER_LABEL[t.per]||'')}${t.act!=='sub'?' · уплачивается: '+esc(paysTxt(t)):''}</span></span></label>`).join('')}</div>`
    +`<div class="form" style="margin-top:10px">${fld('Напоминать до срока, за дней',inp('ct-days',(st.days||ORG.remind).join(', '),'inputmode="numeric" placeholder="7, 3"'),{id:'ct-days',full:true,hint:'Для выбранных видов; потом у каждого вида дни меняются отдельно. В день срока напоминание приходит всегда.'})}</div>`,
    foot:`<span class="muted">Выбрано: ${st.size}</span><div class="grow"></div><button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="ct-ok" ${st.size?'':'disabled'}>Подключить</button>`,
    mount(el){$$('[data-ct]',el).forEach(x=>x.onchange=()=>{x.checked?st.add(x.dataset.ct):st.delete(x.dataset.ct);m.draw()});
      $('#ct-days',el).oninput=e=>{st.days=e.target.value.split(/[,;\s]+/).map(Number).filter(n=>n>0&&n<=60)};
      $('#ct-ok',el).onclick=()=>{const days=[...new Set((st.days&&st.days.length?st.days:ORG.remind))].sort((a,b)=>b-a);st.forEach(id=>{ORG.types[id]=ORG.types[id]||born({days:[...days],needFile:false,needReceipt:false});ORG.types[id].days=[...days];ORG.types[id].on=true;touch(ORG.types[id]);log('org',id,`Подключён вид отчёта «${T[id].name}»`)});m.close();toast(`Подключено видов отчётов: ${st.size}`);refreshAll()}}})})}
// Small ⓘ next to complex fields and buttons.
const tipI=t=>`<button type="button" class="icon-btn sm tipi" data-tip="${esc(t)}" aria-label="Пояснение">${ic('info','sm')}</button>`;
document.addEventListener('click',e=>{const b=e.target.closest('.tipi');if(!b)return;e.preventDefault();e.stopPropagation();openPop(b,`<div style="padding:6px 8px;font-size:13px;line-height:1.5;max-width:300px">${esc(b.dataset.tip)}</div>`)},true);

