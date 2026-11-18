'use strict';
// Лендинг buhuchet.kg для гостей (ТЗ «Лендинг — buhuchet.kg для гостей», решение заказчика 01.11.2026)
/* ═════════════ Лендинг ═════════════ */
// В прототипе открывается поверх программы по адресу #landing и ссылкой «О платформе» на экране входа. Все тексты — группа «Лендинг» в «Локализации» (Админка)
const LAND={open:false,back:'',title0:'',test:false,netErr:false,sent:null,sentLead:null,menu:false,shot:0,io:null,vis:{},rv:null,ro:null,tm:[],raf:0,braf:0,more:{},intro:false};
const LT=(k,v)=>{const x=L10N.find(y=>y.key===k);let t=x?x.ru:'';if(v)Object.entries(v).forEach(([a,b])=>{t=t.split('{'+a+'}').join(b)});return t};
const LE=(k,v)=>esc(LT(k,v));
const landRM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
// #landing/lead — сразу к форме заявки (так «Оставить заявку» из демо-организации открывает лендинг). В демо-версии для сайта лендинга нет: переход на страницу сайта
function landRoute(){const h=location.hash;if(h!=='#landing'&&h!=='#landing/lead')return false;if(DEMO.build){location.replace(BU_DEMO.site);return true}
  if(DEMO.on)demoOff();landShow();if(h==='#landing/lead'){history.replaceState(history.state,'','#landing');setTimeout(()=>landGo('lead',!LAND.sent),60)}return true}
