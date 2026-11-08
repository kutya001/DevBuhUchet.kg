'use strict';
// Лендинг buhuchet.kg для гостей (ТЗ «Лендинг — buhuchet.kg для гостей», решение заказчика 01.11.2026)
/* ═════════════ Лендинг ═════════════ */
// В прототипе открывается поверх программы по адресу #landing и ссылкой «О платформе» на экране входа. Все тексты — группа «Лендинг» в «Локализации» (Админка)
const LAND={open:false,back:'',title0:'',test:false,netErr:false,sent:null,menu:false,shot:0,io:null,vis:{},rv:null,tm:[],raf:0};
const LT=(k,v)=>{const x=L10N.find(y=>y.key===k);let t=x?x.ru:'';if(v)Object.entries(v).forEach(([a,b])=>{t=t.split('{'+a+'}').join(b)});return t};
const LE=(k,v)=>esc(LT(k,v));
const landRM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
// #landing/lead — сразу к форме заявки (так «Оставить заявку» из демо-организации открывает лендинг). В демо-версии для сайта лендинга нет: переход на страницу сайта
function landRoute(){const h=location.hash;if(h!=='#landing'&&h!=='#landing/lead')return false;if(DEMO.build){location.replace(BU_DEMO.site);return true}
  if(DEMO.on)demoOff();landShow();if(h==='#landing/lead'){history.replaceState(history.state,'','#landing');setTimeout(()=>landGo('lead',!LAND.sent),60)}return true}
