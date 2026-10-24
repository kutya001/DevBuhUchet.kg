'use strict';
// Страница контрагента по ссылке (v56, решение заказчика 24.10.2026): www.buhuchet.kg/<адрес организации>/inn/<ИНН>, вход по коду из 6 цифр, только просмотр
/* ═════════════ Страница контрагента по ссылке ═════════════ */
// Разделы страницы: [ключ, название, функция учётной политики, без которой раздела нет]; «Ваш бухгалтер» показывается всегда
const PG_SECS=[['contacts','Контакты'],['reports','Отчёты'],['money','Деньги на налоги','taxpay'],['kpi','Показатели','indicators'],['fee','Оплата за обслуживание','fee']];
const PG_TRY=5,PG_LOCK=15*60e3,PG_KEEP=30*864e5;
const pgPath=c=>`${ORG.slug}/inn/${c.inn}`;
const pgUrl=c=>'www.buhuchet.kg/'+pgPath(c);
const pgCodeTxt=k=>k?k.slice(0,3)+' '+k.slice(3):'';
const pgSecOrg=s=>(!s[2]||feat(s[2]))&&(ORG.pageSec||[]).includes(s[0]);
const pgSecs=c=>PG_SECS.filter(s=>pgSecOrg(s)&&!((c.page||{}).hide||[]).includes(s[0])).map(s=>s[0]);
const pgOn=c=>feat('cppage')&&!c.archived&&!!(c.page&&c.page.on);
// Копировать и отправить включённую ссылку может и ответственный бухгалтер без права «Управлять страницей контрагента»
const pgSendWhy=c=>can('cpPage')||c.resp===S.me?'':'Отправлять ссылку может ответственный бухгалтер или сотрудник с правом «Управлять страницей контрагента»';
function pgNewCode(){let n;try{n=crypto.getRandomValues(new Uint32Array(1))[0]%1e6}catch(e){n=Math.floor(Math.random()*1e6)}return String(n).padStart(6,'0')}
// Блок «Страница контрагента» на вкладке «Основное» карточки
function pgBox(c){if(!feat('cppage'))return '';const p=c.page||{},on=pgOn(c),why=c.archived?'Контрагент в архиве: страница выключена':can('cpPage')?'':'Нужно право «Управлять страницей контрагента»',sw=pgSendWhy(c);
  const btn=(k,icon,l,w,cls='')=>`<button type="button" class="btn sm ${cls} ${w?'dis':''}" data-pg="${k}" ${w?`aria-disabled="true" data-why="${esc(w)}" title="${esc(w)}"`:`title="${esc(l)}"`} aria-label="${esc(l)}">${ic(icon,'sm')}<span class="bl">${esc(l)}</span></button>`;
  const secs=PG_SECS.filter(pgSecOrg);
  return `<div class="box cp-page" id="cp-page"><h3>Страница контрагента<span class="grow"></span>${on?pill('Включена',{Включена:['green','check']}):pill('Выключена',{Выключена:['gray','ban']})}</h3>
    ${on?`<div class="kv"><div><span class="k">Ссылка</span><span class="v"><a class="mono pg-link" href="#/${esc(pgPath(c))}" title="Открыть страницу так, как её увидит контрагент">${esc(pgUrl(c))}</a></span></div>
      <div><span class="k">Код доступа</span><span class="v mono strong pg-code">${pgCodeTxt(p.code)}</span></div>
      <div><span class="k">Последнее открытие</span><span class="v">${p.last?`${fmtDT(p.last)}${p.lastDev?` <span class="hint">· ${esc(p.lastDev)}</span>`:''}`:'<span class="faint">контрагент ещё не открывал</span>'}</span></div>
      ${secs.length?`<div class="pg-secs-row"><span class="k">Разделы страницы</span><span class="v"><span class="pg-secs">${secs.map(([k,l])=>`<label class="row"><input type="checkbox" data-pg-sec="${k}" ${(p.hide||[]).includes(k)?'':'checked'} ${why?'disabled':''}> ${esc(l)}</label>`).join('')}</span><span class="hint">«Ваш бухгалтер» видно всегда. Разделы для всех контрагентов — в учётной политике</span></span></div>`:''}</div>`
    :`<span class="hint">${c.archived?'Контрагент в архиве — страница выключена.':'Контрагент откроет по ссылке и коду из 6 цифр свои отчёты, показатели и оплату за обслуживание — только для просмотра, без входа в программу.'}</span>`}
    <div class="row acts">${on?`${btn('copy','copy','Скопировать ссылку',sw)}${btn('wa','chat','Отправить в WhatsApp',sw)}<div class="grow"></div>${btn('code','refresh','Сменить код',why)}${btn('off','ban','Выключить',why)}`:c.archived?'':`<div class="grow"></div>${btn('on','link','Включить',why,'cta')}`}</div></div>`}