function landShow(){let el=$('#land');if(!el){el=document.createElement('div');el.id='land';el.className='land';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Лендинг buhuchet.kg');document.body.append(el)}
  const fresh=!LAND.open;if(fresh){LAND.back=S.mod?'#'+S.mod+(S.tab?'.'+S.tab:''):'#home';LAND.title0=document.title;LAND.sent=null;LAND.shot=0;LAND.more={}}
  LAND.open=true;el.hidden=false;document.body.classList.add('land-on');document.title=LT('land.title');if(fresh)buIntro();landDraw()}
// Тема лендинга — та же, что в программе: по умолчанию светлая, кнопка меняет её волной и запоминает (setTheme в ui/shell.js)
function landThemeToggle(b){setTheme(effTheme()==='dark'?'light':'dark',b)}
function landHide(){const el=$('#land');if(el)el.hidden=true;document.body.classList.remove('land-on');if(LAND.open)document.title=LAND.title0;LAND.open=false;LAND.menu=false;if(LAND.io){LAND.io.disconnect();LAND.io=null}landFxStop()}
function landClose(){const b=LAND.back||'#home';landHide();if(location.hash!==b)location.hash=b;else route()}
// «Войти» открывает страницу входа; после входа — рабочая страница
function landLogin(){const b=LAND.back||'#home';landHide();history.replaceState(history.state,'',b);showLogin()}
// Числа полосы цифр — из справочников платформы, а не вручную
const landNums=()=>({types:RT.filter(t=>t.active!==false).length,regimes:DICT.regimes.items.filter(x=>x.active).length});
function landContacts(){const ph=LT('land.c.phone').trim(),tg=LT('land.c.tg').trim(),em=LT('land.c.email').trim();const out=[];
  // Пустой контакт на странице не показывается
  if(ph)out.push(`<a href="tel:${esc(ph.replace(/[^\d+]/g,''))}">${ic('phone')}<span>${esc(ph)}</span></a>`);
  if(tg)out.push(`<a href="https://t.me/${esc(tg.replace(/^@/,''))}" target="_blank" rel="noopener">${ic('tg')}<span>${esc(tg)}</span></a>`);
  if(em)out.push(`<a href="mailto:${esc(em)}">${ic('mail')}<span>${esc(em)}</span></a>`);return out}

/* Картинки — экраны демо-организации, нарисованные по demoDB.json (выдуманные контрагенты и суммы). В рабочей версии — сжатые снимки экрана */
function landDemo(){const d=DBSRC.demo.db||{},cps=Object.fromEntries((d.contractors||[]).map(c=>[c.id,c])),emp=Object.fromEntries((d.employees||[]).map(e=>[e.id,e]));
  const reps=(d.reports||[]).filter(r=>r.status!=='Не требуется'&&!r.superseded&&cps[r.cp]&&T[r.t]);const open=reps.filter(r=>OPEN.has(r.status)).sort((a,b)=>a.due<b.due?-1:1);
  // Картинка — у сроков рядом с сегодняшним днём: просрочка за последний месяц, ближайшие сроки, сдано за месяц
  const wk=addDays(TODAY,7),m0=addDays(TODAY,-30),late=open.filter(r=>r.due<TODAY&&r.due>=m0),next=open.filter(r=>r.due>=TODAY);
  return {cps,emp,reps,rows:[...late.slice(-2),...next].slice(0,6),over:late.length,week:next.filter(r=>r.due<=wk).length,done:reps.filter(r=>r.status==='Сдан'&&(r.subDate||'')>=m0&&(r.subDate||'')<=TODAY).length}}
const lshMods=()=>['home','cps','reports','fin','tasks','staff'].map(id=>BIZ.find(b=>b.id===id)).filter(Boolean);
function lshTop(url){return `<div class="lsh-top"><i></i><i></i><i></i><span>${esc(url)}</span></div>`}
function lshPlates(D,phone){return `<div class="lsh-pl"><div class="r"><b>${D.over}</b><small>Просрочено</small></div><div class="y"><b>${D.week}</b><small>На этой неделе</small></div>${phone?'':`<div class="g"><b>${D.done}</b><small>Сдано за 30 дней</small></div>`}</div>`}
function lshDesk(D,hero){const rows=D.rows;
  return `<div class="lsh lsh-desk">${lshTop('buhuchet.kg/#reports')}<div class="lsh-body"><div class="lsh-side">${logoSvg()}${lshMods().map(m=>`<span class="${m.id==='reports'?'on':''}">${esc(m.title)}</span>`).join('')}</div>
    <div class="lsh-m"><div class="lsh-h">${esc((BIZ.find(b=>b.id==='reports')||{}).title||'')}</div><div class="lsh-tb"><span class="on">На неделе</span><span>Просрочено</span><span>Ожидают подтверждения</span><span>Все отчёты</span></div>${lshPlates(D)}
    <table class="lsh-t"><thead><tr><th style="width:34%">Контрагент</th><th style="width:22%">Отчёт</th><th style="width:15%">Срок</th><th style="width:16%">Статус</th>${hero?'':'<th class="num c-sum" style="width:13%">К уплате</th>'}</tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(D.cps[r.cp].name)}</td><td>${esc(T[r.t].short)}</td><td class="${r.due<TODAY?'red':''}">${fmtD(r.due)}</td><td>${pill(r.status,ST)}</td>${hero?'':`<td class="num c-sum">${r.sum!=null?fmtM(r.sum,false):'—'}</td>`}</tr>`).join('')}</tbody></table></div></div></div>`}
function lshPhone(D){return `<div class="lsh lsh-ph"><div class="lsh-pt"><i></i></div><div class="lsh-m"><div class="lsh-h">Отчёты</div>${lshPlates(D,true)}${D.rows.slice(0,4).map(r=>`<div class="lsh-cd"><b>${esc(D.cps[r.cp].name)}</b><span><span>${esc(T[r.t].short)}</span>${pill(r.status,ST)}</span><span><span class="${r.due<TODAY?'red':''}">до ${fmtD(r.due)}</span><span>${r.sum!=null?fmtM(r.sum,false):''}</span></span></div>`).join('')}</div><div class="lsh-nav">${['Главная','Отчёты','Задачи','Ещё'].map((x,i)=>`<span class="${i===1?'on':''}">${x}</span>`).join('')}</div></div>`}
function lshCard(D){const c=D.cps[1]||Object.values(D.cps)[0];if(!c)return '';const rs=D.reps.filter(r=>r.cp===c.id).sort((a,b)=>a.due<b.due?1:-1).slice(0,5),e=D.emp[c.resp];
  return `<div class="lsh lsh-desk">${lshTop('buhuchet.kg/#cps')}<div class="lsh-body"><div class="lsh-side">${logoSvg()}${lshMods().map(m=>`<span class="${m.id==='cps'?'on':''}">${esc(m.title)}</span>`).join('')}</div>
    <div class="lsh-m"><div class="lsh-h">${esc(c.name)} <span class="pill blue">${esc(c.regime)}</span></div><div class="lsh-tb"><span class="on">Основное</span><span>Отчёты к сдаче</span><span>Подбор отчётов</span><span>Деньги</span><span>Обслуживание</span></div>
    <div class="lsh-kv"><div><small>ИНН</small><b class="mono">${esc(c.inn)}</b></div><div><small>Ответственный</small><b>${esc(e?e.short:'—')}</b></div><div><small>Руководитель</small><b>${esc(c.head||'—')}</b></div><div><small>На обслуживании с</small><b>${c.start?fmtD(c.start):'—'}</b></div></div>
    <table class="lsh-t"><thead><tr><th style="width:34%">Отчёт</th><th style="width:20%">Период</th><th style="width:24%">Статус</th><th class="num c-sum" style="width:22%">К уплате</th></tr></thead><tbody>${rs.map(r=>`<tr><td>${esc(T[r.t].short)}</td><td>${esc(r.plabel||'')}</td><td>${pill(r.status,ST)}</td><td class="num c-sum">${r.sum!=null?fmtM(r.sum,false):'—'}</td></tr>`).join('')}</tbody></table></div></div></div>`}

// Снимки блока «Новое» (18.11.2026): колокольчик, окно просмотра файла, страница клиента на телефоне, сообщение бота — по demoDB.json, выдуманные данные
function lshBell(D){const r=D.rows.find(x=>x.due>=TODAY)||D.rows[0];if(!r)return '';const c=D.cps[r.cp],c2=Object.values(D.cps).find(x=>x!==c)||c,n=Math.max(1,diffDays(r.due,TODAY));
  const it=[['yellow','clock',`Через ${n} ${plural(n,'день','дня','дней')} срок`,`${T[r.t].short} · ${c.name}`,'09:00',1],['green','wallet','Клиент прислал чек',`${c2.name} · 12 400 сом`,'10:24',1],['blue','task','Новая задача','Сверка с банком · до пятницы','11:05',0]];
  return `<div class="lsh lsh-bell"><div class="lsh-bt"><span class="lsh-bs"></span><span class="lsh-bi">${ic('bell')}<i>2</i></span></div><div class="lsh-bp"><div class="lsh-bh"><b>Уведомления</b><span><em>Все</em>Непрочитанные</span></div>${it.map(([cl,i,t,s,tm,u])=>`<div class="lsh-bn${u?' u':''}"><span class="pl-dot ${cl}">${ic(i,'sm')}</span><span class="lsh-bx"><b>${t}</b><small>${esc(s)}</small></span><time>${tm}</time></div>`).join('')}</div></div>`}
function lshView(D){const r=D.reps.find(x=>x.sum>0&&x.payStatus==='Оплачено')||D.reps[0];if(!r)return '';const c=D.cps[r.cp];
  return `<div class="lsh lsh-view"><div class="lsh-vh">${ic('file','sm')}<b>Квитанция · ${esc(T[r.t].short)}${r.plabel?' за '+esc(r.plabel):''}.pdf</b><span class="lsh-vx">${ic('download','sm')}${ic('x','sm')}</span></div><div class="lsh-vb"><span class="lsh-va">${ic('left','sm')}</span><div class="lsh-pg"><i class="w60"></i><i class="w40"></i><i></i><i class="w80"></i><i></i><b class="lsh-stamp">Оплачено</b><i class="w50"></i><i class="w70"></i></div><span class="lsh-va">${ic('right','sm')}</span></div><div class="lsh-vl"><small>Прикреплён к</small><span>${ic('link','sm')}Отчёт · ${esc(c?c.name:'')}</span><span>${ic('link','sm')}Деньги · уплата налога</span></div></div>`}
function lshBot(D){const r=D.rows.find(x=>x.due>=TODAY)||D.rows[0];if(!r)return '';const n=Math.max(1,diffDays(r.due,TODAY)),c=D.cps[r.cp];
  return `<div class="lsh lsh-tg"><div class="lsh-tgh">${ic('tg','sm')}<b>Buhuchet.kg</b><small>бот</small></div><div class="lsh-tgb"><div class="lsh-msg"><b>Через ${n} ${plural(n,'день','дня','дней')} срок</b><span>${esc(T[r.t].short)}${r.plabel?' за '+esc(r.plabel):''}</span><span>${esc(c.name)}</span><span>до ${fmtD(r.due)}</span><i>09:00</i></div><div class="lsh-tgk"><span>Отметить сданным</span><span>Открыть отчёт</span></div></div></div>`}
function lshClient(D){const c=D.cps[1]||Object.values(D.cps)[0];if(!c)return '';const rs=D.reps.filter(r=>r.cp===c.id),done=rs.filter(r=>r.status==='Сдан').length,nx=rs.filter(r=>OPEN.has(r.status)&&r.due>=TODAY).sort((a,b)=>a.due<b.due?-1:1)[0];
  const need=rs.filter(r=>r.sum>0&&r.payStatus!=='Оплачено').reduce((a,r)=>a+r.sum,0);
  return `<div class="lsh lsh-ph lsh-cl"><div class="lsh-pt"><i></i></div><div class="lsh-m"><div class="lsh-h">${esc(c.name)}</div><div class="lsh-todo"><small>Что нужно сделать</small><div><span>Перевести на налоги<b>${fmtM(need,false)} сом</b></span><em>Оплатить</em></div></div>
    <div class="lsh-ln"><span>Отчёты</span><b>сдано ${done} из ${rs.length}${nx?` · следующий до ${fmtD(nx.due).slice(0,5)}`:''}</b></div><div class="lsh-ln"><span>Файлы</span><b>Отправить файл</b></div><div class="lsh-ln"><span>Бухгалтер</span><b>Позвонить</b></div></div><div class="lsh-nav">${['Главное','Оплата','Отчёты','Файлы'].map((x,i)=>`<span class="${i===0?'on':''}">${x}</span>`).join('')}</div></div>`}
// v78 (Кутман 08.11.2026): лендинг минималистичный — в блоке видны только заголовки, подробности раскрывает «Подробнее»; у каждого блока своя анимация
function landDraw(){const el=$('#land');if(!el||!LAND.open)return;const D=landDemo(),N=landNums(),M=LAND.more||(LAND.more={});
  const nav=[['features','land.nav.features'],['new','land.nav.new'],['start','land.nav.start'],['security','land.nav.security'],['faq','land.nav.faq']].map(([id,k])=>`<button type="button" data-lp-go="${id}">${LE(k)}</button>`).join('');
  const bar=`<div class="pub-bar land-bar"><span class="pub-proto">${ic('eye','sm')}<span>Прототип: страница, которую гость видит на buhuchet.kg без входа</span></span><span class="pub-url">${ic('lock','sm')}<span class="mono">${LAND.test?'test.buhuchet.kg':'buhuchet.kg'}</span></span><label class="lp-pt"><input type="checkbox" id="lp-test" ${LAND.test?'checked':''}>Тестовый стенд</label><label class="lp-pt"><input type="checkbox" id="lp-net" ${LAND.netErr?'checked':''}>Нет связи при отправке</label><button type="button" class="btn sm" id="lp-intro-r">${ic('play','sm')}Заставка</button><button type="button" class="btn sm" id="land-x">${ic('x','sm')}${S.loggedIn===false?'Вернуться ко входу':'Вернуться в программу'}</button></div>`;
  const head=`<header class="lp-head"><div class="lp-wrap lp-head-in"><button type="button" class="lp-logo" data-lp-top aria-label="Buhuchet.kg — в начало страницы">${landLogo()}<span><span class="lp-bn">Buhuchet.kg</span><span class="lp-bs">${LE('land.brand.sub')}</span></span></button>
    <nav class="lp-nav" aria-label="Разделы страницы">${nav}</nav><div class="lp-head-r"><button type="button" class="linkbtn lp-demo-l lp-hide-m" data-lp-demo>${LE('land.nav.demo')}</button><button type="button" class="icon-btn lp-theme" data-lp-theme aria-label="${LE('land.btn.theme')}" title="${LE('land.btn.theme')}">${ic(effTheme()==='dark'?'sun':'moon')}</button><button type="button" class="btn" data-lp-login>${LE('land.btn.login')}</button><button type="button" class="btn cta lp-hide-m" data-lp-lead>${LE('land.btn.lead')}</button><button type="button" class="icon-btn lp-burger" data-lp-menu aria-expanded="${LAND.menu}" aria-controls="lp-menu" aria-label="${LE('land.btn.menu')}">${ic(LAND.menu?'x':'menu')}</button></div></div>
    <div class="lp-menu" id="lp-menu" ${LAND.menu?'':'hidden'}><nav aria-label="Разделы страницы">${nav}</nav><button type="button" class="btn cta" data-lp-lead>${LE('land.btn.lead')}</button><button type="button" class="btn" data-lp-demo>${LE('land.btn.demo')}</button></div></header>`;
  // Видео лендинга (решение заказчика 08.11.2026): отмеченные администратором платформы «Показывать на лендинге», по «Порядку на лендинге»
  const LV=vidLand();
  // Первый экран: заголовок, одна строка, две кнопки, картинка; внизу «Листайте вниз» — отсюда начинается линия Бернулли
  const hero=`<section class="lp-hero lp-live" id="lp-hero">${landHeroBg()}<div class="lp-wrap lp-hero-in"><div class="lp-hero-tx"><h1 class="rv">${LE('land.hero.title')}</h1><p class="lp-hero-p rv" style="--d:1">${LE('land.hero.lead')}</p><div class="lp-cta-row rv" style="--d:2"><button type="button" class="btn cta lp-lg" data-lp-lead>${LE('land.btn.lead')}</button><button type="button" class="btn lp-lg" data-lp-demo>${LE('land.btn.demo')}</button></div>${LV[0]?`<button type="button" class="lp-vlink rv" style="--d:3" data-lp-vid="${LV[0].id}"><span class="lp-vlink-i">${ic('pl','sm')}</span><span>${LE('land.video.watch')} · ${vidT(LV[0].dur)}</span></button>`:''}</div>
    <div class="lp-hero-pic" role="img" aria-label="Экран «Отчеты для сдачи» на компьютере и на телефоне">${lshDesk(D,true)}${lshPhone(D)}</div></div><button type="button" class="lp-scroll" data-lp-go="emb"><i aria-hidden="true"></i><span>${LE('land.scroll')}</span></button></section>`;
  const stats=`<section class="lp-stats" aria-label="Buhuchet.kg в цифрах"><div class="lp-wrap lp-stats-in"><div class="lp-stat rv"><b data-lp-count="${N.types}">${N.types}</b><span>${LE('land.stats.types')}</span></div><div class="lp-stat rv" style="--d:1"><b data-lp-count="${N.regimes}">${N.regimes}</b><span>${LE('land.stats.regimes')}</span></div><div class="lp-stat rv" style="--d:2"><span class="lp-si">${ic('calendar')}</span><strong>${LE('land.stats.cal')}</strong></div><div class="lp-stat rv" style="--d:3"><span class="lp-si">${ic('bell')}</span><strong>${LE('land.stats.remind')}</strong></div></div></section>`;
  // Блок с «Подробнее»: dd/ds — скрытые подробности (div и span), more — кнопка раскрытия
  const dd=h=>`<div class="lp-d"><div>${h}</div></div>`,ds=h=>`<span class="lp-d"><span>${h}</span></span>`;
  const more=(id,lab)=>`<div class="lp-more-row"><button type="button" class="lp-more" data-lp-more="${id}" aria-expanded="${!!M[id]}"><span>${M[id]?LE('land.less'):(lab||LE('land.more'))}</span>${ic('down','sm')}</button></div>`;
  const sec=(id,cls,title,body,sub)=>`<section class="lp-sec lp-b ${cls}${M[id]?' open':''}" id="lp-${id}" data-lp-k="${id}"><div class="lp-wrap"><h2 class="rv">${title}</h2>${sub?`<p class="lp-sub rv">${sub}</p>`:''}${body}</div></section>`;
  // 1. Герб — печать прилетает и «штампуется», символы оживают; нажатие на символ показывает, что он значит в программе
  const EI=[['sun','s','sun'],['scales','w','scale'],['curve','c','']];
  const emb=sec('emb','lp-emb lp-live',LE('land.emb.title'),`<div class="lp-emb-in"><div class="lp-emb-fig">${landEmblem()}</div><div class="lp-emb-r"><ul class="lp-emb-l">${EI.map(([k,c,i],n)=>`<li class="rv" style="--d:${n}"><button type="button" data-lp-emb="${k}" aria-pressed="false"><span class="lp-emb-ic ${c}">${i?ic(i):lpSpiIc()}</span><span class="lp-emb-tx"><b>${LE(`land.emb.${n+1}.t`)}</b>${ds(LE(`land.emb.${n+1}.d`))}</span></button></li>`).join('')}</ul>${dd(`<p class="lp-motto"><span class="lp-motto-f">${LE('land.emb.motto')}</span><span>${LE('land.emb.motto.ru')}</span></p>`)}${more('emb')}</div></div>`,LE('land.emb.sub'));
  // 2. Кому подходит — карточки переворачиваются к посетителю
  const who=sec('who','lp-who alt',LE('land.who.title'),`<div class="lp-grid3">${[['building',''],['user','g'],['chart','p']].map(([i,c],n)=>`<div class="lp-card rv" style="--d:${n}"><span class="lp-ico ${c}">${ic(i)}</span><h3>${LE(`land.who.${n+1}.t`)}</h3>${dd(`<p>${LE(`land.who.${n+1}.d`)}</p>`)}</div>`).join('')}</div>${more('who')}`);
  // 3. Что меняется — карточка «Было» переворачивается в «Стало»; «Подробнее» — обе стороны рядом
  const chg=sec('change','lp-chg-s',LE('land.change.title'),`<div class="lp-flips">${[1,2,3,4].map(n=>`<button type="button" class="lp-fc rv" style="--d:${n-1}" data-lp-flip><span class="lp-fc-in"><span class="lp-fc-f lp-fw"><small>${ic('x','sm')}${LE('land.change.was')}</small><span class="lp-x">${LE(`land.change.${n}.a`)}</span></span><span class="lp-fc-f lp-fn"><small>${ic('check','sm')}${LE('land.change.now')}</small><span>${LE(`land.change.${n}.b`)}</span></span></span></button>`).join('')}</div><p class="lp-hint rv">${LE('land.change.tap')}</p>${more('change')}`);
  // 4. Возможности — плитки встают волной; у каждой функции свой значок со своей анимацией (LP_FI); плитка раскрывается нажатием, «Подробнее» раскрывает все
  const FC=['','g','p','','y','g','p','','y','g','p',''];
  const feat=sec('features','lp-feat lp-live alt',LE('land.feat.title'),`<div class="lp-tiles">${FC.map((c,n)=>`<button type="button" class="lp-tile rv" style="--d:${n%4+Math.floor(n/4)}" data-lp-tile aria-expanded="false"><span class="lp-ico ${c}">${lpFeatIco(n)}</span><b>${LE(`land.feat.${n+1}.t`)}</b>${ds(LE(`land.feat.${n+1}.d`))}</button>`).join('')}</div>${more('features')}`);
  // 5. Как это выглядит — экран «раскрывается», как крышка ноутбука, пока блок въезжает при прокрутке
  const shots=[lshDesk(D),lshCard(D),lshPhone(D)];
  const shot=sec('shots','lp-shots',LE('land.shots.title'),`<div class="lp-tabs rv" role="tablist" aria-label="${LE('land.shots.title')}">${[1,2,3].map(n=>`<button type="button" role="tab" id="lp-st-${n-1}" aria-controls="lp-sl-${n-1}" aria-selected="${LAND.shot===n-1}" data-lp-shot="${n-1}">${LE(`land.shots.${n}.t`)}</button>`).join('')}</div>
    <div class="lp-tilt"><div class="lp-track" id="lp-track">${shots.map((h,i)=>`<figure class="lp-slide" id="lp-sl-${i}" role="tabpanel" aria-labelledby="lp-st-${i}"><div role="img" aria-label="${LE(`land.shots.${i+1}.t`)}" class="lp-shot">${h}</div><figcaption class="lp-d"><span>${LE(`land.shots.${i+1}.d`)}</span></figcaption></figure>`).join('')}</div></div><div class="lp-shots-cta"><button type="button" class="btn lp-lg" data-lp-demo>${ic('eye','sm')}${LE('land.btn.demo')}</button></div>${more('shots')}`);
  // 5а. Новое в Buhuchet.kg (решение заказчика 18.11.2026: показать новые функции) — живой снимок и одна строка; снимки встают по очереди
  const NW=[lshBell(D),lshView(D),lshClient(D),lshBot(D)];
  const nws=sec('new','lp-new',LE('land.new.title'),`<div class="lp-new-g">${NW.map((h,i)=>`<figure class="lp-nc rv" style="--d:${i}"><div class="lp-nc-pic" role="img" aria-label="${LE(`land.new.${i+1}.t`)}">${h}</div><figcaption><b>${LE(`land.new.${i+1}.t`)}</b><span>${LE(`land.new.${i+1}.d`)}</span></figcaption></figure>`).join('')}</div>`,LE('land.new.sub'));
  // 6. Видео о Buhuchet.kg — первое крупно, с обложкой и пульсирующей «▶», остальные карточками; описания — по «Подробнее»; нет видео — блока нет
  const vid=LV.length?sec('video','lp-vids',LE('land.video.title'),`<div class="lp-vgrid${LV.length>1?'':' one'}"><div class="lp-vmain rv"><button type="button" class="lp-vbig" data-lp-vid="${LV[0].id}" aria-label="${esc(LV[0].t)} · ${vidT(LV[0].dur)}">${vidCover(LV[0],{land:1,cls:'lp-vcv'})}</button><div class="lp-vtx">${LV[0].cover||LV[0].frame?`<b>${esc(LV[0].t)}</b>`:''}<span class="lp-vdur">${ic('clock','sm')}${vidT(LV[0].dur)}</span>${LV[0].desc?dd(`<p>${esc(LV[0].desc)}</p>`):''}</div></div>${LV.length>1?`<div class="lp-vlist">${LV.slice(1).map((v,i)=>`<button type="button" class="lp-vc rv" style="--d:${i+1}" data-lp-vid="${v.id}">${vidCover(v,{land:1,cls:'sm',nod:1})}<span class="lp-vct"><b>${esc(v.t)}</b><span class="lp-vdur">${ic('clock','sm')}${vidT(v.dur)}</span>${v.desc?ds(esc(v.desc)):''}</span></button>`).join('')}</div>`:''}</div>${LV.some(v=>v.desc)?more('video'):''}`):'';
  // 7. Как начать — линия шагов заполняется по прокрутке, номера загораются
  const start=sec('start','lp-start alt',LE('land.start.title'),`<div class="lp-steps-w"><span class="lp-sline" aria-hidden="true"><i></i></span><ol class="lp-steps">${[1,2,3,4].map(n=>`<li class="rv" style="--d:${n-1}"><span class="lp-num" aria-hidden="true">${n}</span><h3>${LE(`land.start.${n}.t`)}</h3>${dd(`<p>${LE(`land.start.${n}.d`)}</p>`)}</li>`).join('')}</ol></div>${more('start')}`);
  // 8. Безопасность — щит рисуется, замок защёлкивается, значки выходят на орбиту
  const SI=['shield','key','users','history','archive']; // пункт «Серверы в Европе (Франкфурт)…» убран (Кутман 02.11.2026)
  const secu=sec('security','lp-secu',LE('land.sec.title'),`<div class="lp-secu-in"><div class="lp-orbit rv" aria-hidden="true"><svg class="lp-shield" viewBox="0 0 120 140" focusable="false"><path class="sh-b" d="M60 8L106 25V64C106 96 87 119 60 131C33 119 14 96 14 64V25Z" pathLength="1"/><path class="sh-k" d="M49 68V58a11 11 0 0 1 22 0v10"/><rect class="sh-l" x="42" y="66" width="36" height="28" rx="5"/><circle class="sh-h" cx="60" cy="78" r="3.6"/><path class="sh-h" d="M58.4 80h3.2l1 7h-5.2Z"/></svg><span class="lp-orb-r">${SI.map((i,n)=>`<span class="lp-orb" style="--a:${n*72-90}deg;--d:${n}"><i>${ic(i)}</i></span>`).join('')}</span></div>
    <div class="lp-secu-r"><p class="lp-secu-s rv">${LE('land.sec.short')}</p>${dd(`<ul class="lp-secl">${SI.map((i,n)=>`<li>${ic(i)}<span>${LE(`land.sec.${n+1}`)}</span></li>`).join('')}</ul>`)}${more('security')}</div></div>`);
  // 9. Вопросы — выезжают попеременно слева и справа; видны первые три, «Подробнее» — остальные
  const fq=n=>`<details class="rv" style="--d:${(n-1)%3}"><summary>${LE(`land.faq.${n}.q`)}</summary><p>${LE(`land.faq.${n}.a`)}</p></details>`;
  const faq=sec('faq','lp-faqs alt',LE('land.faq.title'),`<div class="lp-faq">${[1,2,3].map(fq).join('')}</div>${dd(`<div class="lp-faq lp-faq2">${[4,5,6,7].map(fq).join('')}</div>`)}${more('faq')}`);
  // 10. Оставить заявку — форма раскладывается, поля встают по одному; после отправки — печать; контакты под «Контакты»
  const cont=landContacts();
  const lead=sec('lead','lp-leads',LE('land.lead.title'),`<div class="lp-lead-in"><div id="lp-fbox" class="lp-fold rv">${LAND.sent?landOkHtml():landFormHtml()}</div>${cont.length?`<div class="lp-cont rv" style="--d:2">${more('lead',LE('land.c.title'))}${dd(cont.join(''))}</div>`:''}</div>`,LE('land.lead.sub'));
  const foot=`<footer class="lp-foot"><div class="lp-wrap lp-foot-in"><span><b>${LE('land.foot.name')}</b><br>${LE('land.foot.copy',{год:TODAY.slice(0,4)})}${LT('land.foot.ver')?` · <span class="lp-ver">${LE('land.foot.ver',{версия:PROTO_VER.split(' ')[0].replace(/^v/,'')})}</span>`:''}</span>${cont.length?`<span class="lp-foot-l">${cont.join('')}</span>`:''}<span class="lp-foot-l"><button type="button" class="linkbtn" data-lp-login>${LE('land.btn.login')}</button><button type="button" class="linkbtn" data-lp-consent>${LE('land.consent.title')}</button></span></div></footer>`;
  const fab=`<div class="lp-fab" id="lp-fab" hidden><button type="button" class="btn cta" data-lp-lead>${LE('land.btn.lead')}</button></div>`;
  // Линия Бернулли через всю страницу (рисуется по прокрутке, на конце — солнце) и весы в углу (качаются от прокрутки, кольцо — сколько прочитано; нажатие — наверх)
  const path=`<svg class="lp-path" id="lp-path" aria-hidden="true" focusable="false"><defs><clipPath id="lp-rclip"><rect class="lp-rc" x="-100" y="0" width="0" height="0"/></clipPath></defs><path class="lp-p0"/><g class="lp-rsp"><path class="lp-sp-f"/><path class="lp-sp-c"/></g><g class="lp-rw" clip-path="url(#lp-rclip)"><path class="lp-p1"/><path class="lp-p2"/><path class="lp-p3"/></g><g class="lp-knots"></g><g class="lp-psun"><circle class="g" r="15"/><path class="r" d="M0-11V-15M0 11V15M-11 0H-15M11 0H15M-7.8-7.8-10.6-10.6M7.8 7.8 10.6 10.6M-7.8 7.8-10.6 10.6M7.8-7.8 10.6-10.6"/><circle class="c" r="6"/></g></svg>`;
  const bal=`<button type="button" class="lp-bal" id="lp-bal" hidden aria-label="${LE('land.top')}" title="${LE('land.top')}"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle class="b0" cx="32" cy="32" r="29"/><circle class="b1" cx="32" cy="32" r="29" pathLength="1" transform="rotate(-90 32 32)"/><path class="bp" d="M32 19V47M25 48H39"/><g class="bb"><path class="bk" d="M16 22H48"/><g class="bl"><path d="M16 22L11 33M16 22L21 33"/><path class="bw" d="M9.5 33H22.5Q21 38 16 38Q11 38 9.5 33Z"/></g><g class="br"><path d="M48 22L43 33M48 22L53 33"/><path class="bw" d="M41.5 33H54.5Q53 38 48 38Q43 38 41.5 33Z"/></g></g><circle class="bc" cx="32" cy="22" r="2.6"/></svg></button>`;
  el.innerHTML=bar+`<div class="land-page" id="land-page">${LAND.test?`<div class="lp-test">${LE('land.test')}</div>`:''}${head}${path}<main>${hero}${stats}${landAlt([emb,who,chg,feat,shot,nws,vid,start,secu,faq,lead])}</main>${foot}${fab}</div>${bal}`;
  landBind(el)}
const landFormHtml=()=>{const opts=LT('land.f.size.opts').split('|').map(s=>s.trim()).filter(Boolean);
  // Доработки 14.11.2026, блок 1: «ОсОО» или «ИП» первым полем, документы в PDF и данные из них (modules/lead-docs.js), дальше — прежние поля
  return `<form class="lp-form" id="lp-form" novalidate autocomplete="on">${ldTopHtml()}${fld(`${LE('land.f.firm')} ${ldFirmMark()}`,inp('lf-firm','','autocomplete="organization" maxlength="160"'),{req:true,id:'lf-firm'})}${ldRegHtml()}
    ${fld(LE('land.f.name'),inp('lf-name','','autocomplete="name" maxlength="120"'),{req:true,id:'lf-name'})}${fld(LE('land.f.phone'),phoneInput('lf-phone',null),{req:true,id:'lf-phone'})}${fld(LE('land.f.size'),sel('lf-size',[['',LT('land.f.size.ph')],...opts.map(o=>[o,o])],''),{req:true,id:'lf-size'})}
    ${fld(LE('land.f.tg'),inp('lf-tg','',`autocomplete="off" maxlength="64" placeholder="${LE('land.f.tg.ph')}"`),{id:'lf-tg'})}<div></div>
    ${fld(LE('land.f.note'),`<textarea class="inp" id="lf-note"></textarea>`,{id:'lf-note',full:true,hint:'До 1 000 знаков'})}
    <div class="lp-hp" aria-hidden="true"><label for="lf-site">Сайт</label><input id="lf-site" tabindex="-1" autocomplete="off"></div>
    <div class="fld lp-check-f" data-f="lf-ok"><label class="lp-check"><input type="checkbox" id="lf-ok"><span>${LE('land.f.consent.a')} <button type="button" class="linkbtn" data-lp-consent style="display:inline;padding:0">${LE('land.f.consent.b')}</button></span></label><div class="err" hidden></div></div>
    <div class="note bad" id="lf-msg" role="alert" hidden></div><div class="note lp-tgline full">${ic('tg')}<span>${LE('land.f.tgline')}</span></div><div class="lp-send"><button type="submit" class="btn cta lp-lg" id="lf-send">${LE('land.f.send')}</button></div></form>`};
const landOkHtml=()=>{const o=LAND.sentLead&&LEADS.find(x=>x.id===LAND.sentLead);return o&&leadHasDocs(o)?ldOkHtml(o):landOkHtml0()};
const landOkHtml0=()=>`<div class="lp-ok" role="status"><svg class="lp-stamp" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="29"/><circle class="i" cx="32" cy="32" r="23"/><path class="k" d="M21 33l7 7 15-16"/></svg><span>${LE('land.ok',{телефон:LAND.sent})}</span></div>`;
function landGo(id,focus){const t=$('#lp-'+id);if(!t)return;if(LAND.menu){LAND.menu=false;landMenuSync()}t.scrollIntoView({behavior:landRM()?'auto':'smooth',block:'start'});
  if(focus){const f=$('#lf-form [data-lf-form]')||$('#lf-name');if(f)setTimeout(()=>f.focus({preventScroll:true}),landRM()?0:450)}}
function landMenuSync(){const el=$('#land');if(!el)return;const m=$('#lp-menu',el),b=$('[data-lp-menu]',el);if(m)m.hidden=!LAND.menu;if(b){b.setAttribute('aria-expanded',LAND.menu);b.innerHTML=ic(LAND.menu?'x':'menu')}}
// Блоки через один на светлом фоне («alt»): когда блока «Видео» нет, чередование не сбивается
const landAlt=a=>a.filter(Boolean).map((h,i)=>h.replace(/^<section class="([^"]*)"/,(m,c)=>`<section class="${c.split(' ').filter(x=>x!=='alt').concat(i%2?['alt']:[]).join(' ')}"`)).join('');
function landShotSync(){$$('[data-lp-shot]').forEach(b=>b.setAttribute('aria-selected',+b.dataset.lpShot===LAND.shot))}
function landConsent(){openModal({render:()=>({title:LE('land.consent.title'),body:`<p style="margin:0;line-height:1.55">${LE('land.consent.text')}</p>${LT('land.consent.docs')?`<p style="margin:10px 0 0;line-height:1.55">${LE('land.consent.docs')}</p>`:''}`,foot:'<button class="btn cta" data-close>Понятно</button>'})})}
function landBind(el){const page=$('#land-page',el);
  $('#land-x',el).onclick=landClose;
  $('#lp-test',el).onchange=e=>{LAND.test=e.target.checked;const top=page.scrollTop;landDraw();$('#land-page').scrollTop=top};
  $('#lp-net',el).onchange=e=>{LAND.netErr=e.target.checked};
  $('#lp-intro-r',el).onclick=()=>{$('#land-page',el).scrollTop=0;buIntro(true);landDraw()};
  page.onclick=e=>{const b=e.target.closest('[data-lp-go],[data-lp-lead],[data-lp-login],[data-lp-top],[data-lp-menu],[data-lp-consent],[data-lp-shot],[data-lp-demo],[data-lp-theme],[data-lp-more],[data-lp-flip],[data-lp-tile],[data-lp-emb],[data-lp-vid]');if(!b)return;const d=b.dataset;
    if(d.lpVid)return vidOpen(d.lpVid,{guest:true});
    if(d.lpMore){const k=d.lpMore,s=$('#lp-'+k,el),o=!LAND.more[k];LAND.more[k]=o;s.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.firstElementChild.textContent=o?LT('land.less'):(k==='lead'?LT('land.c.title'):LT('land.more'));return}
    if(d.lpFlip!=null)return b.classList.toggle('now');
    if(d.lpTile!=null){const o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o);if(o)landTileFx(b);return}
    if(d.lpEmb)return landEmbPick(el,d.lpEmb);if(d.lpDemo!=null)return demoOpen();if(d.lpTheme!=null)return landThemeToggle(b);
    if(d.lpGo)return landGo(d.lpGo);if(d.lpLead!=null)return landGo('lead',!LAND.sent);if(d.lpLogin!=null)return landLogin();if(d.lpConsent!=null){e.preventDefault();return landConsent()}
    if(d.lpTop!=null){if(LAND.menu){LAND.menu=false;landMenuSync()}return page.scrollTo({top:0,behavior:landRM()?'auto':'smooth'})}
    if(d.lpMenu!=null){LAND.menu=!LAND.menu;return landMenuSync()}
    if(d.lpShot!=null){LAND.shot=+d.lpShot;landShotSync();const tr=$('#lp-track',el);tr.scrollTo({left:LAND.shot*tr.clientWidth,behavior:landRM()?'auto':'smooth'})}};
  el.onkeydown=e=>{if(e.key==='Escape'&&LAND.menu){LAND.menu=false;landMenuSync();const b=$('[data-lp-menu]',el);if(b)b.focus()}};
  // На телефоне снимки листаются свайпом; вкладка над снимками следует за прокруткой
  const tr=$('#lp-track',el);if(tr){if(LAND.shot)tr.scrollLeft=LAND.shot*tr.clientWidth;tr.onscroll=()=>{const i=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth));if(i!==LAND.shot){LAND.shot=i;landShotSync()}}}
  // На телефоне после первого экрана внизу закреплена «Оставить заявку»; над блоком «Оставить заявку» она скрывается
  if(LAND.io)LAND.io.disconnect();LAND.vis={'lp-hero':true,'lp-lead':false};const fab=$('#lp-fab',el);
  if('IntersectionObserver' in window){LAND.io=new IntersectionObserver(en=>{en.forEach(x=>LAND.vis[x.target.id]=x.isIntersecting);fab.hidden=LAND.vis['lp-hero']||LAND.vis['lp-lead'];const bl=$('#lp-bal',el);if(bl)bl.hidden=!!LAND.vis['lp-hero']},{root:page,threshold:0});['lp-hero','lp-lead'].forEach(id=>LAND.io.observe($('#'+id,el)))}
  landFormBind(el);landFx(el)}
function landFormBind(el){const f=$('#lp-form',el);if(!f)return;bindPhone(f,'lf-phone');ldReset();ldBind(f);
  const clr=id=>()=>setErr(f,id,'');['lf-name','lf-firm','lf-phone','lf-tg','lf-note'].forEach(id=>{const i=$('#'+id,f);if(i)i.addEventListener('input',clr(id))});$('#lf-size',f).onchange=clr('lf-size');$('#lf-ok',f).onchange=clr('lf-ok');
  f.onsubmit=e=>{e.preventDefault();const btn=$('#lf-send',f);if(btn.disabled)return;const msg=$('#lf-msg',f);msg.hidden=true;
    const v={name:val(f,'lf-name'),firm:val(f,'lf-firm'),size:val(f,'lf-size'),tg:val(f,'lf-tg'),note:$('#lf-note',f).value.trim()};const p=readPhone(f,'lf-phone');
    const dv=ldCheck(f);Object.assign(v,dv.v);
    const ok=[dv.ok,setErr(f,'lf-name',v.name?'':LT('land.e.name')),setErr(f,'lf-firm',v.firm?'':LT('land.e.firm')),setErr(f,'lf-phone',p.ok?'':LT('land.e.phone',{цифр:p.need})),setErr(f,'lf-size',v.size?'':LT('land.e.size')),setErr(f,'lf-note',v.note.length>1000?LT('land.e.note'):''),setErr(f,'lf-ok',$('#lf-ok',f).checked?'':LT('land.e.consent'))];
    if(!ok.every(Boolean)){const b=f.querySelector('.fld.bad input,.fld.bad select,.fld.bad textarea,.fld.bad button');if(b)b.focus();return}
    if(LD.busy){msg.hidden=false;msg.innerHTML=ic('hourglass','sm')+`<span>${LE('land.e.busy')}</span>`;return}
    v.phone=p.ph;const trap=!!$('#lf-site',f).value;
    btn.disabled=true;btn.textContent=LT('land.f.sending');
    // Отправка заявки — единственный запрос лендинга к серверу; в прототипе — пауза и запись в TemDB
    setTimeout(()=>{if(!LAND.open)return;
      if(LAND.netErr){btn.disabled=false;btn.textContent=LT('land.f.send');msg.hidden=false;msg.innerHTML=ic('alert','sm')+`<span>${LE('land.e.net')}</span>`;return}
      // Поле-ловушка заполнено (так делают боты): заявка не сохраняется, ответ — обычное «Спасибо!»
      const o=trap?null:leadAdd(v);LAND.sent=fmtPhone(v.phone);LAND.sentLead=o?(o.dup?o.lead:o).id:null;$('#lp-fbox').innerHTML=landOkHtml();
      // После отправки экран «Заявка отправлена» с подключением Telegram — на виду, а не выше экрана
      const lb=$('#lp-lead');if(lb)lb.scrollIntoView({block:'start',behavior:'auto'});if(o)leadTgPreview(o.dup?o.lead:o,!!o.dup)},700)}}
// Новая заявка: повтор с тем же телефоном в течение суток новой не создаётся — комментарий дописывается к первой заявке
function leadAdd(v){const day=Date.now()-24*36e5,at=nowStamp();const dup=LEADS.find(x=>x.phone&&x.phone.digits===v.phone.digits&&stAt(x.at)>=day);
  if(dup){if(v.note)dup.note=(dup.note?dup.note+'\n':'')+v.note;const docs=!leadHasDocs(dup)&&!dup.org&&v.form;if(docs)Object.assign(dup,{form:v.form,docs:v.docs,inn:v.inn,okpo:v.okpo,addr:v.addr,head:v.head,firm:v.firm});
    leadLog(dup,'Повторная заявка с того же телефона'+[v.note?'комментарий дописан':'',docs?'приложены документы':''].filter(Boolean).map((t,i)=>(i?', ':': ')+t).join(''),'guest');leadNotify();dbSoon();return {dup:true,lead:dup}}
  const id='L'+(Math.max(0,...LEADS.map(x=>+String(x.id).slice(1)||0))+1);
  const o={id,at,name:v.name,firm:v.firm,phone:v.phone,size:v.size,tg:v.tg,note:v.note,form:v.form,docs:v.docs,inn:v.inn,okpo:v.okpo,addr:v.addr,head:v.head,status:'Новая',org:null,adminNote:'',hist:[{at,who:'guest',what:'Заявка с сайта'+(LAND.test?' (тестовый стенд)':'')}],_cb:'guest',_ca:at,_ub:'guest',_ua:at};
  LEADS.unshift(o);leadNotify();dbSoon();return o}
// Сообщение администраторам платформы в Telegram в прототипе показывается окном предпросмотра: чат бота с кнопками «Взять в работу», «Отклонить», «Открыть в Админке» (поток Т, задача Т6 — admin/tg-leads.js)
function leadTgPreview(o,rep){leadTgDlg(o,rep)}
function landToAdmin(){landHide();const lg=$('#login');if(lg)lg.remove();S.loggedIn=true;if(S.me!=='admin')switchUser('admin');go('orgs','leads')}

/* ═════════════ Анимации лендинга: отсылки к гербу бухгалтеров (v78, Кутман 08.11.2026) ═════════════ */
// «Возможности»: значок каждой функции собран из частей, и у каждого своя анимация (классы f1…f12 в landing.css):
// 1 — листы отчётов раскладываются веером, 2 — отметка срока прыгает по дням, 3 — лупа проходит по списку и ставит галочку, 4 — самолётик улетает и возвращается,
// 5 — галочки ставятся по очереди, 6 — монета падает на стопку, 7 — печатается квитанция, 8 — на странице клиента набирается код, 9 — столбики растут,
// 10 — из папки поднимается лист, 11 — переключатели прав: один включается, второй не поддаётся, 12 — шапочка выпускника подлетает.
// Анимация идёт, когда плитка появилась, под мышью, при раскрытии, а пока блок на экране — у плиток по очереди (landTileFx)
const LP_FI=[
  '<rect class="f1-c bg" x="9.5" y="2.5" width="11" height="14" rx="2"/><rect class="f1-b bg" x="6.5" y="5" width="11" height="14" rx="2"/><g class="f1-a"><rect class="bg" x="3.5" y="7.5" width="11" height="14" rx="2"/><path d="M6.5 12h5M6.5 15h5M6.5 18h3"/></g>',
  '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17"/><path class="f2-r" d="M8 3v4M16 3v4"/><path class="f2-g" d="M7.5 13.6h.01M12 13.6h.01M16.5 13.6h.01M7.5 17.1h.01M12 17.1h.01"/><rect class="f2-d dot" x="14.6" y="15.2" width="3.8" height="3.8" rx="1.1"/>',
  '<path d="M3.5 6h10M3.5 11h5M3.5 16h6"/><g class="f3-m"><circle class="bg" cx="15" cy="13.5" r="4.3"/><path d="M18.1 16.6l3.1 3.1"/><path class="f3-k" pathLength="1" d="M13.2 13.6l1.3 1.3 2.3-2.6"/></g>',
  '<path class="f4-t" d="M3 21l3.5-3.5M3.5 15.5l2-2M8.5 20.5l2-2"/><g class="f4-p"><path d="M21 3L3.5 9.6l6.9 3.6 3.6 6.9Z"/><path d="M21 3L10.4 13.2"/></g>',
  '<rect class="f5-x" x="3.5" y="3.5" width="7" height="7" rx="2"/><path class="f5-a" pathLength="1" d="M5.4 7.1l1.3 1.3 2.3-2.6"/><path d="M13.5 7h7"/><rect class="f5-y" x="3.5" y="13.5" width="7" height="7" rx="2"/><path class="f5-b" pathLength="1" d="M5.4 17.1l1.3 1.3 2.3-2.6"/><path d="M13.5 17h5"/>',
  '<path d="M3.5 18.2v-3.4M16.5 18.2v-3.4"/><ellipse cx="10" cy="18.2" rx="6.5" ry="2.4"/><ellipse class="bg" cx="10" cy="14.8" rx="6.5" ry="2.4"/><g class="f6-c"><path d="M3.5 14.8v-3.4M16.5 14.8v-3.4"/><ellipse class="bg" cx="10" cy="11.4" rx="6.5" ry="2.4"/></g><path class="f6-s" d="M19.2 3.2v4.2M17.1 5.3h4.2"/>',
  '<svg x="0" y="5.5" width="24" height="18.5" viewBox="0 5.5 24 18.5"><g class="f7-r"><path class="bg" d="M7 3v16.6l1.7-1.3 1.6 1.3 1.7-1.3 1.7 1.3 1.6-1.3 1.7 1.3V3"/><path d="M9.8 9.6h4.4M9.8 12.6h4.4M9.8 15.4h2.6"/></g></svg><path class="f7-s" d="M3.5 5.5h17"/>',
  '<g class="f8-w"><rect x="3" y="4.5" width="18" height="15.5" rx="2.5"/><path d="M3 9h18"/><path d="M6 6.8h.01M8.6 6.8h.01"/></g><circle class="f8-d dot" style="--i:0" cx="7.5" cy="14.5" r="1.3"/><circle class="f8-d dot" style="--i:1" cx="10.5" cy="14.5" r="1.3"/><circle class="f8-d dot" style="--i:2" cx="13.5" cy="14.5" r="1.3"/><circle class="f8-d dot" style="--i:3" cx="16.5" cy="14.5" r="1.3"/>',
  '<path d="M3.5 3.5v17h17"/><path class="f9-b" style="--i:0" d="M8 17.5v-3"/><path class="f9-b" style="--i:1" d="M12.5 17.5v-6"/><path class="f9-b" style="--i:2" d="M17 17.5v-9.5"/>',
  '<path d="M3.5 18.5V6A1.5 1.5 0 0 1 5 4.5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 8.5V12"/><g class="f10-s"><rect class="bg" x="7.8" y="8.6" width="8.4" height="9" rx="1.2"/><path d="M10 11.2h4"/></g><path class="f10-f bg" d="M3.5 13h17l-.9 5.8a1.5 1.5 0 0 1-1.5 1.2H5.9a1.5 1.5 0 0 1-1.5-1.2Z"/>',
  '<rect x="3" y="4" width="12" height="6.5" rx="3.25"/><circle class="f11-a dot" cx="11.75" cy="7.25" r="1.9"/><path d="M18 7.25h3"/><rect x="3" y="13.5" width="12" height="6.5" rx="3.25"/><circle class="f11-b dot" cx="6.25" cy="16.75" r="1.9"/><path d="M18 16.75h3"/>',
  '<g class="f12-c"><path d="M6.5 11.6v4.4c1.6 1.4 3.4 2.1 5.5 2.1s3.9-.7 5.5-2.1v-4.4"/><path class="bg" d="M2.5 9.5L12 5l9.5 4.5L12 14Z"/><path class="f12-t" d="M21.5 9.5v5.5"/></g>'];
const lpFeatIco=n=>`<svg class="lp-fi f${n+1}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${LP_FI[n]||''}</svg>`;
// Запустить анимацию значка плитки заново
function landTileFx(t){if(!t||landRM())return;t.classList.remove('fx');void t.offsetWidth;t.classList.add('fx');clearTimeout(t._fx);t._fx=setTimeout(()=>t.classList.remove('fx'),1900)}
// Герб бухгалтерской профессии: солнце — учёт освещает дела, весы — баланс, кривая Бернулли (логарифмическая спираль) — учёт вечен; девиз «Science · Conscience · Indépendance».
// Спираль логотипа — тоже кривая Бернулли (логарифмическая спираль). Из неё через всю страницу течёт река (landPathCalc), на её конце солнце;
// весы в углу качаются от прокрутки. Анимации только без «уменьшить движение» (класс lp-anim); без него всё нарисовано сразу и стоит на месте
const lpMask=(id)=>`<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-4" y="6" width="76" height="62"><path class="lp-draw" d="${LOGO_SVG.cl}" pathLength="1"/></mask></defs>`;
const lpLogoBody=(id,lc='')=>`${lpMask(id)}<path class="lg-sp" mask="url(#${id})" d="${LOGO_SVG.sp}"/><g class="lp-lg-b ${lc}"><path class="lg-l" transform="${LOGO_SVG.b[0]}" d="${LOGO_SVG.b[1]}"/></g><g class="lp-lg-u ${lc}"><path class="lg-l" transform="${LOGO_SVG.u[0]}" d="${LOGO_SVG.u[1]}"/></g>`;
const landLogo=()=>`<svg class="logo lp-logo-a" viewBox="${LOGO_SVG.vb}" aria-hidden="true" focusable="false">${lpLogoBody('lp-lgm')}</svg>`;
// Фон первого экрана: солнце с лучами справа сверху (спираль логотипа — начало реки, см. landPathCalc)
const landHeroBg=()=>`<div class="lp-hero-bg" aria-hidden="true"><span class="lp-hb-sun"></span></div>`;
// Спираль Бернулли (логарифмическая, r=R·e^(−b·φ)) одной линией — от центра наружу; внешний конец справа, с коротким росчерком. t — число витков, k — знаков после запятой
function lpSpi(cx,cy,R,t=2.6,b=.2,k=1){const n=Math.round(t*14),F=t*2*Math.PI,p=[];for(let j=0;j<=n;j++){const f=F*(1-j/n)-.55,r=R*Math.exp(-b*f);p.push([cx+r*Math.cos(-f),cy+r*Math.sin(-f)])}
  const f=q=>q[0].toFixed(k)+' '+q[1].toFixed(k);let d='M'+f(p[0]);
  for(let i=0;i<n;i++){const a0=p[Math.max(0,i-1)],a1=p[i],a2=p[i+1],a3=p[Math.min(n,i+2)];d+='C'+f([a1[0]+(a2[0]-a0[0])/6,a1[1]+(a2[1]-a0[1])/6])+' '+f([a2[0]-(a3[0]-a1[0])/6,a2[1]-(a3[1]-a1[1])/6])+' '+f(a2)}return d}