function landShow(){let el=$('#land');if(!el){el=document.createElement('div');el.id='land';el.className='land';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Лендинг buhuchet.kg');document.body.append(el)}
  if(!LAND.open){LAND.back=S.mod?'#'+S.mod+(S.tab?'.'+S.tab:''):'#home';LAND.title0=document.title;LAND.sent=null;LAND.shot=0}
  LAND.open=true;el.hidden=false;document.body.classList.add('land-on');document.title=LT('land.title');landTheme0();landDraw()}
// Тема лендинга: по умолчанию светлая (Кутман 02.11.2026); выбор кнопкой запоминается так же, как кнопкой темы в программе
const landThemeSaved=()=>{try{const t=localStorage.getItem(BU_P+'theme');return t==='light'||t==='dark'}catch(e){return false}};
function landTheme0(){if(!landThemeSaved()){document.documentElement.setAttribute('data-theme','light');LAND.themeTmp=true}}
function landTheme1(){if(LAND.themeTmp&&!landThemeSaved())document.documentElement.removeAttribute('data-theme');LAND.themeTmp=false;if($('#theme'))paintTheme()}
function landThemeToggle(){const t=effTheme()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',t);store.set('theme',t);try{localStorage.setItem(BU_P+'theme',t)}catch(e){}LAND.themeTmp=false;
  $$('[data-lp-theme]').forEach(b=>b.innerHTML=ic(t==='dark'?'sun':'moon'));if($('#theme'))paintTheme()}
function landHide(){const el=$('#land');if(el)el.hidden=true;if(LAND.open)landTheme1();document.body.classList.remove('land-on');if(LAND.open)document.title=LAND.title0;LAND.open=false;LAND.menu=false;if(LAND.io){LAND.io.disconnect();LAND.io=null}landFxStop()}
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

function landDraw(){const el=$('#land');if(!el||!LAND.open)return;const D=landDemo(),N=landNums();
  const nav=[['features','land.nav.features'],['start','land.nav.start'],['security','land.nav.security'],['faq','land.nav.faq']].map(([id,k])=>`<button type="button" data-lp-go="${id}">${LE(k)}</button>`).join('');
  const bar=`<div class="pub-bar land-bar"><span class="pub-proto">${ic('eye','sm')}<span>Прототип: страница, которую гость видит на buhuchet.kg без входа</span></span><span class="pub-url">${ic('lock','sm')}<span class="mono">${LAND.test?'test.buhuchet.kg':'buhuchet.kg'}</span></span><label class="lp-pt"><input type="checkbox" id="lp-test" ${LAND.test?'checked':''}>Тестовый стенд</label><label class="lp-pt"><input type="checkbox" id="lp-net" ${LAND.netErr?'checked':''}>Нет связи при отправке</label><button type="button" class="btn sm" id="land-x">${ic('x','sm')}${S.loggedIn===false?'Вернуться ко входу':'Вернуться в программу'}</button></div>`;
  const head=`<header class="lp-head"><div class="lp-wrap lp-head-in"><button type="button" class="lp-logo" data-lp-top aria-label="Buhuchet.kg — в начало страницы">${landLogo()}<span><span class="lp-bn">Buhuchet.kg</span><span class="lp-bs">${LE('land.brand.sub')}</span></span></button>
    <nav class="lp-nav" aria-label="Разделы страницы">${nav}</nav><div class="lp-head-r"><button type="button" class="linkbtn lp-demo-l lp-hide-m" data-lp-demo>${LE('land.nav.demo')}</button><button type="button" class="icon-btn lp-theme" data-lp-theme aria-label="${LE('land.btn.theme')}" title="${LE('land.btn.theme')}">${ic(effTheme()==='dark'?'sun':'moon')}</button><button type="button" class="btn" data-lp-login>${LE('land.btn.login')}</button><button type="button" class="btn cta lp-hide-m" data-lp-lead>${LE('land.btn.lead')}</button><button type="button" class="icon-btn lp-burger" data-lp-menu aria-expanded="${LAND.menu}" aria-controls="lp-menu" aria-label="${LE('land.btn.menu')}">${ic(LAND.menu?'x':'menu')}</button></div></div>
    <div class="lp-prog" aria-hidden="true"><i id="lp-prog"></i></div><div class="lp-menu" id="lp-menu" ${LAND.menu?'':'hidden'}><nav aria-label="Разделы страницы">${nav}</nav><button type="button" class="btn cta" data-lp-lead>${LE('land.btn.lead')}</button><button type="button" class="btn" data-lp-demo>${LE('land.btn.demo')}</button></div></header>`;
  const hero=`<section class="lp-hero lp-live" id="lp-hero">${landHeroBg()}<div class="lp-wrap lp-hero-in"><div><h1 class="rv">${LE('land.hero.title')}</h1><p class="lp-hero-p rv" style="--d:1">${LE('land.hero.sub')}</p><div class="lp-cta-row rv" style="--d:2"><button type="button" class="btn cta lp-lg" data-lp-lead>${LE('land.btn.lead')}</button><button type="button" class="btn lp-lg" data-lp-demo>${LE('land.btn.demo')}</button></div><button type="button" class="linkbtn lp-more rv" style="--d:3" data-lp-go="features">${LE('land.btn.more')}${ic('down','sm')}</button><p class="lp-note rv" style="--d:4">${ic('check','sm')}<span>${LE('land.hero.note')}</span></p></div>
    <div class="lp-hero-pic" role="img" aria-label="Экран «Отчеты для сдачи» на компьютере и на телефоне">${lshDesk(D,true)}${lshPhone(D)}<div class="lp-toast" id="lp-toast" aria-hidden="true"></div></div></div></section>`;
  const stats=`<section class="lp-stats" aria-label="Buhuchet.kg в цифрах"><div class="lp-wrap lp-stats-in"><div class="lp-stat rv"><b data-lp-count="${N.types}">${N.types}</b><span>${LE('land.stats.types')}</span></div><div class="lp-stat rv" style="--d:1"><b data-lp-count="${N.regimes}">${N.regimes}</b><span>${LE('land.stats.regimes')}</span></div><div class="lp-stat rv" style="--d:2"><span class="lp-si">${ic('calendar')}</span><strong>${LE('land.stats.cal')}</strong><span>${LE('land.stats.cal.sub')}</span></div><div class="lp-stat rv" style="--d:3"><span class="lp-si">${ic('bell')}</span><strong>${LE('land.stats.remind')}</strong></div></div></section>`;
  const card=(icn,cls,t,d,n=0)=>`<div class="lp-card rv" style="--d:${n%3}"><span class="lp-ico ${cls}">${ic(icn)}</span><h3>${t}</h3><p>${d}</p></div>`;
  const who=`<section class="lp-sec alt" id="lp-who"><div class="lp-wrap"><h2 class="rv">${LE('land.who.title')}</h2><div class="lp-grid3">${[['building',''],['user','g'],['chart','p']].map(([i,c],n)=>card(i,c,LE(`land.who.${n+1}.t`),LE(`land.who.${n+1}.d`),n)).join('')}</div></div></section>`;
  const chg=`<section class="lp-sec" id="lp-change"><div class="lp-wrap"><h2 class="rv">${LE('land.change.title')}</h2><div class="lp-chg"><div class="lp-chg-h"><span>${LE('land.change.was')}</span><span>${LE('land.change.now')}</span></div>${[1,2,3,4].map(n=>`<div class="lp-chg-r rv" style="--d:${n-1}"><div class="lp-was">${ic('x','sm')}<span><span class="sr-only">${LE('land.change.was')}: </span><span class="lp-x">${LE(`land.change.${n}.a`)}</span></span></div><div class="lp-arr" aria-hidden="true">${ic('right')}</div><div class="lp-now">${ic('check','sm')}<span><span class="sr-only">${LE('land.change.now')}: </span>${LE(`land.change.${n}.b`)}</span></div></div>`).join('')}</div></div></section>`;
  const FI=['repeat','calendar','tag','tg','task','coins','wallet','link','gauge','folder','shield','grad'],FC=['','g','p','','y','g','p','','y','g','p',''];
  const feat=`<section class="lp-sec alt" id="lp-features"><div class="lp-wrap"><h2 class="rv">${LE('land.feat.title')}</h2><div class="lp-grid3">${FI.map((i,n)=>card(i,FC[n],LE(`land.feat.${n+1}.t`),LE(`land.feat.${n+1}.d`),n)).join('')}</div></div></section>`;
  const shots=[lshDesk(D),lshCard(D),lshPhone(D)];
  const shot=`<section class="lp-sec" id="lp-shots"><div class="lp-wrap"><h2 class="rv">${LE('land.shots.title')}</h2><div class="lp-tabs" role="tablist" aria-label="${LE('land.shots.title')}">${[1,2,3].map(n=>`<button type="button" role="tab" id="lp-st-${n-1}" aria-controls="lp-sl-${n-1}" aria-selected="${LAND.shot===n-1}" data-lp-shot="${n-1}">${LE(`land.shots.${n}.t`)}</button>`).join('')}</div>
    <div class="lp-track rv" id="lp-track">${shots.map((h,i)=>`<figure class="lp-slide" id="lp-sl-${i}" role="tabpanel" aria-labelledby="lp-st-${i}"><div role="img" aria-label="${LE(`land.shots.${i+1}.t`)}" style="width:100%;display:flex;justify-content:center">${h}</div><figcaption>${LE(`land.shots.${i+1}.d`)}</figcaption></figure>`).join('')}</div><div class="lp-shots-cta"><button type="button" class="btn lp-lg" data-lp-demo>${ic('eye','sm')}${LE('land.btn.demo')}</button></div></div></section>`;
  const start=`<section class="lp-sec alt" id="lp-start"><div class="lp-wrap"><h2 class="rv">${LE('land.start.title')}</h2><ol class="lp-steps">${[1,2,3,4].map(n=>`<li class="rv" style="--d:${n-1}"><span class="lp-num" aria-hidden="true">${n}</span><h3>${LE(`land.start.${n}.t`)}</h3><p>${LE(`land.start.${n}.d`)}</p></li>`).join('')}</ol></div></section>`;
  const SI=['shield','key','users','history','archive']; // пункт «Серверы в Европе (Франкфурт)…» убран (Кутман 02.11.2026)
  const sec=`<section class="lp-sec" id="lp-security"><div class="lp-wrap"><h2 class="rv">${LE('land.sec.title')}</h2><ul class="lp-secl">${SI.map((i,n)=>`<li class="rv" style="--d:${n}">${ic(i)}<span>${LE(`land.sec.${n+1}`)}</span></li>`).join('')}</ul></div></section>`;
  const faq=`<section class="lp-sec alt" id="lp-faq"><div class="lp-wrap"><h2 class="rv">${LE('land.faq.title')}</h2><div class="lp-faq">${[1,2,3,4,5,6,7].map(n=>`<details class="rv" style="--d:${Math.min(n-1,4)}"><summary>${LE(`land.faq.${n}.q`)}</summary><p>${LE(`land.faq.${n}.a`)}</p></details>`).join('')}</div></div></section>`;
  const cont=landContacts();
  const lead=`<section class="lp-sec" id="lp-lead"><div class="lp-wrap"><h2 class="rv">${LE('land.lead.title')}</h2><p class="lp-sub">${LE('land.lead.sub')}</p><div class="lp-lead-in rv"><div id="lp-fbox">${LAND.sent?landOkHtml():landFormHtml()}</div>${cont.length?`<div class="lp-cont"><h3>${LE('land.c.title')}</h3>${cont.join('')}</div>`:''}</div></div></section>`;
  const foot=`<footer class="lp-foot"><div class="lp-wrap lp-foot-in"><span><b>${LE('land.foot.name')}</b><br>${LE('land.foot.copy',{год:TODAY.slice(0,4)})}</span>${cont.length?`<span class="lp-foot-l">${cont.join('')}</span>`:''}<span class="lp-foot-l"><button type="button" class="linkbtn" data-lp-login>${LE('land.btn.login')}</button><button type="button" class="linkbtn" data-lp-consent>${LE('land.consent.title')}</button></span></div></footer>`;
  const fab=`<div class="lp-fab" id="lp-fab" hidden><button type="button" class="btn cta" data-lp-lead>${LE('land.btn.lead')}</button></div>`;
  el.innerHTML=bar+`<div class="land-page" id="land-page">${LAND.test?`<div class="lp-test">${LE('land.test')}</div>`:''}${head}<main>${hero}${stats}${landEmbSec()}${who}${chg}${feat}${shot}${start}${sec}${faq}${lead}</main>${foot}${fab}</div>`;
  landBind(el)}
const landFormHtml=()=>{const opts=LT('land.f.size.opts').split('|').map(s=>s.trim()).filter(Boolean);
  return `<form class="lp-form" id="lp-form" novalidate autocomplete="on">${fld(LE('land.f.name'),inp('lf-name','','autocomplete="name" maxlength="120"'),{req:true,id:'lf-name'})}${fld(LE('land.f.firm'),inp('lf-firm','','autocomplete="organization" maxlength="160"'),{req:true,id:'lf-firm',hint:LE('land.f.firm.hint')})}
    ${fld(LE('land.f.phone'),phoneInput('lf-phone',null),{req:true,id:'lf-phone'})}${fld(LE('land.f.size'),sel('lf-size',[['',LT('land.f.size.ph')],...opts.map(o=>[o,o])],''),{req:true,id:'lf-size'})}
    ${fld(LE('land.f.tg'),inp('lf-tg','',`autocomplete="off" maxlength="64" placeholder="${LE('land.f.tg.ph')}"`),{id:'lf-tg'})}<div></div>
    ${fld(LE('land.f.note'),`<textarea class="inp" id="lf-note"></textarea>`,{id:'lf-note',full:true,hint:'До 1 000 знаков'})}
    <div class="lp-hp" aria-hidden="true"><label for="lf-site">Сайт</label><input id="lf-site" tabindex="-1" autocomplete="off"></div>
    <div class="fld lp-check-f" data-f="lf-ok"><label class="lp-check"><input type="checkbox" id="lf-ok"><span>${LE('land.f.consent.a')} <button type="button" class="linkbtn" data-lp-consent style="display:inline;padding:0">${LE('land.f.consent.b')}</button></span></label><div class="err" hidden></div></div>
    <div class="note bad" id="lf-msg" role="alert" hidden></div><div class="lp-send"><button type="submit" class="btn cta lp-lg" id="lf-send">${LE('land.f.send')}</button></div></form>`};
const landOkHtml=()=>`<div class="lp-ok" role="status">${ic('check')}<span>${LE('land.ok',{телефон:LAND.sent})}</span></div>`;
function landGo(id,focus){const t=$('#lp-'+id);if(!t)return;if(LAND.menu){LAND.menu=false;landMenuSync()}t.scrollIntoView({behavior:landRM()?'auto':'smooth',block:'start'});
  if(focus){const f=$('#lf-name');if(f)setTimeout(()=>f.focus({preventScroll:true}),landRM()?0:450)}}
function landMenuSync(){const el=$('#land');if(!el)return;const m=$('#lp-menu',el),b=$('[data-lp-menu]',el);if(m)m.hidden=!LAND.menu;if(b){b.setAttribute('aria-expanded',LAND.menu);b.innerHTML=ic(LAND.menu?'x':'menu')}}
function landShotSync(){$$('[data-lp-shot]').forEach(b=>b.setAttribute('aria-selected',+b.dataset.lpShot===LAND.shot))}
function landConsent(){openModal({render:()=>({title:LE('land.consent.title'),body:`<p style="margin:0;line-height:1.55">${LE('land.consent.text')}</p>`,foot:'<button class="btn cta" data-close>Понятно</button>'})})}
function landBind(el){const page=$('#land-page',el);
  $('#land-x',el).onclick=landClose;
  $('#lp-test',el).onchange=e=>{LAND.test=e.target.checked;const top=page.scrollTop;landDraw();$('#land-page').scrollTop=top};
  $('#lp-net',el).onchange=e=>{LAND.netErr=e.target.checked};
  page.onclick=e=>{const b=e.target.closest('[data-lp-go],[data-lp-lead],[data-lp-login],[data-lp-top],[data-lp-menu],[data-lp-consent],[data-lp-shot],[data-lp-demo],[data-lp-theme]');if(!b)return;const d=b.dataset;if(d.lpDemo!=null)return demoOpen();if(d.lpTheme!=null)return landThemeToggle();
    if(d.lpGo)return landGo(d.lpGo);if(d.lpLead!=null)return landGo('lead',!LAND.sent);if(d.lpLogin!=null)return landLogin();if(d.lpConsent!=null){e.preventDefault();return landConsent()}
    if(d.lpTop!=null){if(LAND.menu){LAND.menu=false;landMenuSync()}return page.scrollTo({top:0,behavior:landRM()?'auto':'smooth'})}
    if(d.lpMenu!=null){LAND.menu=!LAND.menu;return landMenuSync()}
    if(d.lpShot!=null){LAND.shot=+d.lpShot;landShotSync();const tr=$('#lp-track',el);tr.scrollTo({left:LAND.shot*tr.clientWidth,behavior:landRM()?'auto':'smooth'})}};
  el.onkeydown=e=>{if(e.key==='Escape'&&LAND.menu){LAND.menu=false;landMenuSync();const b=$('[data-lp-menu]',el);if(b)b.focus()}};
  // На телефоне снимки листаются свайпом; вкладка над снимками следует за прокруткой
  const tr=$('#lp-track',el);if(tr){if(LAND.shot)tr.scrollLeft=LAND.shot*tr.clientWidth;tr.onscroll=()=>{const i=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth));if(i!==LAND.shot){LAND.shot=i;landShotSync()}}}
  // На телефоне после первого экрана внизу закреплена «Оставить заявку»; над блоком «Оставить заявку» она скрывается
  if(LAND.io)LAND.io.disconnect();LAND.vis={'lp-hero':true,'lp-lead':false};const fab=$('#lp-fab',el);
  if('IntersectionObserver' in window){LAND.io=new IntersectionObserver(en=>{en.forEach(x=>LAND.vis[x.target.id]=x.isIntersecting);fab.hidden=LAND.vis['lp-hero']||LAND.vis['lp-lead']},{root:page,threshold:0});['lp-hero','lp-lead'].forEach(id=>LAND.io.observe($('#'+id,el)))}
  landFormBind(el);landFx(el)}
