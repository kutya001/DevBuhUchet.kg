'use strict';
// Telegram контрагента (пакет заказчика 13.11.2026, поток К, задача К3): клиент сам подключает свой Telegram к боту Buhuchet.kg на странице контрагента,
// подключение подтверждает обслуживающая организация. Подключённый Telegram получает только «К оплате», напоминания о долге и ответы бухгалтера —
// данных других контрагентов, задач и сотрудников бот ему не показывает
/* ═════════════ Telegram контрагента ═════════════ */
// c.tgs — запросы и подключения: {id, name — имя в Telegram, at — когда пришёл запрос, st: wait | on | no | off, by — кто решил (сотрудник или 'client'), doneAt}
// В продукте «Подключить Telegram» выдаёт одноразовую ссылку на бота (действует 24 часа, выдаётся только тому, кто вошёл на страницу по коду);
// чат запоминается по номеру чата Telegram, имя — только для показа сотруднику
const PG_TG_MAX=5,PG_TG_TTL_H=24,PG_TG_KIND='Telegram контрагента';
const PG_TG_ST={wait:'Ждёт подтверждения',on:'Подключён',no:'Отклонён',off:'Отключён'};
const PG_TG_PILL={'Ждёт подтверждения':['yellow','hourglass'],'Подключён':['green','check'],'Отклонён':['gray','ban'],'Отключён':['gray','ban']};
const pgTgs=c=>c.tgs||(c.tgs=[]);
const pgTgN=(c,st)=>(c.tgs||[]).filter(x=>x.st===st).length;
// Занято мест: подключённые и ждущие подтверждения — вместе не больше 5, так страницу нельзя завалить запросами
const pgTgBusy=c=>pgTgN(c,'on')+pgTgN(c,'wait');
// Раздел «Telegram» есть, пока включена страница, раздел включён в учётной политике и не скрыт у контрагента
const pgTgOn=c=>pgOn(c)&&pgSecs(c).includes('tg');
// Кому бот пишет о запросе: ответственному с Telegram, иначе первому владельцу с Telegram (как о закрытой странице)
const pgTgStaff=c=>{const r=EM[c.resp];return r&&r.active!==false&&r.tg?r:EMP.find(e=>e.role==='owner'&&e.active!==false&&e.tg)||null};
const pgTgClientLog=(c,what)=>{HIST.push({at:nowStamp(),who:'client',ent:'cp',id:c.id,cp:c.id,what});dbSoon()};
const pgTgToClient=(c,x)=>tgSvc({short:c.name},PG_TG_KIND,{chat:x.name});

// Запрос из бота: клиент открыл ссылку со страницы и нажал «Старт». Возвращает ответ бота клиенту и сообщение сотруднику
function pgTgRequest(c,name){name=String(name||'').replace(/\s+/g,' ').trim().slice(0,32);const v={контрагент:c.name,телеграм:name};
  if(!pgTgOn(c)||!name)return {bot:tplFill('tgCpLinkBad',v)};
  const was=pgTgs(c).find(x=>x.name===name&&(x.st==='on'||x.st==='wait'));
  if(was)return {bot:tplFill(was.st==='on'?'tgCpAlready':'tgCpAsk',v),x:was};
  if(pgTgBusy(c)>=PG_TG_MAX)return {bot:tplFill('tgCpLimit',v)};
  const x={id:(c.tgs.reduce((a,y)=>Math.max(a,y.id),0)||0)+1,name,at:nowStamp(),st:'wait'};c.tgs.push(x);
  pgTgClientLog(c,`Telegram контрагента: запрос на подключение от «${name}»`);pgTgToClient(c,x);
  const to=pgTgStaff(c);if(to)tgSvc(to,PG_TG_KIND);
  return {bot:tplFill('tgCpAsk',v),x,staff:to,msg:pgTgStaffMsg(c,x)}}