// Значок спирали Бернулли для списка символов герба
const lpSpiIc=()=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${lpSpi(11,12.6,8.4,2.2,.2,2)}"/></svg>`;
// Круглый герб: кольцо с девизом (сверху по-французски, снизу по-русски), в поле солнце, весы с чашами «Дебет» и «Кредит», под ними — спираль Бернулли
function landEmblem(){const r=(i,l)=>{const a=i*Math.PI/6,x=Math.sin(a),y=-Math.cos(a);return `M${(150+x*21).toFixed(1)} ${(78+y*21).toFixed(1)}L${(150+x*l).toFixed(1)} ${(78+y*l).toFixed(1)}`};
  const L=lpSpi(146,235,30);
  const pan=(x,k,lab)=>`<g class="e-pan e-pan-${k}"><path class="e-str" d="M${x} 124L${x-17} 160M${x} 124L${x+17} 160"/><ellipse class="e-coin e-coin-${k}" cx="${x}" cy="157" rx="9" ry="3.2"/><path class="e-bowl" d="M${x-22} 160H${x+22}Q${x+19} 172 ${x} 172Q${x-19} 172 ${x-22} 160Z"/><text class="e-lab" x="${x}" y="188">${lab}</text></g>`;
  return `<svg class="lp-emb-svg" viewBox="0 0 300 300" role="img" aria-label="${LE('land.emb.aria')}" focusable="false"><defs><radialGradient id="lpe-glow"><stop offset="0" class="e-g0"/><stop offset="1" class="e-g1"/></radialGradient><radialGradient id="lpe-fld" cx="50%" cy="38%" r="62%"><stop offset="0" class="e-f0"/><stop offset="1" class="e-f1"/></radialGradient><path id="lpe-top" d="M25 150A125 125 0 0 1 275 150"/><path id="lpe-bot" d="M14 150A136 136 0 0 0 286 150"/></defs>
    <circle class="e-rip" cx="150" cy="150" r="146"/><g class="e-seal"><circle class="e-band" cx="150" cy="150" r="146"/><circle class="e-edge" cx="150" cy="150" r="143" pathLength="1"/><circle class="e-field" cx="150" cy="150" r="117" fill="url(#lpe-fld)"/><circle class="e-dots" cx="150" cy="150" r="111" pathLength="1"/>
    <text class="e-ring"><textPath href="#lpe-top" startOffset="50%" text-anchor="middle">${LE('land.emb.motto')}</textPath></text><text class="e-ring"><textPath href="#lpe-bot" startOffset="50%" text-anchor="middle">${LE('land.emb.motto.r')}</textPath></text><path class="e-star" d="M10 150l4-4 4 4-4 4ZM282 150l4-4 4 4-4 4Z"/></g>
    <g class="e-part e-sun" data-e="sun"><circle class="e-glow" cx="150" cy="78" r="42" fill="url(#lpe-glow)"/><path class="e-rays" d="${[...Array(12)].map((_,i)=>r(i,i%2?27:32)).join('')}"/><circle class="e-core" cx="150" cy="78" r="15"/></g>
    <g class="e-part e-scales" data-e="scales"><path class="e-post" d="M150 118V197"/><path class="e-base" d="M129 205H171L163 196H137Z"/><g class="e-beam"><path class="e-bar" d="M88 124H212"/>${pan(88,'l',LE('land.emb.debit'))}${pan(212,'r',LE('land.emb.credit'))}<circle class="e-piv" cx="150" cy="124" r="5"/></g><circle class="e-top" cx="150" cy="112" r="4"/></g>
    <g class="e-part e-curve" data-e="curve"><path class="e-inf" d="${L}" pathLength="1"/><path class="e-comet" d="${L}" pathLength="1"/></g></svg>`}