function landFormBind(el){const f=$('#lp-form',el);if(!f)return;bindPhone(f,'lf-phone');
  const clr=id=>()=>setErr(f,id,'');['lf-name','lf-firm','lf-phone','lf-tg','lf-note'].forEach(id=>{const i=$('#'+id,f);if(i)i.addEventListener('input',clr(id))});$('#lf-size',f).onchange=clr('lf-size');$('#lf-ok',f).onchange=clr('lf-ok');
  f.onsubmit=e=>{e.preventDefault();const btn=$('#lf-send',f);if(btn.disabled)return;const msg=$('#lf-msg',f);msg.hidden=true;
    const v={name:val(f,'lf-name'),firm:val(f,'lf-firm'),size:val(f,'lf-size'),tg:val(f,'lf-tg'),note:$('#lf-note',f).value.trim()};const p=readPhone(f,'lf-phone');
    const ok=[setErr(f,'lf-name',v.name?'':LT('land.e.name')),setErr(f,'lf-firm',v.firm?'':LT('land.e.firm')),setErr(f,'lf-phone',p.ok?'':LT('land.e.phone',{цифр:p.need})),setErr(f,'lf-size',v.size?'':LT('land.e.size')),setErr(f,'lf-note',v.note.length>1000?LT('land.e.note'):''),setErr(f,'lf-ok',$('#lf-ok',f).checked?'':LT('land.e.consent'))];
    if(!ok.every(Boolean)){const b=f.querySelector('.fld.bad input,.fld.bad select,.fld.bad textarea');if(b)b.focus();return}
    v.phone=p.ph;const trap=!!$('#lf-site',f).value;
    btn.disabled=true;btn.textContent=LT('land.f.sending');
    // Отправка заявки — единственный запрос лендинга к серверу; в прототипе — пауза и запись в TemDB
    setTimeout(()=>{if(!LAND.open)return;
      if(LAND.netErr){btn.disabled=false;btn.textContent=LT('land.f.send');msg.hidden=false;msg.innerHTML=ic('alert','sm')+`<span>${LE('land.e.net')}</span>`;return}
      // Поле-ловушка заполнено (так делают боты): заявка не сохраняется, ответ — обычное «Спасибо!»
      const o=trap?null:leadAdd(v);LAND.sent=fmtPhone(v.phone);$('#lp-fbox').innerHTML=landOkHtml();if(o)leadTgPreview(o.dup?o.lead:o,!!o.dup)},700)}}
