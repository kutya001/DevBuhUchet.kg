'use strict';
// «Мой профиль» и уведомления
/* ═════════════ Profiles ═════════════ */
function profileDlg(){
  const u=me();const st={};
  openModal({size:'mid',live:true,render:m=>{
    const ws=u.wallets||[];
    return {title:'Мой профиль',sub:esc(u.fio),body:`
    ${kbBox(kbStat(),{link:'pf-kb'})}
    <div class="box"><h3>Основное</h3><div class="kv"><div><span class="k">ФИО</span><span class="v">${esc(u.fio)}</span></div><div><span class="k">Логин</span><span class="v mono">${esc(u.login)}</span></div><div><span class="k">Телефон</span><span class="v">${u.phone?esc(fmtPhone(u.phone)):'—'}</span></div><div><span class="k">Роль</span><span class="v">${isAdmin()?'Администратор платформы':esc(myRole().name)}</span></div></div></div>
    <div class="box"><h3>Telegram для уведомлений</h3>${u.tg?`<div class="row">${pill('Привязан',{Привязан:['green','check']})}<span class="mono">${esc(u.tg)}</span><div class="grow"></div><button class="btn sm ghost" id="pf-untg">Отвязать</button></div>`:`<div class="note warn">${ic('alert')}<span>Telegram не привязан: напоминания не приходят, а восстановить пароль самостоятельно нельзя.</span></div><div class="row"><span class="mono" style="overflow-wrap:anywhere">t.me/buhuchet_bot?start=a7f3c91e</span><button class="btn sm" id="pf-tglink">${ic('copy','sm')}Скопировать ссылку</button><button class="btn sm cta" id="pf-tgdemo">Демо: привязать</button></div><div class="hint">Ссылка одноразовая и действует 15 минут. Бот проверит её, привяжет чат и пришлёт подтверждение.</div>`}</div>
    ${isAdmin()?'':`<div class="box"><h3>Мои реквизиты для переводов<span class="grow"></span><button class="btn sm" id="pf-addw">${ic('plus','sm')}Добавить</button></h3>${ws.length?`<table class="mini"><thead><tr><th>Провайдер</th><th>Номер счёта или кошелька</th><th>Получатель</th><th></th><th></th></tr></thead><tbody>${ws.map((w,i)=>`<tr><td>${esc(w.prov)}</td><td class="mono">${esc(w.num)}</td><td>${esc(w.name||'—')}</td><td>${w.main?pill('Основной',{Основной:['green','star']}):`<button class="linkbtn" data-main="${i}">Сделать основным</button>`}</td><td class="num"><button class="icon-btn sm" data-delw="${i}" aria-label="Удалить реквизит">${ic('trash','sm')}</button></td></tr>`).join('')}</tbody></table>`:`<div class="note">${ic('info')}<span>Реквизитов нет. Без них кнопка «Напомнить в WhatsApp» не сможет подставить, куда переводить деньги.</span></div>`}<div class="hint">Видны вам, владельцу и главному бухгалтеру. Провайдер выбирается из справочника платформы.</div></div>`}
    ${isAdmin()?'':notifyBox(u)}
    <div class="box"><h3>Личные настройки</h3><div class="form">${fld('Тема',sel('pf-theme',[['light','Светлая'],['dark','Тёмная']],effTheme()),{id:'pf-theme'})}</div>
      <div class="row" style="margin-top:10px"><span class="grow"><b>Знакомые элементы в показах</b><div class="hint">Показы «Базы знаний» пропускают то, что вам уже объяснили</div></span><button class="btn sm" id="pf-known">${ic('refresh','sm')}Показывать всё заново</button></div></div>
    <div class="box"><h3>Смена пароля</h3><div class="form">${fld('Текущий пароль',inp('pf-p0','','type="password" autocomplete="current-password"'),{id:'pf-p0'})}<div></div>${fld('Новый пароль',inp('pf-p1','','type="password" autocomplete="new-password"'),{id:'pf-p1',hint:'Не короче 8 символов'})}${fld('Повторите',inp('pf-p2','','type="password" autocomplete="new-password"'),{id:'pf-p2'})}</div><div class="row"><button class="btn sm" id="pf-pass">Сменить пароль</button></div></div>`,
    foot:`<div class="grow"></div><button class="btn cta" data-close>Готово</button>`,
    mount(el){
      const q=s=>el.querySelector(s);
      if(q('#pf-kb'))q('#pf-kb').onclick=()=>{m.close();go('kb','level')};
      bindNotify(el,u,m);q('#pf-known').onclick=()=>tKnownReset(()=>m.draw());
      q('#pf-theme').onchange=e=>{document.documentElement.setAttribute('data-theme',e.target.value);try{localStorage.setItem('bu.theme',e.target.value)}catch(_){}paintTheme()};
      if(q('#pf-untg'))q('#pf-untg').onclick=()=>{u.tg=null;log('emp',u.id,'Telegram отвязан');m.draw();toast('Telegram отвязан')};
      if(q('#pf-tglink'))q('#pf-tglink').onclick=()=>copyText('https://t.me/buhuchet_bot?start=a7f3c91e','Ссылка скопирована');
      if(q('#pf-tgdemo'))q('#pf-tgdemo').onclick=()=>{u.tg='@'+u.login;log('emp',u.id,'Telegram привязан');m.draw();toast('Telegram привязан','tg')};
      if(q('#pf-addw'))q('#pf-addw').onclick=()=>walletDlg(u,()=>m.draw());
      $$('[data-delw]',el).forEach(b=>b.onclick=()=>{const w=u.wallets[+b.dataset.delw];confirmDlg({title:'Удалить реквизит?',text:`${esc(w.prov)} ${esc(w.num)} больше не будет подставляться в напоминания.`,ok:'Удалить',danger:true,run:()=>{u.wallets.splice(+b.dataset.delw,1);if(u.wallets.length&&!u.wallets.some(x=>x.main))u.wallets[0].main=true;m.draw();toast('Реквизит удалён')}})});
      $$('[data-main]',el).forEach(b=>b.onclick=()=>{u.wallets.forEach((w,i)=>w.main=i===+b.dataset.main);m.draw()});
      q('#pf-pass').onclick=()=>{const a=setErr(el,'pf-p0',val(el,'pf-p0')==='demo'?'':'Текущий пароль неверный (демо: demo)');const p=val(el,'pf-p1');const b=setErr(el,'pf-p1',p.length>=8?'':'Не короче 8 символов');const c=setErr(el,'pf-p2',p===val(el,'pf-p2')?'':'Пароли не совпадают');if(a&&b&&c){toast('Пароль изменён. Другие сеансы завершены.','key');['pf-p0','pf-p1','pf-p2'].forEach(i=>el.querySelector('#'+i).value='')}};
    }};
  }});
}
/* Уведомления: владелец и главбух выбирают режим; сотрудник получает своё */
const NMODES=[['all','Все','Сроки и просрочки отчётов всех сотрудников, задачи, сводка за неделю'],['digest','Только просрочки и сводка','Без ежедневных напоминаний о сроках: только просрочки, ручные задачи и сводка по понедельникам'],['manual','Только ручные задачи','Новые задачи, поставленные вручную, их комментарии и выполнение. Регулярные задачи по отчётам не приходят']];
const NKINDS=[['before','Напоминания за N дней до срока по отчётам других сотрудников'],['over','Просрочки по отчётам других сотрудников'],['tasks','Ручные задачи: новые, комментарии, выполнение'],['regtasks','Регулярные задачи по отчётам'],['week','Сводка за неделю по понедельникам']];
function notifyOf(u){u.notify=u.notify||{mode:'all',off:{}};return u.notify}
function notifyBox(u){const n=notifyOf(u);const boss=u.role==='owner'||u.role==='chief';
  const on=k=>!n.off[k]&&(n.mode==='all'||(n.mode==='digest'&&['over','tasks','week'].includes(k))||(n.mode==='manual'&&k==='tasks'));
  return `<div class="box"><h3>Уведомления в Telegram</h3>${boss?`<div class="fl-list" style="max-height:none" role="radiogroup" aria-label="Какие уведомления получать">${NMODES.map(([k,l,h])=>`<label><input type="radio" name="pf-nm" value="${k}" ${n.mode===k?'checked':''}> <span><b>${l}</b><div class="hint">${h}</div></span></label>`).join('')}</div>`:`<div class="note">${ic('info')}<span>Вы получаете напоминания по своим отчётам и задачам. Владелец и главный бухгалтер получают ещё и по всей организации, если не выбрали другой режим.</span></div>`}
  <label class="check-row"><input type="checkbox" class="sw" checked disabled aria-label="Напоминания по моим отчётам"><span class="grow">По моим отчётам: за N дней, в день срока и при просрочке — приходят всегда, отключить нельзя</span></label>
  ${NKINDS.filter(([k])=>boss||!['week','before','over'].includes(k)).map(([k,l])=>`<label class="check-row"><input type="checkbox" class="sw" data-nk="${k}" ${on(k)?'checked':''} ${boss&&n.mode!=='all'&&!on(k)&&!n.off[k]?'disabled':''}><span class="grow">${l}</span></label>`).join('')}
  <span class="hint">${boss?'Режим и переключатели меняют только уведомления по отчётам других сотрудников и по задачам. Отключённый переключатель — это то, что не входит в выбранный режим.':'Напоминания по вашим отчётам нельзя отключить: их получаете вы, главный бухгалтер и владелец.'}</span></div>`}