// Заставка при первом открытии сайта (один раз за сеанс): спираль логотипа рисуется от центра, встают B и u, буквами пишется BuhUchet, потом знак и надпись улетают в шапку
// Заставка (Кутман 08.11): при каждом новом входе — открытие сайта (лендинг или учётная часть), открытие лендинга, вход в программу по логину и в демо-организацию.
// Спираль логотипа рисуется от центра, внутри B и u, ниже по буквам складывается BuhUchet.kg; затем знак и надпись улетают туда, где логотип на экране:
// в шапку лендинга, на карточку входа или в меню программы (на телефоне меню скрыто — знак уходит вверх и тает). Нажатие или клавиша — пропуск. При «уменьшить движение» заставки нет.
function buIntroTargets(){const vis=e=>{if(!e)return null;const r=e.getBoundingClientRect();return r.width&&r.height&&r.bottom>0&&r.right>0&&r.left<innerWidth&&r.top<innerHeight?e:null};
  if(LAND.open)return [vis($('#land .lp-logo .logo')),vis($('#land .lp-bn'))];
  const lg=$('#login');if(lg)return [vis($('.logo',lg)),vis($('.brand-name',lg))];
  const b=$$('.brand').find(x=>vis(x));return b?[vis($('.logo',b)),vis($('.brand-name',b))]:[null,null]}