// Новая заявка: повтор с тем же телефоном в течение суток новой не создаётся — комментарий дописывается к первой заявке
function leadAdd(v){const day=Date.now()-24*36e5,at=nowStamp();const dup=LEADS.find(x=>x.phone&&x.phone.digits===v.phone.digits&&stAt(x.at)>=day);
  if(dup){if(v.note)dup.note=(dup.note?dup.note+'\n':'')+v.note;leadLog(dup,'Повторная заявка с того же телефона'+(v.note?': комментарий дописан':''),'guest');leadNotify();dbSoon();return {dup:true,lead:dup}}
  const id='L'+(Math.max(0,...LEADS.map(x=>+String(x.id).slice(1)||0))+1);
  const o={id,at,name:v.name,firm:v.firm,phone:v.phone,size:v.size,tg:v.tg,note:v.note,status:'Новая',org:null,adminNote:'',hist:[{at,who:'guest',what:'Заявка с сайта'+(LAND.test?' (тестовый стенд)':'')}],_cb:'guest',_ca:at,_ub:'guest',_ua:at};
  LEADS.unshift(o);leadNotify();dbSoon();return o}
// Сообщение администраторам платформы в Telegram в прототипе показывается окном предпросмотра
function leadTgPreview(o,rep){const to=leadAdmins();openModal({render:()=>({title:'Прототип: сообщение в Telegram',sub:LAND.test?'Тестовый стенд: от бота стенда администраторам стенда, в Telegram рабочего сайта не уходит':'Администраторам платформы с привязанным Telegram',
  body:`${to.length?'':`<div class="note warn">${ic('alert')}<span>Сообщение некому отправить: ни у одного администратора платформы не привязан Telegram. Над вкладкой «Заявки» — предупреждение.</span></div>`}<div class="lp-tg"><div class="row" style="gap:8px;color:var(--muted);font-size:12.5px">${ic('tg','sm')}<b>${LAND.test?'Бот тестового стенда':'Бот платформы'}</b>${to.length?`<span>→ ${to.map(u=>esc(u.tg)).join(', ')}</span>`:''}</div><div class="box" style="white-space:pre-wrap">${esc(leadTgText(o,rep))}</div></div><div class="note">${ic('info')}<span>Шаблон «${rep?'Telegram: повторная заявка с сайта':'Telegram: новая заявка с сайта'}» — Админка → Справочники платформы → Шаблоны.${to.length?' Отправка записана в журнал «Телеграм» с типом «Заявка с сайта».':''} Заявка — в Админке → «Организации» → «Заявки».</span></div>`,
  foot:'<button class="btn ghost" data-close>Закрыть</button><button class="btn cta" id="lp-adm">Открыть «Заявки» в Админке</button>',mount(el,m){$('#lp-adm',el).onclick=()=>{m.close();landToAdmin()}}})})}