function pgMount(el,c,redraw){const b=$('#cp-page',el);if(!b)return;
  b.onclick=e=>{const x=e.target.closest('[data-pg]');if(!x)return;if(x.dataset.why){toast(x.dataset.why,'lock',true);return}const k=x.dataset.pg;
    if(k==='on')pgEnable([c],redraw);else if(k==='off')pgOffDlg(c,redraw);else if(k==='code')pgCodeDlg(c,redraw);
    else if(k==='copy'){copyText('https://'+pgUrl(c),'Ссылка скопирована');log('cp',c.id,'Скопирована ссылка на страницу контрагента',c.id)}else if(k==='wa')waDlg({cp:c,page:true})};
  b.onchange=e=>{const x=e.target.closest('[data-pg-sec]');if(!x)return;const k=x.dataset.pgSec,p=c.page,h=new Set(p.hide||[]);x.checked?h.delete(k):h.add(k);p.hide=[...h];
    log('cp',c.id,`Страница контрагента: раздел «${PG_SECS.find(s=>s[0]===k)[1]}» ${x.checked?'показывается':'скрыт'}`,c.id);toast(x.checked?'Раздел показывается на странице':'Раздел скрыт на странице')}}
// Включить — у каждого свой код; уже включённые и архивные пропускаются
function pgEnable(cs,done){const a=cs.filter(c=>!c.archived&&!(c.page&&c.page.on)),skip=cs.length-a.length;
  if(!a.length){toast(cs.length>1?'У выбранных контрагентов страница уже включена или они в архиве':'Страница уже включена','info');return}
  const run=()=>{a.forEach(c=>{const p=c.page||{};c.page={on:true,code:pgNewCode(),at:nowStamp(),by:S.me,codeAt:nowStamp(),hide:p.hide||[],last:null,lastDev:'',fails:0,lock:0};log('cp',c.id,'Страница контрагента включена: создан код доступа',c.id)});
    done&&done();refreshAll();ckHit('cppage');
    toast(a.length>1?`Страница включена у ${a.length} ${plural(a.length,'контрагента','контрагентов','контрагентов')}, у каждого свой код${skip?`. Пропущено: ${skip} — уже включена или в архиве`:''}`:`Страница включена. Код доступа: ${pgCodeTxt(a[0].page.code)}`,'link')};
  if(a.length>1)confirmDlg({title:`Включить страницу у ${a.length} ${plural(a.length,'контрагента','контрагентов','контрагентов')}?`,text:`У каждого появится своя ссылка и свой код из 6 цифр. Отправить их контрагенту можно из его карточки: «Основное» → «Страница контрагента» → «Отправить в WhatsApp».${skip?` Пропущено: ${skip} — страница уже включена или контрагент в архиве.`:''}`,ok:'Включить',run});else run()}
function pgOff(c,why){if(!c.page||!c.page.on)return;c.page.on=false;c.page.offAt=nowStamp();log('cp',c.id,'Страница контрагента выключена'+(why?': '+why:''),c.id)}
function pgOffDlg(c,done){confirmDlg({title:'Выключить страницу контрагента?',text:'Ссылка перестанет открываться: контрагент увидит «Страница недоступна. Обратитесь к вашему бухгалтеру». Включить можно снова — с новым кодом.',ok:'Выключить',danger:true,run:()=>{pgOff(c,'');done&&done();refreshAll();toast('Страница выключена','ban')}})}
function pgCodeDlg(c,done){confirmDlg({title:'Сменить код доступа?',text:'Старый код перестанет действовать сразу, в том числе в браузерах, где он запомнен. Новый код нужно будет отправить контрагенту.',ok:'Сменить код',run:()=>{
  Object.assign(c.page,{code:pgNewCode(),codeAt:nowStamp(),fails:0,lock:0});log('cp',c.id,'Код доступа страницы контрагента изменён',c.id);done&&done();refreshAll();toast(`Новый код: ${pgCodeTxt(c.page.code)}. Отправьте его контрагенту`,'link')}})}