function buIntro(force){if(landRM()||LAND.intro)return false;
  try{if(!force&&sessionStorage.getItem('bu.intro'))return false;sessionStorage.setItem('bu.intro','1')}catch(e){}
  buIntroEnd(true);const o=document.createElement('div');o.className='lp-intro';o.setAttribute('aria-hidden','true');
  o.innerHTML=`<div class="lp-intro-c"><svg class="lp-intro-lg" viewBox="${LOGO_SVG.vb}" focusable="false">${lpLogoBody('lp-inm','lp-in-l')}</svg><div class="lp-intro-w">${[...'BuhUchet'].map((c,i)=>`<span style="--i:${i}">${c}</span>`).join('')}<span class="kg" style="--i:9">.kg</span></div><i class="lp-intro-ln"></i></div>`;
  document.body.append(o);const land=$('#land');if(land)land.classList.add('lp-intro-on');LAND.intro=true;
  const fly=()=>{if(o.classList.contains('fly'))return;const fit=(a,b)=>{if(!a||!b)return '';const r1=a.getBoundingClientRect(),r2=b.getBoundingClientRect();if(!r1.height||!r2.height)return '';return `translate(${(r2.left+r2.width/2-r1.left-r1.width/2).toFixed(1)}px,${(r2.top+r2.height/2-r1.top-r1.height/2).toFixed(1)}px) scale(${(r2.height/r1.height).toFixed(3)})`};
    const [tl,tw]=buIntroTargets(),lg=$('.lp-intro-lg',o),w=$('.lp-intro-w',o),tf=fit(lg,tl);lg.style.transform=tf||'translateY(-34vh) scale(.3)';if(!tf)lg.classList.add('gone');w.style.transform=fit(w,tw)||'translateY(-26vh) scale(.4)';
    if(tl&&!LAND.open){tl.classList.add('bu-intro-tg');LAND.introTg=tl}o.classList.add('fly');
    if(LAND.afterIntro){const f=LAND.afterIntro;LAND.afterIntro=null;setTimeout(f,150)}LAND.introT2=setTimeout(()=>buIntroEnd(),850)};
  LAND.introT1=setTimeout(fly,2700);o.onclick=()=>{clearTimeout(LAND.introT1);fly()};LAND.introKey=e=>{if(LAND.intro){clearTimeout(LAND.introT1);fly()}};document.addEventListener('keydown',LAND.introKey,{once:true});return true}