function bindNotify(el,u,m){const n=notifyOf(u);
  $$('[name="pf-nm"]',el).forEach(r=>r.onchange=()=>{n.mode=r.value;n.off={};log('emp',u.id,'Уведомления: '+NMODES.find(x=>x[0]===r.value)[1]);m.draw();toast('Режим уведомлений сохранён','bell')});
  $$('[data-nk]',el).forEach(x=>x.onchange=()=>{if(x.checked)delete n.off[x.dataset.nk];else n.off[x.dataset.nk]=true;log('emp',u.id,'Уведомления: «'+NKINDS.find(k=>k[0]===x.dataset.nk)[1]+'» '+(x.checked?'включено':'отключено'));toast(x.checked?'Включено':'Отключено','bell')})}
function walletDlg(u,done){
  openModal({form:true,render:()=>({title:'Новый реквизит',sub:'Куда контрагенты переводят деньги на налоги',body:`<div class="form">${fld('Банковский провайдер',sel('w-prov',DICT.banks.items.filter(x=>x.active).map(x=>x.name),''),{req:true,id:'w-prov'})}${fld('Номер счёта или кошелька',inp('w-num','','class="inp mono" inputmode="numeric"'),{req:true,id:'w-num'})}${fld('Имя получателя',inp('w-name',''),{id:'w-name',hint:'Необязательно'})}<div class="fld"><label class="lbl">&nbsp;</label><label class="row"><input type="checkbox" id="w-main" ${(u.wallets||[]).length?'':'checked'}> Основной</label></div></div>`,
    foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="w-ok">Добавить</button>',
    mount(el,m){$('#w-ok',el).onclick=()=>{const n=val(el,'w-num');if(!setErr(el,'w-num',n.replace(/\D/g,'').length>=6?'':'Введите номер: не меньше 6 цифр'))return;u.wallets=u.wallets||[];const main=$('#w-main',el).checked;if(main)u.wallets.forEach(w=>w.main=false);u.wallets.push({prov:val(el,'w-prov'),num:n,name:val(el,'w-name'),main:main||!u.wallets.length});m.close();toast('Реквизит добавлен');done&&done()}}})});
}
function orgProfileDlg(){
  openModal({size:'mid',render:()=>({title:esc(ORG.name),sub:'Профиль организации · только просмотр',body:orgMainView(),foot:`${can('org')?`<button class="btn" id="op-edit">${ic('edit','sm')}Редактировать</button>`:''}<button class="btn cta" data-close>Закрыть</button>`,mount(el,m){const b=$('#op-edit',el);if(b)b.onclick=()=>{m.close();go('org','main')}}})});
}
function orgMainView(){return `<div class="box"><h3>Основное</h3><div class="kv"><div><span class="k">Название</span><span class="v">${esc(ORG.name)}</span></div><div><span class="k">ИНН</span><span class="v mono">${ORG.inn}</span></div><div><span class="k">Адрес</span><span class="v">${esc(ORG.address)}</span></div><div><span class="k">Телефон</span><span class="v">${esc(fmtPhone(ORG.phone))}</span></div><div><span class="k">Руководитель</span><span class="v">${esc(ORG.head)}</span></div>${ORG.logo?`<div><span class="k">Логотип</span><span class="v"><img src="${ORG.logo}" alt="Логотип" style="width:40px;height:40px;object-fit:contain"></span></div>`:''}<div><span class="k">На платформе с</span><span class="v">${fmtD(ORG.created)}</span></div></div></div>
  <div class="box"><h3>Реквизиты для приёма денег от контрагентов</h3><table class="mini"><thead><tr><th>Банк</th><th>Расчётный счёт</th><th>БИК</th><th></th>${can('org')?'<th></th>':''}</tr></thead><tbody id="og-accs">${orgAccRows()}</tbody></table></div>`}

