'use strict';
// Вход и восстановление пароля
/* ═════════════ Login & password recovery ═════════════ */
function logoutDlg(){
  const dirty=MODALS.some(m=>m.o.form);
  const doOut=()=>{MODALS.slice().forEach(m=>m.close());S.loggedIn=false;showLogin()};
  if(dirty)confirmDlg({title:'Выйти без сохранения?',text:'В открытом окне есть несохранённые изменения. Если выйти сейчас, они пропадут.',ok:'Выйти',danger:true,run:doOut});else doOut();
}
// Сообщения на странице входа не выдают, есть ли такой логин (решение заказчика 26.10.2026, v59). Неверные попытки считаются по логину, в том числе несуществующему: 5 подряд — вход по нему закрыт на 15 минут. В макете счётчик живёт до перезагрузки страницы, в продукте его ведёт сервер
const LG_FAIL={},LG_MAX=5,LG_LOCK=15*60*1000;
const LG_T={bad:'Неверный логин или пароль',lock:'Вход временно закрыт: слишком много неверных попыток. Попробуйте через 15 минут.',user:'Учётная запись заблокирована. Обратитесь к владельцу организации.',org:'Организация заблокирована. Обратитесь к администратору платформы.',demo:'В макете можно войти только в демо-организацию',code:'Если к логину привязан Telegram, бот пришлёт код. Если код не пришёл, пароль сбросит владелец организации.'};
function showLogin(step='login',ctx={}){
  let el=$('#login');if(!el){el=document.createElement('div');el.id='login';el.className='login';document.body.appendChild(el)}
  const head=`<div class="row" style="gap:11px"><div class="logo" aria-hidden="true"><i></i><i></i><i></i></div><div><div class="brand-name">Buhuchet.kg</div><div class="mode">Автоматизация бухгалтерского аутсорсинга</div></div></div>`;
  const M=s=>`<span class="mono">${s}</span>`;
  let body='';
  if(step==='login')body=`<h2>Вход</h2>${fld('Логин',inp('lg-login',ctx.login||'','autocomplete="username"'),{id:'lg-login'})}${fld('Пароль',inp('lg-pass','','type="password" autocomplete="current-password"'),{id:'lg-pass'})}<div class="note bad" id="lg-msg" role="alert" hidden></div><button class="btn cta" id="lg-go" style="justify-content:center">Войти</button><button class="linkbtn" id="lg-forgot" style="align-self:flex-start">Забыли пароль?</button><div class="note">${ic('info')}<span>Демо: логины ${['erkin','meerim','alisher','aigerim','nurlan','admin'].map(M).join(', ')}; пароль ${M('demo')}. Логин ${M('bakyt')} — заблокированный сотрудник, ${M('easybuh')} — заблокированная организация. После 5 неверных попыток подряд вход по логину закрыт на 15 минут (в макете — до перезагрузки страницы).</span></div>`;
  if(step==='forgot')body=`<h2>Восстановление пароля</h2><p class="muted" style="margin:0">Введите логин и нажмите «Получить код».</p>${fld('Логин',inp('fg-login',ctx.login||'','autocomplete="username"'),{id:'fg-login'})}<button class="btn cta" id="fg-go" style="justify-content:center">${ic('tg')}Получить код</button><button class="linkbtn" id="fg-back" style="align-self:flex-start">Вернуться ко входу</button>`;
  if(step==='code')body=`<h2>Введите код</h2><div class="note">${ic('tg')}<span>${LG_T.code} Код действует 10 минут. Демо-код: <b class="mono">482913</b> — подходит, если к логину привязан Telegram (у ${M('nurlan')} не привязан).</span></div>${fld('Код из Telegram',inp('fg-code','','inputmode="numeric" maxlength="6" class="inp mono"'),{id:'fg-code'})}${fld('Новый пароль',inp('fg-p1','','type="password" autocomplete="new-password"'),{id:'fg-p1',hint:'Не короче 8 символов'})}${fld('Повторите пароль',inp('fg-p2','','type="password" autocomplete="new-password"'),{id:'fg-p2'})}<button class="btn cta" id="fg-set" style="justify-content:center">Сменить пароль</button><button class="linkbtn" id="fg-back" style="align-self:flex-start">Вернуться ко входу</button><div class="hint">После смены пароля все прежние сеансы завершатся, а бот сообщит о смене в Telegram.</div>`;
  el.innerHTML=`<div class="card">${head}${body}</div>`;
  const users=[...EMP,PLATFORM_ADMIN];
  const find=l=>users.find(u=>u.login===l.trim().toLowerCase());
  if(step==='login'){const box=$('#lg-msg',el),msg=t=>{box.hidden=!t;box.innerHTML=t?ic('alert','sm')+`<span>${esc(t)}</span>`:''};
    const go=()=>{const l=val(el,'lg-login').trim().toLowerCase(),p=val(el,'lg-pass');msg('');
      const a=setErr(el,'lg-login',l?'':'Введите логин'),b=setErr(el,'lg-pass',p?'':'Введите пароль');if(!a||!b)return;
      const now=Date.now();let f=LG_FAIL[l];if(f&&f.till&&f.till<=now)f=LG_FAIL[l]=null;
      if(f&&f.till)return msg(LG_T.lock);
      // Пароль в макете у всех — demo; несуществующий логин — такая же неверная попытка, как неверный пароль
      const u=find(l),ou=!u&&OTHER_USERS.find(x=>x.login===l);
      if(!(u||ou)||p!=='demo'){f=LG_FAIL[l]=f||{n:0,till:0};if(++f.n>=LG_MAX){f.till=now+LG_LOCK;return msg(LG_T.lock)}return msg(LG_T.bad)}
      delete LG_FAIL[l];
      // О блокировке сотрудника или организации — только после верного пароля и без названия организации
      if(ou){const org=ORGS.find(o=>o.id===ou.org);return msg(org&&org.active===false?LG_T.org:ou.active===false?LG_T.user:LG_T.demo)}
      if(u.active===false)return msg(LG_T.user);
      el.remove();S.loggedIn=true;switchUser(u.id)};
    $('#lg-go',el).onclick=go;el.onkeydown=e=>{if(e.key==='Enter')go()};$('#lg-forgot',el).onclick=()=>showLogin('forgot',{login:val(el,'lg-login')});$('#lg-login',el).focus()}
  // «Забыли пароль?»: ответ один для любого логина, дальше всегда ввод кода
  if(step==='forgot'){$('#fg-back',el).onclick=()=>showLogin('login',{login:val(el,'fg-login')});const go=()=>{const l=val(el,'fg-login').trim().toLowerCase();if(setErr(el,'fg-login',l?'':'Введите логин'))showLogin('code',{login:l})};
    $('#fg-go',el).onclick=go;el.onkeydown=e=>{if(e.key==='Enter')go()};$('#fg-login',el).focus()}
  if(step==='code'){el.onkeydown=null;$('#fg-back',el).onclick=()=>showLogin('login',{login:ctx.login});$('#fg-set',el).onclick=()=>{const u=find(ctx.login||'');const a=setErr(el,'fg-code',val(el,'fg-code')==='482913'&&u&&u.tg?'':'Код неверный или истёк');const p=val(el,'fg-p1');const b=setErr(el,'fg-p1',p.length>=8?'':'Пароль короче 8 символов');const c=setErr(el,'fg-p2',p===val(el,'fg-p2')?'':'Пароли не совпадают');
      if(a&&b&&c){showLogin('login',{login:ctx.login});toast('Пароль изменён. Войдите с новым паролем.','key')}};$('#fg-code',el).focus()}
}