function landToAdmin(){landHide();const lg=$('#login');if(lg)lg.remove();S.loggedIn=true;if(S.me!=='admin')switchUser('admin');go('orgs','leads')}

/* ═════════════ Анимации лендинга: отсылки к гербу бухгалтеров (v78, Кутман 08.11.2026) ═════════════ */
// Герб бухгалтерской профессии: солнце — учёт освещает дела, весы — баланс, кривая Бернулли (∞) — учёт вечен; на ленте девиз «Science · Conscience · Indépendance».
// Спираль логотипа — тоже кривая Бернулли (логарифмическая спираль): на лендинге она рисуется от центра, как растёт.
// Анимации только без «уменьшить движение» (класс lp-anim на странице); без него всё нарисовано сразу и стоит на месте
const lpMask=(id,cls)=>`<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-4" y="6" width="76" height="62"><path class="lp-draw ${cls||''}" d="${LOGO_SVG.cl}" pathLength="1"/></mask></defs>`;
const landLogo=()=>`<svg class="logo lp-logo-a" viewBox="${LOGO_SVG.vb}" aria-hidden="true" focusable="false">${lpMask('lp-lgm')}<path class="lg-sp" mask="url(#lp-lgm)" d="${LOGO_SVG.sp}"/><g class="lp-lg-l"><path class="lg-l" transform="${LOGO_SVG.b[0]}" d="${LOGO_SVG.b[1]}"/><path class="lg-l" transform="${LOGO_SVG.u[0]}" d="${LOGO_SVG.u[1]}"/></g></svg>`;
// Фон первого экрана: солнце с лучами справа сверху и большая спираль логотипа
const landHeroBg=()=>`<div class="lp-hero-bg" aria-hidden="true"><span class="lp-hb-sun"></span><svg class="lp-hb-sp" viewBox="${LOGO_SVG.vb}" focusable="false">${lpMask('lp-hbm')}<path class="lg-sp" mask="url(#lp-hbm)" d="${LOGO_SVG.sp}"/></svg></div>`;
// Лемниската Бернулли (∞) с центром cx,cy и полушириной a, гладкая замкнутая линия; начинается в центре
function lpLem(cx,cy,a,n=24){const p=[];for(let i=0;i<n;i++){const t=Math.PI/2+2*Math.PI*i/n,s=Math.sin(t),c=Math.cos(t),d=1+s*s;p.push([cx+a*c/d,cy+a*s*c/d])}
  const f=q=>q[0].toFixed(1)+' '+q[1].toFixed(1);let d='M'+f(p[0]);
  for(let i=0;i<n;i++){const a0=p[(i-1+n)%n],a1=p[i],a2=p[(i+1)%n],a3=p[(i+2)%n];d+='C'+f([a1[0]+(a2[0]-a0[0])/6,a1[1]+(a2[1]-a0[1])/6])+' '+f([a2[0]-(a3[0]-a1[0])/6,a2[1]-(a3[1]-a1[1])/6])+' '+f(a2)}return d+'Z'}