function buIntroEnd(quiet){clearTimeout(LAND.introT1);clearTimeout(LAND.introT2);if(LAND.introKey)document.removeEventListener('keydown',LAND.introKey);$$('.lp-intro').forEach(x=>x.remove());const land=$('#land');if(land)land.classList.remove('lp-intro-on');LAND.intro=false;
  if(LAND.introTg){LAND.introTg.classList.remove('bu-intro-tg');LAND.introTg=null}
  if(!quiet&&LAND.afterIntro){const f=LAND.afterIntro;LAND.afterIntro=null;f()}}
function landFxStop(){LAND.tm.forEach(t=>{clearInterval(t);clearTimeout(t)});LAND.tm=[];clearTimeout(LAND.wt);if(LAND.rv){LAND.rv.disconnect();LAND.rv=null}if(LAND.ro){LAND.ro.disconnect();LAND.ro=null}if(LAND.raf){cancelAnimationFrame(LAND.raf);LAND.raf=0}if(LAND.braf){cancelAnimationFrame(LAND.braf);LAND.braf=0}if(LAND.lraf){cancelAnimationFrame(LAND.lraf);LAND.lraf=0}LAND.P=null;LAND.afterIntro=null}
// Числа полосы цифр досчитываются от нуля, когда полоса показалась
function landCount(b){const n=+b.dataset.lpCount;if(!n)return;const t0=performance.now(),dur=1200;const f=t=>{if(!b.isConnected)return;const k=Math.min(1,(t-t0)/dur);b.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)};b.textContent='0';requestAnimationFrame(f)}
// Ломаная по командам пути (M, L, Q, C с абсолютными координатами), шаг около 4 px: где река на любой высоте — без вопросов к браузеру
function lpPoly(){const px=[],py=[],pl=[];let x=0,y=0,len=0;const to=(nx,ny)=>{len+=Math.hypot(nx-x,ny-y);x=nx;y=ny;px.push(x);py.push(y);pl.push(len)};
  return {add(d){for(const m of d.matchAll(/([MLQC])([^MLQC]*)/g)){const v=m[2].trim().split(/[\s,]+/).map(Number);
      if(m[1]==='M'){x=v[0];y=v[1];px.push(x);py.push(y);pl.push(len)}
      else if(m[1]==='L')to(v[0],v[1]);
      else{const q=m[1]==='Q',ex=q?v[2]:v[4],ey=q?v[3]:v[5],ax=q?x+(v[0]-x)*2/3:v[0],ay=q?y+(v[1]-y)*2/3:v[1],bx=q?ex+(v[0]-ex)*2/3:v[2],by=q?ey+(v[1]-ey)*2/3:v[3],sx=x,sy=y;
        const n=Math.max(4,Math.min(160,Math.ceil((Math.hypot(ax-sx,ay-sy)+Math.hypot(bx-ax,by-ay)+Math.hypot(ex-bx,ey-by))/4)));
        for(let k=1;k<=n;k++){const t=k/n,u=1-t;to(u*u*u*sx+3*u*u*t*ax+3*u*t*t*bx+t*t*t*ex,u*u*u*sy+3*u*u*t*ay+3*u*t*t*by+t*t*t*ey)}}}},
    len:()=>len,pts:()=>({px,py})}}