/* Сама страница — как её откроет контрагент по ссылке. В прототипе открывается поверх программы по адресу #/<адрес организации>/inn/<ИНН> */
const PUB={back:'',open:null,y:null,ky:null};
const pgMem=()=>{const m=store.get('pgmem',{});return m&&typeof m==='object'?m:{}};
const pgDev=()=>{const u=navigator.userAgent||'';const b=/Edg\//.test(u)?'Edge':/OPR\/|Opera/.test(u)?'Opera':/YaBrowser/.test(u)?'Яндекс Браузер':/Firefox\//.test(u)?'Firefox':/Chrome\//.test(u)?'Chrome':/Safari\//.test(u)?'Safari':'браузер';return (/Mobi|Android|iPhone|iPad/.test(u)||isMobile()?'Телефон':'ПК')+' · '+b};
const pgHm=ms=>new Date(ms).toLocaleTimeString('ru-RU',{timeZone:'Asia/Bishkek',hour:'2-digit',minute:'2-digit'});
function pubRoute(){const m=location.hash.match(/^#\/([^/]+)\/inn\/(\d+)\/?$/);if(!m)return false;pubShow(decodeURIComponent(m[1]),m[2]);return true}
function pubShow(slug,inn){let el=$('#pub');if(!el){el=document.createElement('div');el.id='pub';el.className='pub';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Страница контрагента');document.body.append(el)}
  if(!PUB.open)PUB.back=S.mod?'#'+S.mod+(S.tab?'.'+S.tab:''):'#home';PUB.open={slug,inn,logged:false};PUB.y=PUB.ky=null;el.hidden=false;document.body.classList.add('pub-on');pubDraw()}
function pubHide(){const el=$('#pub');if(el)el.hidden=true;document.body.classList.remove('pub-on');PUB.open=null}
function pubClose(){const b=PUB.back||'#home';pubHide();PUB.back='';if(location.hash!==b)location.hash=b;else route();refreshAll()}
// Выключенная страница, неизвестный ИНН, архивный контрагент и чужой адрес организации — одна и та же страница без данных
const pubCp=({slug,inn})=>feat('cppage')&&slug===ORG.slug?CPS.find(c=>c.inn===inn&&pgOn(c))||null:null;
function pubDraw(){const el=$('#pub');if(!el||!PUB.open)return;const o=PUB.open,c=pubCp(o);
  const bar=`<div class="pub-bar"><span class="pub-proto">${ic('eye','sm')}<span>Прототип: страница, которую контрагент откроет по ссылке</span></span><span class="pub-url">${ic('lock','sm')}<span class="mono">www.buhuchet.kg/${esc(o.slug)}/inn/${esc(o.inn)}</span></span><button type="button" class="btn sm" id="pub-x">${ic('x','sm')}Вернуться в программу</button></div>`;
  const brand=`<div class="pub-brand">${ic('book')}<b>Buhuchet.kg</b></div>`;
  let main;
  if(!c)main=`<div class="pub-gate">${brand}<h1>Страница недоступна</h1><p class="muted">Обратитесь к вашему бухгалтеру.</p></div>`;
  else{const p=c.page,mem=pgMem()[o.slug+'|'+o.inn];
    if(mem&&mem.code===p.code&&mem.until>Date.now())main=pubBody(c);
    else if(p.lock>Date.now())main=`<div class="pub-gate">${brand}<h1>Ввод кода временно закрыт</h1><p class="muted">Было ${PG_TRY} неверных кодов подряд. Попробуйте снова после ${pgHm(p.lock)} или попросите код у вашего бухгалтера.</p></div>`;
    else main=`<form class="pub-gate" id="pub-f" autocomplete="off">${brand}<h1>Введите код доступа</h1><p class="muted">Код из 6 цифр прислал ваш бухгалтер вместе со ссылкой.</p>${fld('Код доступа',`<input class="inp mono pub-code" id="pub-k" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••">`,{id:'pub-k',full:true})}<button type="submit" class="btn cta" id="pub-ok">Открыть</button><span class="hint">В этом браузере код запомнится на 30 дней.</span></form>`}
  el.innerHTML=bar+`<div class="pub-page">${main}<footer class="pub-foot">Страница только для просмотра. Вопросы — вашему бухгалтеру.</footer></div>`;
  $('#pub-x',el).onclick=pubClose;
  if(c&&c.page.on&&$('.pub-body',el)&&!o.logged){o.logged=true;pubSeen(c)}
  const f=$('#pub-f',el);if(f){const k=$('#pub-k',f);setTimeout(()=>k.focus(),30);k.oninput=()=>{k.value=k.value.replace(/\D/g,'').slice(0,6);setErr(f,'pub-k','')};
    f.onsubmit=e=>{e.preventDefault();const p=c.page,v=k.value.trim();if(!/^\d{6}$/.test(v)){setErr(f,'pub-k','Введите 6 цифр');return}
      if(v!==p.code){p.fails=(p.fails||0)+1;if(p.fails>=PG_TRY){p.fails=0;p.lock=Date.now()+PG_LOCK;HIST.push({at:nowStamp(),who:'client',ent:'cp',id:c.id,cp:c.id,what:`Страница контрагента: ${PG_TRY} неверных кодов подряд, ввод закрыт на 15 минут`});dbSoon();pubDraw();return}
        dbSoon();setErr(f,'pub-k',`Неверный код. Осталось попыток: ${PG_TRY-p.fails}`);k.select();return}
      p.fails=0;const m=pgMem();m[o.slug+'|'+o.inn]={code:p.code,until:Date.now()+PG_KEEP};store.set('pgmem',m);pubDraw()}}
  const y=$('#pub-y',el);if(y)y.onchange=()=>{PUB.y=y.value;pubDraw()};const ky=$('#pub-ky',el);if(ky)ky.onchange=()=>{PUB.ky=ky.value;pubDraw()};
  $$('[data-pub-file]',el).forEach(a=>a.onclick=e=>{e.preventDefault();toast(`Файл «${a.dataset.pubFile}» откроется для просмотра и скачивания`,'download')})}
// Каждое открытие — в историю контрагента: дата, время, устройство
function pubSeen(c){const d=pgDev();Object.assign(c.page,{last:nowStamp(),lastDev:d});HIST.push({at:nowStamp(),who:'client',ent:'cp',id:c.id,cp:c.id,what:`Страница контрагента открыта: ${d}`});dbSoon()}
const pubSt=r=>r.status==='Требует исправления'?'В работе':r.status;
function pubBody(c){const secs=pgSecs(c),has=k=>secs.includes(k),e=EM[c.resp];const role=x=>(ROLES.find(r=>r.id===x.role)||{}).name||'';
  const tel=ph=>ph&&ph.digits?`<a class="btn sm" href="tel:+${ph.digits}">${ic('phone','sm')}Позвонить</a><a class="btn sm" href="${waLink(ph)}" target="_blank" rel="noopener">${ic('chat','sm')}WhatsApp</a>`:'';
  const person=(x,sub)=>`<div class="pub-person"><b>${esc(x.fio)}</b><span class="hint">${esc(sub)}</span>${x.phone&&x.phone.digits?`<a class="mono" href="tel:+${x.phone.digits}">${esc(fmtPhone(x.phone))}</a>`:''}</div>`;
  const S1=[];
  S1.push(`<section class="box pub-s" data-sec="acc"><h3>${ic('user')}Ваш бухгалтер</h3>${e?`<div class="pub-person"><b>${esc(e.fio)}</b><span class="hint">${esc(role(e))}</span>${e.phone&&e.phone.digits?`<span class="mono">${esc(fmtPhone(e.phone))}</span>`:''}</div><div class="row">${tel(e.phone)}</div>`:`<span class="faint">Бухгалтер пока не назначен. Позвоните в ${esc(ORG.name)}${ORG.phone&&ORG.phone.digits?`: <a class="mono" href="tel:+${ORG.phone.digits}">${esc(fmtPhone(ORG.phone))}</a>`:''}</span>`}</section>`);
  if(has('contacts')){const ids=[c.resp,...c.assign.filter(a=>!a.to&&a.resp).map(a=>a.resp)].filter((x,i,a)=>x&&EM[x]&&EM[x].active!==false&&a.indexOf(x)===i);
    const what=id=>{const ts=c.assign.filter(a=>!a.to&&(a.resp||c.resp)===id).map(a=>T[a.t]&&T[a.t].short).filter(Boolean);return id===c.resp?'ответственный'+(ts.length?' · '+ts.join(', '):''):ts.join(', ')};
    S1.push(`<section class="box pub-s" data-sec="contacts"><h3>${ic('users')}Контакты</h3>${ids.map(id=>person(EM[id],`${role(EM[id])} · ${what(id)}`)).join('')}${ORG.phone&&ORG.phone.digits?`<div class="pub-person"><b>${esc(ORG.name)}</b><span class="hint">телефон организации</span><a class="mono" href="tel:+${ORG.phone.digits}">${esc(fmtPhone(ORG.phone))}</a></div>`:''}
      <h4>Ваши данные у нас</h4><div class="kv"><div><span class="k">Руководитель</span><span class="v">${esc(c.head||'—')}</span></div><div><span class="k">Контактное лицо</span><span class="v">${esc(c.contact||'—')}</span></div><div><span class="k">Телефон</span><span class="v mono">${esc(fmtPhone(c.phone)||'—')}</span></div></div><span class="hint">Если что-то устарело, сообщите вашему бухгалтеру.</span></section>`)}
  const S2=[];
  if(has('reports')){const all=REPORTS.filter(r=>r.cp===c.id&&!r.superseded&&r.status!=='Не требуется');const cy=TODAY.slice(0,4);const ys=[...new Set([cy,...all.map(r=>r.due.slice(0,4))])].sort().reverse();const y=ys.includes(PUB.y)?PUB.y:cy;
    const rs=all.filter(r=>r.due.slice(0,4)===y).sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:a.id-b.id);const sub=rs.filter(r=>r.status==='Сдан').length,late=rs.filter(r=>r.status!=='Сдан'&&r.due<TODAY).length;
    S2.push(`<section class="box pub-s pub-wide" data-sec="reports"><h3>${ic('file')}Отчёты<span class="grow"></span>${sel('pub-y',ys.map(x=>[x,x+' год']),y,'style="width:auto;min-height:30px;padding:3px 8px"')}</h3>
      <div class="plates static">${plate({id:'pub-sub',icon:'check',color:'green',label:'Сдано',value:sub})}${plate({id:'pub-next',icon:'clock',color:'blue',label:'Впереди',value:rs.length-sub-late})}${plate({id:'pub-late',icon:'alert',color:late?'red':'green',label:'Просрочено',value:late})}</div>
      ${rs.length?`<div class="tbl-wrap"><table class="mini m-cards"><thead><tr><th>Отчёт</th><th>Период</th><th>Срок сдачи</th><th>Статус</th>${feat('taxpay')?'<th class="num">Сумма к уплате</th><th>Оплата</th>':'<th class="num">Сумма к уплате</th>'}<th>Файлы</th></tr></thead><tbody>${rs.map(r=>{const t=T[r.t],st=pubSt(r);
        return `<tr><td title="${esc(t.name)}"><b>${esc(t.short)}</b></td><td>${esc(r.phuman)}</td><td class="${st!=='Сдан'&&r.due<TODAY?'red strong':''}">${fmtD(r.due)}</td><td>${pill(st,ST)}${st==='Сдан'&&r.subDate?` <span class="hint">${fmtD(r.subDate)}</span>`:''}</td><td class="num">${t.sum?r.sum!=null?fmtM(r.sum):'<span class="faint">ещё не рассчитана</span>':'<span class="faint">—</span>'}</td>${feat('taxpay')?`<td>${t.sum&&r.sum>0?pill(r.payStatus,PST):'<span class="faint">—</span>'}</td>`:''}<td class="wrap">${(r.files||[]).map(n=>`<a href="#" class="pub-file" data-pub-file="${esc(n)}">${ic('download','sm')}${esc(n)}</a>`).join('')||'<span class="faint">—</span>'}</td></tr>`}).join('')}</tbody></table></div>`:`<span class="faint">Отчётов со сроком в ${y} году нет</span>`}</section>`)}
  if(has('money')){const pm=ym(TODAY);const need=REPORTS.filter(r=>r.cp===c.id&&!r.superseded&&tR(r).sum&&r.sum>0&&r.paid<r.sum&&r.status!=='Не требуется'&&r.payDue&&r.payDue<=lastDay(pm)).sort((a,b)=>a.payDue<b.payDue?-1:1);
    const needSum=need.reduce((a,r)=>a+r.sum-r.paid,0),later=REPORTS.filter(r=>r.cp===c.id&&r.ear>0&&r.payDue&&r.payDue>lastDay(pm)).reduce((a,r)=>a+r.ear,0),diff=Math.round((c.avail-later-needSum)*100)/100;
    const y0=TODAY.slice(0,4),s=k=>OPS.filter(o=>o.cp===c.id&&o.kind===k&&!o.del&&(o.date||'').slice(0,4)===y0).reduce((a,o)=>a+o.amount,0);
    S2.push(`<section class="box pub-s" data-sec="money"><h3>${ic('wallet')}Деньги на налоги</h3>
      <div class="kv"><div><span class="k">Нужно оплатить до ${fmtD(lastDay(pm))}</span><span class="v tnum strong">${som(needSum)}</span></div><div><span class="k">Поступило от вас в ${y0} году</span><span class="v tnum">${som(s('in')+s('back')+s('corr'))}</span></div><div><span class="k">Оплачено в бюджет в ${y0} году</span><span class="v tnum">${som(s('pay'))}</span></div></div>
      ${diff<0?`<div class="verdict short">${ic('alert')}<span>Недостача</span><span class="big">${fmtM(-diff)}</span></div>`:diff===0?`<div class="verdict ok">${ic('ok')}<span>Достаточно</span><span class="big">${fmtM(0)}</span></div>`:`<div class="verdict ${needSum?'ok':'over'}">${ic(needSum?'ok':'info')}<span>${needSum?'Достаточно, излишек':'Излишек'}</span><span class="big">+${fmtM(diff)}</span></div>`}
      ${need.length?`<div class="tbl-wrap"><table class="mini m-cards"><thead><tr><th>Налог</th><th>Срок оплаты</th><th class="num">Осталось</th></tr></thead><tbody>${need.map(r=>`<tr><td>${esc(T[r.t].short)} · ${esc(r.plabel)}</td><td class="${r.payDue<TODAY?'red strong':''}">${fmtD(r.payDue)}</td><td class="num">${fmtM(r.sum-r.paid)}</td></tr>`).join('')}</tbody></table></div>`:'<span class="faint">Неоплаченных налогов в этом месяце нет</span>'}</section>`)}
  if(has('kpi')){const inds=IND.filter(i=>!i.archived&&kOn(i,c)).sort((a,b)=>(a.order||0)-(b.order||0));const cy=TODAY.slice(0,4);const ys=[...new Set([cy,...IVALS.filter(v=>v.cp===c.id).map(v=>v.m.slice(0,4))])].sort().reverse();const y=ys.includes(PUB.ky)?PUB.ky:cy;
    const ms=Array.from({length:12},(_,i)=>`${y}-${String(i+1).padStart(2,'0')}`).filter(m=>m<=ym(TODAY));const v=(i,m)=>{const x=kVal(c.id,i.id,m);return x?x.v:null};
    S2.push(`<section class="box pub-s pub-wide" data-sec="kpi"><h3>${ic('gauge')}Показатели<span class="grow"></span>${sel('pub-ky',ys.map(x=>[x,x+' год']),y,'style="width:auto;min-height:30px;padding:3px 8px"')}</h3>${inds.length&&ms.length?`<div class="tbl-wrap"><table class="mini"><thead><tr><th>Месяц</th>${inds.map(i=>`<th class="num">${esc(i.name)}${i.unit?`, ${esc(i.unit)}`:''}</th>`).join('')}</tr></thead><tbody>${ms.map(m=>`<tr><td>${esc(ymLabel(m))}</td>${inds.map(i=>{const x=v(i,m);return `<td class="num">${x==null?'<span class="faint">—</span>':kNum(i,x)}</td>`}).join('')}</tr>`).join('')}</tbody>
      <tfoot><tr><th>Итого за год</th>${inds.map(i=>{const a=kAgg(ms.map(m=>v(i,m))),k=i.main||'sum';return `<td class="num"><b>${a.n?kNum(i,Math.round(a[k]*100)/100):'—'}</b><div class="hint">${esc((KAGG[k]||'').toLowerCase())}</div></td>`}).join('')}</tr></tfoot></table></div>`:'<span class="faint">Показателей за этот год нет</span>'}</section>`)}
  if(has('fee')&&c.kind!=='oneoff'){const ct=curTariff(c),ms=feeMonths(c).filter(m=>feeCharge(c,m)>0||c.feePaid[m]).reverse(),a=ORG.accounts.find(x=>x.main)||ORG.accounts[0];
    S2.push(`<section class="box pub-s" data-sec="fee"><h3>${ic('coins')}Оплата за обслуживание</h3><div class="kv"><div><span class="k">Текущая ставка</span><span class="v tnum">${ct?`${som(ct.amount)} ${ct.per==='Y'?'в год':'в месяц'}`:'—'}${ct?`<div class="hint">оплата до ${c.feeDay}-го числа</div>`:''}</span></div><div><span class="k">Долг</span><span class="v tnum ${c.feeDebt?'red strong':''}">${som(c.feeDebt)}</span></div></div>
      ${ms.length?`<div class="tbl-wrap"><table class="mini m-cards"><thead><tr><th>Месяц</th><th class="num">Начислено</th><th class="num">Оплачено</th><th>Статус</th></tr></thead><tbody>${ms.map(m=>{const ch=feeCharge(c,m),p=feeGot(c,m),stx=p>=ch?'Оплачено':p>0?'Оплачено частично':'Не оплачено';return `<tr><td>${esc(ymLabel(m))}</td><td class="num">${fmtM(ch)}</td><td class="num">${fmtM(p)}</td><td>${pill(stx,PST)}</td></tr>`}).join('')}</tbody></table></div>`:''}
      ${a?`<h4>Реквизиты для оплаты</h4><div class="kv"><div><span class="k">Получатель</span><span class="v">${esc(ORG.name)}</span></div><div><span class="k">Банк</span><span class="v">${esc(a.bank)}</span></div><div><span class="k">Расчётный счёт</span><span class="v mono">${esc(a.acc)}</span></div><div><span class="k">БИК</span><span class="v mono">${esc(a.bik)}</span></div></div>`:''}</section>`)}
  const logo=ORG.logo?`<img src="${ORG.logo}" alt="" class="pub-logo">`:`<span class="pub-logo">${esc(initials(ORG.name.replace(/^(ОсОО|ИП|ОАО|ЗАО)\s+/,'').replace(/[«»"]/g,'')))}</span>`;
  return `<div class="pub-body"><header class="pub-h"><div class="pub-org">${logo}<span><b>${esc(ORG.name)}</b><span class="hint">ваша бухгалтерская компания</span></span></div><span class="hint">Данные на ${fmtD(TODAY)} ${bishkekNow().hm}</span></header>
    <div class="pub-title"><h1>${esc(c.name)}</h1><span class="muted">ИНН <span class="mono">${c.inn}</span> · ${esc(c.regime?REGIME_FULL[c.regime]||c.regime:'режим налогообложения не указан')}</span></div>
    <div class="pub-grid">${S1.join('')}${S2.join('')}</div></div>`}