// Герб: овал, вверху солнце, в середине весы с чашами «Дебет» и «Кредит», внизу ∞, по низу лента с девизом
function landEmblem(){const r=(i,l)=>{const a=i*Math.PI/6,x=Math.sin(a),y=-Math.cos(a);return `M${(150+x*27).toFixed(1)} ${(70+y*27).toFixed(1)}L${(150+x*l).toFixed(1)} ${(70+y*l).toFixed(1)}`};
  const lem=lpLem(150,277,46);
  const pan=(x,k,lab)=>`<g class="e-pan e-pan-${k}"><path class="e-str" d="M${x} 132L${x-22} 184M${x} 132L${x+22} 184"/><ellipse class="e-coin e-coin-${k}" cx="${x}" cy="180.5" rx="11" ry="3.8"/><path class="e-bowl" d="M${x-28} 184H${x+28}Q${x+24} 199 ${x} 199Q${x-24} 199 ${x-28} 184Z"/><text class="e-lab" x="${x}" y="217">${lab}</text></g>`;
  return `<svg class="lp-emb-svg" viewBox="0 0 300 360" role="img" aria-label="${LE('land.emb.aria')}" focusable="false"><defs><radialGradient id="lpe-glow"><stop offset="0" class="e-g0"/><stop offset="1" class="e-g1"/></radialGradient><path id="lpe-rib" d="M38 313Q150 349 262 313"/></defs>
    <ellipse class="e-bg" cx="150" cy="172" rx="132" ry="160"/><ellipse class="e-oval2" cx="150" cy="172" rx="123" ry="151" pathLength="1"/><ellipse class="e-oval" cx="150" cy="172" rx="132" ry="160" pathLength="1"/>
    <g class="e-part e-sun" data-e="sun"><circle class="e-glow" cx="150" cy="70" r="52" fill="url(#lpe-glow)"/><path class="e-rays" d="${[...Array(12)].map((_,i)=>r(i,i%2?35:41)).join('')}"/><circle class="e-core" cx="150" cy="70" r="19"/></g>
    <g class="e-part e-scales" data-e="scales"><path class="e-post" d="M150 126V240"/><path class="e-base" d="M124 250H176L167 239H133Z"/><g class="e-beam"><path class="e-bar" d="M64 132H236"/>${pan(64,'l',LE('land.emb.debit'))}${pan(236,'r',LE('land.emb.credit'))}<circle class="e-piv" cx="150" cy="132" r="5.5"/></g><circle class="e-top" cx="150" cy="119" r="4.5"/></g>
    <g class="e-part e-curve" data-e="curve"><path class="e-inf" d="${lem}" pathLength="1"/><path class="e-comet" d="${lem}" pathLength="1"/></g>
    <g class="e-rib"><path class="e-rib-end" d="M46 309L10 312L21 324L10 336L46 331Z"/><path class="e-rib-end" d="M254 309L290 312L279 324L290 336L254 331Z"/><path class="e-rib-b" d="M34 301Q150 337 266 301V324Q150 360 34 324Z"/><text class="e-motto" dy="3.4"><textPath href="#lpe-rib" startOffset="50%" text-anchor="middle">${LE('land.emb.motto')}</textPath></text></g></svg>`}