// Река (решение заказчика 18.11.2026, вместо тонкой линии): спираль логотипа вырастает из знака в шапке и ложится на фон первого экрана,
// при прокрутке её витки закручиваются, а внешний виток широкой рекой течёт вниз через всю страницу — от поля к полю, за содержимым блоков.
// Вода доходит туда, докуда пролистали, и плавно догоняет прокрутку; по воде бежит течение; на конце — солнце
const LPR={b:.22,turns:2.4,n:220};
// Осевая спирали Бернулли: от центра (u=0) к внешнему концу (u=1); tw — закрутка внутренних витков, внешний конец стоит на месте и не отрывается от реки
function lpRspPts(P){const F=LPR.turns*2*Math.PI,n=LPR.n,p=[];for(let j=0;j<=n;j++){const u=j/n,f=F*(1-u),r=P.R*Math.exp(-LPR.b*f),a=P.th-f+P.tw*Math.pow(1-u,1.6);p.push([P.C[0]+r*Math.cos(a),P.C[1]+r*Math.sin(a),r])}return p}
// Тело спирали — лента, ширина которой растёт с радиусом (как в знаке), на внешнем конце она равна ширине реки
function lpRspD(p,P){const n=p.length-1,a=[],b=[],f=q=>q[0].toFixed(1)+' '+q[1].toFixed(1);
  for(let i=0;i<=n;i++){const q0=p[Math.max(0,i-1)],q1=p[Math.min(n,i+1)],dx=q1[0]-q0[0],dy=q1[1]-q0[1],l=Math.hypot(dx,dy)||1,h=Math.max(.5,P.Wr*p[i][2]/P.R/2);a.push([p[i][0]-dy/l*h,p[i][1]+dx/l*h]);b.push([p[i][0]+dy/l*h,p[i][1]-dx/l*h])}
  return 'M'+a.map(f).join('L')+'L'+b.reverse().map(f).join('L')+'Z'}