// Сообщение сотруднику о запросе — с кнопками «Подтвердить» и «Отклонить»
const pgTgStaffMsg=(c,x)=>({h:'Telegram контрагента',t:tplFill('tgCpReq',{контрагент:c.name,телеграм:x.name}),at:bishkekNow().hm,
  btns:[[{t:tgBtnT('tgBtnCpOk','Подтвердить'),act:'cptg-ok',arg:{cp:c.id,id:x.id},icon:'check'},{t:tgBtnT('tgBtnCpNo','Отклонить'),act:'cptg-no',arg:{cp:c.id,id:x.id},icon:'x'}]]});
// Что мешает решению сотрудника
function pgTgWhy(c,x,k){if(!can('cpPage'))return 'Нужно право «Управлять страницей контрагента»';
  if(k==='off')return x.st==='on'?'':'Telegram уже не подключён';
  if(x.st!=='wait')return 'Запрос уже рассмотрен';
  if(k==='ok'&&pgTgN(c,'on')>=PG_TG_MAX)return `Уже подключено ${PG_TG_MAX} Telegram: сначала отключите лишний`;
  return ''}
// Решение сотрудника: ok — подтвердить, no — отклонить, off — отключить. via — запись истории «через Telegram»
function pgTgDecide(c,x,k,via){const lg=via?tgLog:log,v={контрагент:c.name,телеграм:x.name};
  x.st={ok:'on',no:'no',off:'off'}[k];x.by=S.me;x.doneAt=nowStamp();
  lg('cp',c.id,`Telegram контрагента «${x.name}»: ${{ok:'подключён',no:'запрос отклонён',off:'отключён'}[k]}`,c.id);pgTgToClient(c,x);
  return tplFill({ok:'tgCpOn',no:'tgCpNo',off:'tgCpOff'}[k],v)}
// Клиент отключается сам командой «Отключить» в боте
function pgTgLeave(c,x){x.st='off';x.by='client';x.doneAt=nowStamp();pgTgClientLog(c,`Telegram контрагента «${x.name}»: отключён контрагентом`);pgTgToClient(c,x);return tplFill('tgCpOff',{контрагент:c.name,телеграм:x.name})}

// Кнопки под сообщением сотруднику: право «Управлять страницей контрагента», контрагент в области «Свои / Все», запрос ещё ждёт
const pgTgArg=a=>{const c=CPM[a&&a.cp],x=c&&(c.tgs||[]).find(y=>y.id===a.id);return {c,x}};
['ok','no'].forEach(k=>tgAct('cptg-'+k,{change:true,perm:'cpPage',scope:(u,a)=>{const{c}=pgTgArg(a);return !!c&&visCps(true).includes(c)},stale:(u,a)=>{const{c,x}=pgTgArg(a);return !x||x.st!=='wait'||!pgOn(c)},
  run:(u,a)=>{const{c,x}=pgTgArg(a),why=pgTgWhy(c,x,k);if(why)return {eph:why};pgTgDecide(c,x,k,true);refreshAll();return {done:k==='ok'?'✓ Подтверждён':'✓ Отклонён',off:['cptg-ok','cptg-no'],eph:k==='ok'?`Telegram «${x.name}» подключён к «${c.name}»`:'Запрос отклонён'}}}));