function landEmbSec(){const it=[['sun','s','sun'],['scales','w','scale'],['curve','c','infinity']];
  return `<section class="lp-sec lp-emb lp-live" id="lp-emb"><div class="lp-wrap"><h2 class="rv">${LE('land.emb.title')}</h2><p class="lp-sub rv">${LE('land.emb.sub')}</p><div class="lp-emb-in"><figure class="lp-emb-fig">${landEmblem()}<figcaption class="lp-emb-cap">${ic('scale','sm')}<span>${LE('land.emb.tap')}</span></figcaption></figure>
    <div class="lp-emb-r"><ul class="lp-emb-l">${it.map(([k,c,i],n)=>`<li class="rv" style="--d:${n}"><button type="button" data-lp-emb="${k}" aria-pressed="false"><span class="lp-emb-ic ${c}">${ic(i)}</span><span class="lp-emb-tx"><b>${LE(`land.emb.${n+1}.t`)}</b><span>${LE(`land.emb.${n+1}.d`)}</span></span></button></li>`).join('')}</ul><p class="lp-motto rv" style="--d:3"><span class="lp-motto-f">${LE('land.emb.motto')}</span><span>${LE('land.emb.motto.ru')}</span></p></div></div></div></section>`}
// Всплывающие сообщения поверх картинки первого экрана — из тех же демо-данных
function landToasts(){const D=landDemo(),nm=r=>D.cps[r.cp].name,out=[];
  const sd=D.reps.filter(r=>r.status==='Сдан'&&(r.subDate||'')<=TODAY).sort((a,b)=>(a.subDate||'')<(b.subDate||'')?1:-1)[0];if(sd)out.push(['check','g','Отчёт сдан',`${T[sd.t].short} · ${nm(sd)}`]);
  const nx=D.rows.find(r=>r.due>=TODAY);if(nx)out.push(['tg','b','Напоминание в Telegram',`Срок ${fmtD(nx.due)} · ${T[nx.t].short} · ${nm(nx)}`]);
  const pd=D.reps.filter(r=>r.sum>0).sort((a,b)=>a.due<b.due?1:-1).find(r=>r.due<=TODAY);if(pd)out.push(['coins','y','Налог к уплате посчитан',`${fmtM(pd.sum,false)} сом · ${T[pd.t].short} · ${nm(pd)}`]);
  return out}