function landSpiralDraw(){const P=LAND.P;if(!P||P.twD===P.tw)return;P.twD=P.tw;const p=lpRspPts(P);P.spf.setAttribute('d',lpRspD(p,P));P.spc.setAttribute('d','M'+p.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L'))}
function landPathCalc(el){const page=$('#land-page',el),svg=$('#lp-path',el),w=$('#lp-emb .lp-wrap',el),hero=$('#lp-hero',el);if(!page||!svg||!w||!hero||!page.clientWidth)return;
  const pr=page.getBoundingClientRect(),st=page.scrollTop,W=page.clientWidth,H=page.scrollHeight,Y=r=>r.top-pr.top+st,X=r=>r.left-pr.left,f=v=>v.toFixed(1);
  svg.setAttribute('width',W);svg.setAttribute('height',H);svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.style.height=H+'px';
  // ширина реки и её берега: на компьютере — середина поля страницы, на телефоне — у самого края
  const cl=X(w.getBoundingClientRect())+parseFloat(getComputedStyle(w).paddingLeft),wide=W>=768,Wr=wide?Math.round(Math.max(30,Math.min(58,cl*.42))):18,lx=wide?Math.max(Math.round(Wr*.8),Math.round(cl/2)):10;
  // спираль — в левом нижнем углу первого экрана, внешний конец уходит вниз
  const hr=hero.getBoundingClientRect(),hb=Y(hr)+hr.height,R=wide?Math.round(Math.min(220,W*.15)):78,C=[wide?Math.round(Math.max(R*.8,cl+R*.2)):Math.round(W*.2),Math.round(hb-(wide?R*.15:10))];
  const prev=LAND.P,P={R,C,Wr,th:Math.PI/2-Math.atan2(1,LPR.b),tw:prev?prev.tw:0,twTo:prev?prev.twTo:0,twD:null,wide};
  const sp=lpRspPts(Object.assign({},P,{tw:0})),n=sp.length-1,E=sp[n],tx=E[0]-sp[n-3][0],ty=E[1]-sp[n-3][1],tl=Math.hypot(tx,ty)||1;
  // узлы реки — на границах блоков, по очереди у правого и левого поля; между ними плавная волна через страницу (вниз без подъёмов)
  const secs=['emb','who','change','features','shots','new','video','start','security','faq','lead'].map(id=>$('#lp-'+id,el)).filter(Boolean);if(!secs.length)return;
  const ft=$('.lp-foot',el),nodes=secs.map((s,i)=>{const r=s.getBoundingClientRect();return [i%2?lx:W-lx,i===secs.length-1&&ft?Y(ft.getBoundingClientRect())-Wr*.6:Y(r)+r.height]});
  let d=`M${f(E[0])} ${f(E[1])}`,x=E[0],y=E[1];
  nodes.forEach(([nx,ny],i)=>{if(ny<=y+20)return;const dy=ny-y;d+=i===0||x===E[0]&&y===E[1]?`C${f(x+tx/tl*Math.min(dy*.5,R*1.4))} ${f(y+ty/tl*Math.min(dy*.5,R*1.4))} ${f(nx)} ${f(ny-dy*.6)} ${f(nx)} ${f(ny)}`:`C${f(x)} ${f(y+dy*.62)} ${f(nx)} ${f(ny-dy*.62)} ${f(nx)} ${f(ny)}`;x=nx;y=ny});
  ['.lp-p0','.lp-p1','.lp-p2','.lp-p3'].forEach(s=>$(s,svg).setAttribute('d',d));
  $('.lp-p0',svg).style.strokeWidth=$('.lp-p1',svg).style.strokeWidth=Wr+'px';$('.lp-p2',svg).style.strokeWidth=Math.round(Wr*.42)+'px';$('.lp-p3',svg).style.strokeWidth=$('.lp-sp-c',svg).style.strokeWidth=(wide?2.2:1.4)+'px';
  // точки реки сверху вниз — где вода на любой высоте; по ним солнце идёт за кончиком
  const poly=lpPoly();poly.add(d);const {px,py}=poly.pts(),ys=Float32Array.from(py);for(let i=1;i<ys.length;i++)if(ys[i]<ys[i-1])ys[i]=ys[i-1];
  const g=$('.lp-knots',svg);g.innerHTML=nodes.map(([a,b])=>`<circle cx="${f(a)}" cy="${f(b)}" r="${wide?5:3}"/>`).join('');
  Object.assign(P,{xs:Float32Array.from(px),ys,y0:E[1]+Wr*.5,yEnd:y,rc:$('.lp-rc',svg),sun:$('.lp-psun',svg),spf:$('.lp-sp-f',svg),spc:$('.lp-sp-c',svg),knots:[...g.children].map((k,i)=>({y:nodes[i][1],el:k}))});
  P.rc.setAttribute('width',W+200);P.cur=prev&&prev.cur!=null?Math.max(P.y0,Math.min(prev.cur,P.yEnd)):P.y0;P.to=P.cur;LAND.P=P;landSpiralDraw();landLineSet();landTick(el);
  if(LAND.grow){LAND.grow=0;landGrow(el)}}
// Где река на высоте y (река идёт только вниз — поиск делением пополам)
function lpRiverX(P,y){const ys=P.ys;let a=0,b=ys.length-1;if(b<0)return 0;if(y<=ys[0])return P.xs[0];if(y>=ys[b])return P.xs[b];while(b-a>1){const m=(a+b)>>1;if(ys[m]<y)a=m;else b=m}const t=ys[b]>ys[a]?(y-ys[a])/(ys[b]-ys[a]):0;return P.xs[a]+(P.xs[b]-P.xs[a])*t}
// Кончик воды: cur — докуда дошла вода; солнце на кончике, узлы загораются, когда вода их прошла
function landLineSet(){const P=LAND.P;if(!P)return;P.rc.setAttribute('height',Math.max(0,P.cur).toFixed(1));
  P.sun.setAttribute('transform',`translate(${lpRiverX(P,P.cur).toFixed(1)} ${P.cur.toFixed(1)})${P.wide?'':' scale(.6)'}`);P.sun.classList.toggle('end',P.cur>=P.yEnd-2);
  P.knots.forEach(k=>k.el.classList.toggle('on',P.cur>=k.y-1));landSpiralDraw()}
// Плавность: вода и закрутка спирали догоняют прокрутку по времени, а не по кадрам — одинаково на 60 и 120 Гц
function landLineRun(t){LAND.lraf=0;const P=LAND.P;if(!P)return;const dt=P.t0?Math.min(64,t-P.t0):16;P.t0=t;const k=1-Math.exp(-dt/170);let mv=false;
  if(Math.abs(P.to-P.cur)>.4){P.cur+=(P.to-P.cur)*k;mv=true}else P.cur=P.to;
  if(Math.abs(P.twTo-P.tw)>.003){P.tw+=(P.twTo-P.tw)*k;mv=true}else P.tw=P.twTo;
  landLineSet();if(mv)LAND.lraf=requestAnimationFrame(landLineRun);else P.t0=0}
// Спираль вырастает из знака в шапке: сначала она размером со знак на его месте, потом плавно увеличивается и ложится на фон
function landGrow(el){const page=$('#land-page',el),g=$('.lp-rsp',el),lg=$('.lp-logo .logo',el),P=LAND.P;if(!page||!g||!lg||!P||page.scrollTop>40)return;
  const pr=page.getBoundingClientRect(),r=lg.getBoundingClientRect();if(!r.height)return;const lx=r.left-pr.left+r.width*.376,ly=r.top-pr.top+page.scrollTop+r.height*.548,k=Math.max(.02,r.height*.4/P.R);
  const svg=$('#lp-path',el);svg.classList.add('growing');clearTimeout(LAND.gt);LAND.gt=setTimeout(()=>svg.classList.remove('growing'),1500);
  g.classList.remove('grow');g.classList.add('small');g.style.transform=`translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) scale(${k.toFixed(4)}) translate(${-P.C[0]}px,${-P.C[1]}px)`;void g.getBoundingClientRect();
  requestAnimationFrame(()=>{g.classList.add('grow');g.classList.remove('small');g.style.transform=`translate(0px,0px) scale(1) translate(0px,0px)`})}
function landTick(el){const page=$('#land-page',el);if(!page)return;const st=page.scrollTop,vh=page.clientHeight,H=page.scrollHeight,anim=page.classList.contains('lp-anim');
  const P=LAND.P;if(P){if(anim){const q=Math.min(1,st/Math.max(1,H-vh));P.to=Math.max(P.y0,Math.min(P.yEnd,st+vh*(.72+.28*q)));P.twTo=-Math.min(st,2400)*.0034;if(!LAND.lraf)LAND.lraf=requestAnimationFrame(landLineRun)}
    else{P.to=P.cur=P.yEnd;P.tw=P.twTo=0;landLineSet()}}
  const ring=$('#lp-bal .b1');if(ring){const q=H>vh?Math.min(1,st/(H-vh)):1;ring.style.strokeDashoffset=q>.002?(1-q).toFixed(4):'1.1'};
  if(!anim)return;
  // «Как это выглядит»: экран раскрывается, пока блок въезжает
  const tl=$('.lp-tilt',el);if(tl){const r=tl.getBoundingClientRect(),pr=page.getBoundingClientRect(),p=Math.max(0,Math.min(1,(pr.bottom-r.top)/(vh*.75)));tl.style.setProperty('--tp',p.toFixed(3))}
  // «Как начать»: линия шагов заполняется, номера загораются
  const sw=$('.lp-steps-w',el);if(sw){const r=sw.getBoundingClientRect(),pr=page.getBoundingClientRect(),p=Math.max(0,Math.min(1,(pr.top+vh*.72-r.top)/Math.max(1,r.height*.85))),li=$$('.lp-steps li',sw);sw.style.setProperty('--sp',p.toFixed(3));li.forEach((x,i)=>x.classList.toggle('on',p>=i/Math.max(1,li.length-1)-.01))}}
// Линия шагов «Как начать» — от первого номера до последнего (на ПК поперёк, на телефоне вдоль)
function landStepsLine(el){const sw=$('.lp-steps-w',el),ln=$('.lp-sline',el);if(!sw||!ln)return;const nm=$$('.lp-num',sw);if(nm.length<2)return;const R=sw.getBoundingClientRect(),a=nm[0].getBoundingClientRect(),b=nm[nm.length-1].getBoundingClientRect();
  const ax=a.left+a.width/2-R.left,ay=a.top+a.height/2-R.top,bx=b.left+b.width/2-R.left,by=b.top+b.height/2-R.top,h=Math.abs(by-ay)<4;
  ln.dataset.o=h?'h':'v';Object.assign(ln.style,h?{left:ax+'px',top:(ay-1.5)+'px',width:(bx-ax)+'px',height:'3px'}:{left:(ax-1.5)+'px',top:ay+'px',width:'3px',height:(by-ay)+'px'})}
function landFx(el){landFxStop();const page=$('#land-page',el);if(!page)return;const anim=!landRM()&&'IntersectionObserver' in window;page.classList.toggle('lp-anim',anim);
  const tm=(f,ms)=>{const t=setTimeout(f,ms);LAND.tm.push(t);return t};
  const emb=$('#lp-emb',el),svg=emb&&$('.lp-emb-svg',emb);
  const onIn=x=>{if(x.dataset.lpCount)landCount(x);if(x.matches('.lp-tile'))tm(()=>landTileFx(x),450+(+x.style.getPropertyValue('--d')||0)*80);if(x===emb)tm(()=>emb.classList.add('e-idle'),3900);if(x.matches('.lp-fc'))tm(()=>x.classList.add('now'),900+(+x.style.getPropertyValue('--d')||0)*260)};
  const go=()=>{if(!LAND.open)return;if(anim){if(LAND.P)landGrow(el);else LAND.grow=1;LAND.rv=new IntersectionObserver(en=>en.forEach(x=>{const t=x.target;if(t.classList.contains('lp-live'))t.classList.toggle('vis',x.isIntersecting);
      if(x.isIntersecting&&!t.classList.contains('in')){t.classList.add('in');onIn(t);if(!t.classList.contains('lp-live'))LAND.rv.unobserve(t)}}),{root:page,rootMargin:'0px 0px -12% 0px',threshold:0});
    $$('.rv,.lp-live,[data-lp-count]',page).forEach(x=>LAND.rv.observe(x))}
  else{$$('.rv,.lp-live',page).forEach(x=>x.classList.add('in','vis'));$$('.lp-fc',page).forEach(x=>x.classList.add('now'))}};
  if(LAND.intro&&anim)LAND.afterIntro=go;else go();
  // «Возможности»: значок оживает под мышью, а пока блок на экране — у плиток по очереди
  const tiles=$$('.lp-tile',page),feat=$('#lp-features',page);let fi=0;
  if(anim&&feat&&tiles.length){tiles.forEach(x=>x.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')landTileFx(x)}));
    LAND.tm.push(setInterval(()=>{if(!feat.classList.contains('vis')||document.hidden)return;const x=tiles[fi++%tiles.length];if(!x.matches(':hover'))landTileFx(x)},2300))}
  // Пересчёт линии при изменении размеров (окно, «Подробнее», шрифты)
  const calc=()=>{landStepsLine(el);landPathCalc(el)};let rt=0;const later=()=>{clearTimeout(rt);rt=tm(calc,140)};
  if('ResizeObserver' in window){LAND.ro=new ResizeObserver(later);LAND.ro.observe($('main',page))}requestAnimationFrame(calc);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(LAND.open)later()});
  // Весы в углу качаются от скорости прокрутки и снова выравниваются
  const bal=$('#lp-bal',el),bb=bal&&$('.bb',bal),bl=bal&&$('.bl',bal),br=bal&&$('.br',bal);let ang=0,v=0,last=page.scrollTop;
  const swing=()=>{v+=-ang*.09;v*=.86;ang+=v;if(Math.abs(ang)<.05&&Math.abs(v)<.05){ang=0;v=0;LAND.braf=0}else LAND.braf=requestAnimationFrame(swing);if(bb){bb.style.transform=`rotate(${ang.toFixed(2)}deg)`;bl.style.transform=br.style.transform=`rotate(${(-ang).toFixed(2)}deg)`}};
  page.addEventListener('scroll',()=>{const y=page.scrollTop,dy=y-last;last=y;if(anim&&bb&&dy){ang=Math.max(-16,Math.min(16,ang-Math.max(-2.2,Math.min(2.2,dy*.05))));if(!LAND.braf)LAND.braf=requestAnimationFrame(swing)}
    if(LAND.raf)return;LAND.raf=requestAnimationFrame(()=>{LAND.raf=0;landTick(el);const bg=$('.lp-hero-bg',el);if(anim&&bg&&y<1600)bg.style.transform=`translate3d(0,${(y*.3).toFixed(1)}px,0)`})},{passive:true});
  if(bal)bal.onclick=()=>page.scrollTo({top:0,behavior:landRM()?'auto':'smooth'});
  // Мышь над первым экраном чуть сдвигает солнце и картинку (только на ПК с мышью)
  const hero=$('#lp-hero',el);if(anim&&hero&&matchMedia('(hover:hover) and (pointer:fine)').matches)hero.onpointermove=e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5).toFixed(3));hero.style.setProperty('--my',((e.clientY-r.top)/r.height-.5).toFixed(3))};
  // Герб: нажатие на символ подсвечивает его и показывает, что он значит; весы взвешивают
  LAND.weigh=()=>{if(!svg)return;svg.classList.add('e-coins');if(!anim)return;svg.classList.remove('e-weigh');void svg.getBoundingClientRect();svg.classList.add('e-weigh');clearTimeout(LAND.wt);LAND.wt=setTimeout(()=>svg.classList.remove('e-weigh'),2700)};
  if(svg)svg.onclick=e=>{const p=e.target.closest('.e-part');if(p)landEmbPick(el,p.dataset.e,true)}}
function landEmbPick(el,k,from){const emb=$('#lp-emb',el);if(!emb)return;const cur=emb.dataset.hl||'',nk=cur===k&&!from?'':k;emb.dataset.hl=nk;$$('[data-lp-emb]',emb).forEach(b=>b.setAttribute('aria-pressed',b.dataset.lpEmb===nk));if(nk==='scales'&&LAND.weigh)LAND.weigh()}