// Карточка контрагента, блок «Страница контрагента»: список «Telegram контрагента» с кнопками «Подтвердить», «Отклонить», «Отключить»
function pgTgBox(c){const l=(c.tgs||[]).slice().sort((a,b)=>(a.st==='wait'?0:a.st==='on'?1:2)-(b.st==='wait'?0:b.st==='on'?1:2)||(a.at<b.at?1:-1));if(!l.length&&!pgTgOn(c))return '';
  const btn=(x,k,icon,label,cls='')=>{const w=pgTgWhy(c,x,k);return `<button type="button" class="btn sm ${cls} ${w?'dis':''}" data-pg-tg="${k}:${x.id}" ${w?`aria-disabled="true" data-why="${esc(w)}" title="${esc(w)}"`:''}>${ic(icon,'sm')}<span class="bl">${label}</span></button>`};
  const who=x=>x.doneAt?`<div class="hint">${x.by==='client'?'контрагент':esc(whoName(x.by))}, ${fmtDT(x.doneAt)}</div>`:'';
  return `<div class="pg-tg"><h4>${ic('tg','sm')}Telegram контрагента${pgTgN(c,'wait')?` <span class="pill yellow sm">${ic('hourglass')}ждёт подтверждения: ${pgTgN(c,'wait')}</span>`:''}<span class="grow"></span><span class="hint">подключено ${pgTgN(c,'on')} из ${PG_TG_MAX}</span></h4>
    ${l.length?`<div class="tbl-wrap"><table class="mini m-cards pg-tg-tbl"><thead><tr><th>Имя в Telegram</th><th>Запрос</th><th>Статус</th><th></th></tr></thead><tbody>${l.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${fmtDT(x.at)}</td><td>${pill(PG_TG_ST[x.st],PG_TG_PILL,'sm')}${who(x)}</td>
      <td class="m-act pg-tg-act">${x.st==='wait'?btn(x,'ok','check','Подтвердить','cta')+btn(x,'no','x','Отклонить'):x.st==='on'?btn(x,'off','ban','Отключить'):''}</td></tr>`).join('')}</tbody></table></div>`
      :`<span class="hint">Контрагент ещё не подключал Telegram. Кнопка «Подключить Telegram» — на его странице, в разделе «Telegram».</span>`}
    <span class="hint">Подключённый Telegram получает суммы налогов к оплате и напоминания о долге — только по этому контрагенту. Подтверждайте запрос, только если знаете, чей это Telegram.</span></div>`}
function pgTgBoxClick(c,x0,redraw){if(x0.dataset.why){toast(x0.dataset.why,'lock',true);return}const[k,id]=x0.dataset.pgTg.split(':'),x=(c.tgs||[]).find(y=>y.id===+id);if(!x)return;
  const why=pgTgWhy(c,x,k);if(why){toast(why,'lock',true);return}
  const run=()=>{pgTgDecide(c,x,k);redraw&&redraw();refreshAll();toast({ok:`Telegram «${x.name}» подключён`,no:'Запрос отклонён',off:`Telegram «${x.name}» отключён`}[k],'tg')};
  if(k==='ok')confirmDlg({title:'Подтвердить Telegram контрагента?',text:`«${x.name}» будет получать в Telegram суммы налогов к оплате и напоминания по контрагенту «${c.name}». Подтверждайте, только если знаете, что это Telegram вашего клиента.`,ok:'Подтвердить',run});
  else if(k==='off')confirmDlg({title:'Отключить Telegram контрагента?',text:`«${x.name}» перестанет получать сообщения по контрагенту «${c.name}». Подключиться снова клиент сможет на своей странице — с новым подтверждением.`,ok:'Отключить',danger:true,run});
  else run()}

// Страница контрагента, раздел «Telegram»
function pgTgPub(c){const on=pgTgN(c,'on'),wait=pgTgN(c,'wait'),full=pgTgBusy(c)>=PG_TG_MAX;
  return pubSec('tg','tg','Telegram',on?`подключено ${on}`:wait?'ждёт подтверждения':'',
    `${PGT('secs','Telegram')?'':'<p class="pub-tgp">Получайте в Telegram суммы налогов к оплате и напоминания.</p>'}
    ${on||wait?`<div class="pub-tgst">${on?`<span class="pill green sm">${ic('check')}подключено: ${on}</span>`:''}${wait?`<span class="pill yellow sm">${ic('hourglass')}ждёт подтверждения бухгалтера: ${wait}</span>`:''}</div>`:''}
    <div class="row"><button type="button" class="btn cta ${full?'dis':''}" data-pub-tgon ${full?`aria-disabled="true" data-why="Подключено или ждёт подтверждения ${PG_TG_MAX} Telegram — больше нельзя. Попросите вашего бухгалтера отключить лишний"`:''}>${ic('tg','sm')}Подключить Telegram</button></div>
    <span class="hint">Кнопка откроет бота Buhuchet.kg в Telegram — нажмите в нём «Старт». Подключение подтверждает ваш бухгалтер. Ссылка действует ${PG_TG_TTL_H} часа и только один раз. Отключиться можно в любой момент командой «Отключить» в боте.</span>`)}
// Прототип: переписка клиента с ботом и сообщение бухгалтеру. В продукте кнопка открывает Telegram по одноразовой ссылке
function pgTgDlg(c){const A=[{day:'Сегодня'}],B=[{day:'Сегодня'}],to=pgTgStaff(c),CA={who:'Чат клиента',list:A},CB={who:to?`Чат бухгалтера · ${to.short||to.fio}`:'Чат бухгалтера',list:B},told=new Set();let cur=null;
  const n=pgTgs(c).length+1,def=n===1&&c.contact?c.contact.split(' ').slice(0,2).join(' '):'Клиент '+n;
  // Решение бухгалтера в его чате сразу видно клиенту
  const sync=()=>{if(cur&&cur.st!=='wait'&&!told.has(cur)){told.add(cur);A.push({t:tplFill(cur.st==='on'?'tgCpOn':cur.st==='no'?'tgCpNo':'tgCpOff',{контрагент:c.name,телеграм:cur.name}),at:bishkekNow().hm})}};
  openModal({size:'mid',live:true,render:m=>{sync();const st=cur&&cur.st;return {title:'Прототип: подключение Telegram',sub:`Кнопка на странице открыла бота Buhuchet.kg в Telegram клиента — ${esc(c.name)}`,
    body:`<div class="tgc-wrap two"><div id="pt-a">${tgcHtml(CA)}</div><div id="pt-b">${tgcHtml(CB)}</div></div>
      ${!cur?`<div class="row" style="flex-wrap:wrap">${inp('pt-n',def,'maxlength="32" placeholder="Имя в Telegram" aria-label="Имя в Telegram" style="max-width:220px"')}<button class="btn cta" id="pt-go">${ic('send','sm')}Нажать «Старт» в боте</button></div>`
        :st==='on'?`<div class="row"><button class="btn" id="pt-off">${ic('ban','sm')}Отправить боту «Отключить»</button></div>`:''}
      <div class="note">${ic('info')}<span>Так бот переписывается с клиентом и с бухгалтером. В продукте имя берётся из Telegram, а ссылка со страницы действует ${PG_TG_TTL_H} часа и один раз. ${to?'Кнопки в чате бухгалтера работают: то же можно сделать в карточке контрагента, в блоке «Страница контрагента».':'У ответственного и владельцев нет Telegram — запрос виден только в карточке контрагента.'} Сообщения записаны в журнал «Телеграм» с типом «${PG_TG_KIND}». Тексты — Справочники платформы → «Шаблоны».</span></div>`,
    foot:'<button class="btn cta" data-close>Готово</button>',
    mount(el){tgcBind($('#pt-b',el),CB,()=>{m.draw();pubDraw(true)},to||me());
      const g=$('#pt-go',el),k=$('#pt-n',el),off=$('#pt-off',el);
      if(g){const go=()=>{const name=k.value.replace(/\s+/g,' ').trim();if(!name){k.focus();return}A.push({t:'/start',me:true});const r=pgTgRequest(c,name);A.push({t:r.bot,at:bishkekNow().hm});
          if(r.x){cur=r.x;if(r.x.st==='on')told.add(cur);if(r.msg&&r.staff)B.push(r.msg)}m.draw();pubDraw(true);refreshAll()};
        g.onclick=go;k.onkeydown=e=>{if(e.key==='Enter')go()};k.focus()}
      if(off)off.onclick=()=>{A.push({t:'Отключить',me:true});told.add(cur);A.push({t:pgTgLeave(c,cur),at:bishkekNow().hm});cur=null;m.draw();pubDraw(true);refreshAll()}}}}})}