function landFxStop(){LAND.tm.forEach(t=>{clearInterval(t);clearTimeout(t)});LAND.tm=[];clearTimeout(LAND.wt);if(LAND.rv){LAND.rv.disconnect();LAND.rv=null}if(LAND.raf){cancelAnimationFrame(LAND.raf);LAND.raf=0}}
// Числа полосы цифр досчитываются от нуля, когда полоса показалась
function landCount(b){const n=+b.dataset.lpCount;if(!n)return;const t0=performance.now(),dur=1200;const f=t=>{if(!b.isConnected)return;const k=Math.min(1,(t-t0)/dur);b.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)};b.textContent='0';requestAnimationFrame(f)}
function landFx(el){landFxStop();const page=$('#land-page',el);if(!page)return;const anim=!landRM()&&'IntersectionObserver' in window;page.classList.toggle('lp-anim',anim);
  const tm=(f,ms,rep)=>{const t=rep?setInterval(f,ms):setTimeout(f,ms);LAND.tm.push(t);return t};
  const emb=$('#lp-emb',el);
  const onIn=x=>{if(x.dataset.lpCount)landCount(x);if(x===emb){tm(()=>emb.classList.add('e-idle'),3700);tm(()=>embAuto(),4300)}};
  if(anim){LAND.rv=new IntersectionObserver(en=>en.forEach(x=>{const t=x.target;if(t.classList.contains('lp-live'))t.classList.toggle('vis',x.isIntersecting);
      if(x.isIntersecting&&!t.classList.contains('in')){t.classList.add('in');onIn(t);if(!t.classList.contains('lp-live'))LAND.rv.unobserve(t)}}),{root:page,rootMargin:'0px 0px -8% 0px',threshold:0});
    $$('.rv,.lp-live,[data-lp-count]',page).forEach(x=>LAND.rv.observe(x))}
  else $$('.rv,.lp-live',page).forEach(x=>x.classList.add('in','vis'));
  // Полоса прокрутки под шапкой; фон первого экрана плывёт медленнее страницы
  const pr=$('#lp-prog',el),bg=$('.lp-hero-bg',el);
  page.addEventListener('scroll',()=>{if(LAND.raf)return;LAND.raf=requestAnimationFrame(()=>{LAND.raf=0;const y=page.scrollTop,h=page.scrollHeight-page.clientHeight;if(pr)pr.style.transform=`scaleX(${h>0?Math.min(1,y/h).toFixed(4):0})`;if(anim&&bg&&y<1600)bg.style.transform=`translate3d(0,${(y*.3).toFixed(1)}px,0)`})},{passive:true});
  // Мышь над первым экраном чуть сдвигает солнце и картинку (только на ПК с мышью)
  const hero=$('#lp-hero',el);if(anim&&hero&&matchMedia('(hover:hover) and (pointer:fine)').matches)hero.onpointermove=e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5).toFixed(3));hero.style.setProperty('--my',((e.clientY-r.top)/r.height-.5).toFixed(3))};
  // Сообщения над картинкой сменяют друг друга
  const box=$('#lp-toast',el),ts=landToasts();let ti=0;
  const toast=()=>{if(!box||!ts.length)return;const [i,c,t,s]=ts[ti++%ts.length],n=document.createElement('div');n.className='lp-tst';n.innerHTML=`<i class="${c}">${ic(i,'sm')}</i><span class="lp-tst-t"><b>${esc(t)}</b><span>${esc(s)}</span></span>`;
    $$('.lp-tst',box).forEach(o=>{if(!anim)return o.remove();o.classList.add('out');setTimeout(()=>o.remove(),400)});box.append(n)};
  if(anim){tm(toast,900);tm(()=>{if(hero&&hero.classList.contains('vis')&&!document.hidden)toast()},3600,true)}else toast();
  // Герб: подсветка символа, весы взвешивают, сами по кругу, пока посетитель не нажал
  let auto=true,ai=0,pin='';
  const hl=k=>{if(!emb)return;emb.dataset.hl=k||'';$$('[data-lp-emb]',emb).forEach(b=>b.setAttribute('aria-pressed',b.dataset.lpEmb===k))};
  const weigh=()=>{const svg=emb&&$('.lp-emb-svg',emb);if(!svg)return;svg.classList.add('e-coins');if(!anim)return;svg.classList.remove('e-weigh');void svg.getBoundingClientRect();svg.classList.add('e-weigh');clearTimeout(LAND.wt);LAND.wt=setTimeout(()=>svg.classList.remove('e-weigh'),2700)};
  const embAuto=()=>{if(!anim||!emb||!auto)return;tm(()=>{if(!auto||!emb.classList.contains('vis')||document.hidden)return;const k=['sun','scales','curve',''][ai++%4];hl(k);if(k==='scales')weigh()},3000,true);hl('sun');ai=1};
  if(emb){const stop=()=>{auto=false};
    emb.onclick=e=>{const b=e.target.closest('[data-lp-emb]');const sc=e.target.closest('.e-scales');if(!b&&!sc)return;stop();const k=b?b.dataset.lpEmb:'scales';pin=pin===k&&b?'':k;hl(pin);if(k==='scales')weigh()};
    $$('[data-lp-emb]',emb).forEach(b=>{b.onpointerenter=e=>{if(e.pointerType==='mouse'){stop();hl(b.dataset.lpEmb)}};b.onfocus=()=>{stop();hl(b.dataset.lpEmb)}});
    const l=$('.lp-emb-l',emb);if(l){l.onpointerleave=e=>{if(e.pointerType==='mouse')hl(pin)};l.addEventListener('focusout',e=>{if(!l.contains(e.relatedTarget))hl(pin)})}}}
