'use strict';
// Модуль «База знаний»
/* ═════════════ Модуль «База знаний» ═════════════ */
function kbTabs(){const nu=newsUnread();return [{id:'level',label:'Мой уровень',icon:'grad'},{id:'lessons',label:'Уроки',icon:'list'},{id:'arts',label:'Статьи',icon:'book'},{id:'news',label:'Новости',icon:'bell',count:nu||'',red:true},can('staff')?{id:'team',label:'Уровни сотрудников',icon:'users'}:null]}
const stripTags=h=>String(h).replace(/<[^>]+>/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
function kbArts(){return KB_ARTS.filter(a=>a.active!==false&&(a.aud==='all'||(a.aud==='adm')===isAdmin())&&(!a.mod||mods().some(m=>m.id===a.mod))&&(!a.perm||can(a.perm))&&(!a.feat||feat(a.feat)))}
const kbArtOf=i=>{const l=kbArts();return (i.art&&l.find(a=>a.id===i.art))||l.find(a=>a.mod&&a.mod===kbMod(i))||null};
function kbArtDlg(a,o={}){openModal({size:'wide',render:()=>({title:esc(a.t),sub:`База знаний · ${esc(a.sec)}`,body:`<div class="kb-art">${a.html}</div>`,
  foot:`${o.help?`<button class="btn ghost" id="ka-kb">${ic('grad','sm')}Открыть Базу знаний</button>`:''}<div class="grow"></div>${a.mod&&a.mod!==S.mod&&mods().some(m=>m.id===a.mod)?`<button class="btn" id="ka-go">${ic('right','sm')}Перейти в модуль</button>`:''}<button class="btn cta" data-close>Закрыть</button>`,
  mount(el,m){const g=$('#ka-go',el);if(g)g.onclick=()=>{m.close();go(a.mod)};const k=$('#ka-kb',el);if(k)k.onclick=()=>{m.close();go('kb','level')}}})})}
// «?» в верхней панели: статья о текущем модуле
function kbHelp(){const a=kbArts().find(x=>x.mod===S.mod);if(a)return kbArtDlg(a,{help:1});const m=curMod();
  openModal({size:'mid',render:()=>({title:esc(m.title),sub:'База знаний',body:`<p style="margin:0;line-height:1.6">${esc(m.desc||'')}</p><p class="muted" style="margin:0">Отдельной статьи об этом модуле пока нет. Все статьи и уроки — в «Базе знаний».</p>`,foot:`<div class="grow"></div><button class="btn" id="ka-kb">${ic('grad','sm')}Открыть Базу знаний</button><button class="btn cta" data-close>Закрыть</button>`,mount(el,mm){$('#ka-kb',el).onclick=()=>{mm.close();go('kb','level')}}})})}
function kbModsHtml(s){return `<div class="kb-mods">${s.mods.map(g=>`<div class="kb-mod"><span class="grow">${esc(g.t)}</span><span class="chk-n ${g.d===g.n?'green':''}">${g.d} из ${g.n}</span><div class="bar chk-bar"><i style="width:${g.n?g.d/g.n*100:0}%"></i></div></div>`).join('')}</div>`}
function kbLevelsHtml(s){return `<ol class="kb-ladder">${s.lv.map((l,j)=>{const g=(s.u.got||[]).find(x=>x.l===j);const on=j<=s.cur;return `<li class="${on?'on':''} ${j===s.cur?'cur':''}"><span class="pill sm ${on?KB_CL[j]:'faint'}">${ic(on?'ok':'grad')}${j+1}</span><b>${esc(l.n)}</b><span class="muted">${j===s.lv.length-1&&l.p>=100?'100 %':'от '+l.p+' %'}</span><span class="grow"></span><span class="${on?'green':'faint'}">${on&&g?'получен '+fmtD(g.at.slice(0,10)):on?'получен':'ещё не получен'}</span></li>`}).join('')}</ol>`}
function renderKB(body,tab,fresh){if(tab==='news')return renderNews(body);const s=kbStat();const nx=ckNext();
  if(tab==='level'){body.innerHTML=`<div class="box kb-hero"><div class="row" style="flex-wrap:wrap;gap:14px"><span class="kb-big ${KB_CL[s.cur]}">${ic('grad')}</span><div class="grow" style="min-width:200px"><div class="kb-lvn">${esc(s.lv[s.cur].n)} · ${s.pct} %</div><div class="muted">Уровень ${s.cur+1} из ${s.lv.length} · выполнено ${s.d} из ${s.n} шагов вашей программы</div></div>${nx?`<button class="btn cta" data-ck-go="${nx.id}">${ic('play','sm')}Продолжить</button>`:''}</div>
    ${kbBar(s)}<div class="row"><span class="grow muted">${s.nx?`Ещё ${s.need} ${plural(s.need,'шаг','шага','шагов')} до уровня «${esc(s.nx.n)}».`:'Вы прошли всю свою программу: это высший уровень.'}</span>${nx?`<span class="hint">Следующий шаг: ${nx.star?'★ ':''}${esc(nx.t)}</span>`:''}</div>
    <div class="hint">Программа строится из ваших прав: шагов, на которые у вас нет права, в ней нет, и они не мешают получить уровень. Полученный уровень не понижается.</div></div>
    <div class="box"><h3>Прогресс по модулям</h3>${kbModsHtml(s)}</div><div class="box"><h3>Уровни</h3>${kbLevelsHtml(s)}</div>`;
    body.onclick=e=>{const b=e.target.closest('[data-ck-go]');if(b)ckGo(b.dataset.ckGo)};return}
  if(tab==='arts'){const l=kbArts();const q=KB.q.trim().toLowerCase();const f=q?l.filter(a=>(a.t+' '+stripTags(a.html)).toLowerCase().includes(q)):l;const secs=[...new Set(f.map(a=>a.sec))];
    const snip=a=>{const t=stripTags(a.html);if(!q)return esc(t.slice(0,150))+(t.length>150?'…':'');const k=t.toLowerCase().indexOf(q);if(k<0)return esc(t.slice(0,150));const st=Math.max(0,k-60);return (st?'…':'')+esc(t.slice(st,k))+'<mark>'+esc(t.slice(k,k+q.length))+'</mark>'+esc(t.slice(k+q.length,k+q.length+90))+'…'};
    body.innerHTML=`<div class="box"><div class="row"><span class="kb-search">${ic('search','sm')}<input class="inp" id="kb-q" placeholder="Поиск по тексту статей" value="${esc(KB.q)}" aria-label="Поиск по тексту статей"></span><span class="muted">${f.length} ${plural(f.length,'статья','статьи','статей')}</span></div></div>
    ${secs.length?secs.map(sc=>`<div class="box"><h3>${esc(sc)}</h3><div class="kb-list">${f.filter(a=>a.sec===sc).map(a=>`<button class="kb-a" data-art="${a.id}"><b>${esc(a.t)}</b><span class="hint">${snip(a)}</span>${a.mod?`<span class="tag">${esc(kbModT(a.mod))}</span>`:''}</button>`).join('')}</div></div>`).join(''):`<div class="state">${ic('search','lg')}<b>Ничего не найдено</b><span>Попробуйте другое слово.</span><button class="linkbtn" id="kb-qx">Сбросить поиск</button></div>`}`;
    const qi=$('#kb-q',body);qi.oninput=()=>{KB.q=qi.value;const p=qi.selectionStart;renderPage();const n=$('#kb-q');if(n){n.focus({preventScroll:true});n.setSelectionRange(p,p)}};
    body.onclick=e=>{const b=e.target.closest('[data-art]');if(b)kbArtDlg(KB_ARTS.find(a=>a.id===b.dataset.art));if(e.target.closest('#kb-qx')){KB.q='';renderPage()}};return}
  if(tab==='team'){if(!can('staff')){body.innerHTML=`<div class="state">${ic('lock','lg')}<b>Нет доступа</b><span>Уровни сотрудников видят владелец и роль с правом «Сотрудники и роли».</span></div>`;return}
    const P={};EMP.forEach(e=>P[e.id]=kbFor(e.id));body.innerHTML='<div id="kbg"></div>';
    grid($('#kbg',body),{id:'kb-team',cols:[
      {key:'fio',label:'Сотрудник',type:'text',w:260,val:e=>e.fio,html:e=>`<span class="strong">${esc(e.fio)}</span>`},
      {key:'role',label:'Роль',type:'enum',w:170,val:e=>ROLES.find(r=>r.id===e.role).name},
      {key:'lvl',label:'Уровень',type:'enum',w:230,val:e=>P[e.id].lv[P[e.id].cur].n,sortVal:e=>P[e.id].cur*1000+P[e.id].pct,html:e=>kbBadge(P[e.id],{nopct:1})},
      {key:'pct',label:'Прогресс, %',type:'int',w:120,num:true,val:e=>P[e.id].pct},
      {key:'steps',label:'Выполнено шагов',type:'text',w:150,val:e=>`${P[e.id].d} из ${P[e.id].n}`,sortVal:e=>P[e.id].d},
      {key:'at',label:'Дата последнего уровня',type:'date',w:170,val:e=>P[e.id].last?P[e.id].last.at.slice(0,10):''}],
      rows:()=>EMP,title:'fio',noun:['сотрудник','сотрудника','сотрудников'],rowClass:e=>e.active?'':'muted',open:e=>kbUserDlg(e),actions:e=>[{label:'Прогресс по модулям',icon:'grad',run:()=>kbUserDlg(e)}],sort:{key:'lvl',dir:-1},simulateLoad:fresh});return}
  // Уроки
  const closed=new Set(store.get('ck.closed.'+S.me,[]));const gs=s.gs;
  if(!gs.length){body.innerHTML=`<div class="state">${ic('list','lg')}<b>Шагов нет</b><span>Для ваших прав программа пуста.</span></div>`;return}
  const row=i=>{const d=ckDone(i),k=ckSkip(i);const art=kbArtOf(i);return `<div class="ck-i ${d?'ok':''} ${k?'skip':''} ${nx&&nx.id===i.id?'next':''}" data-cki="${i.id}">
    <span class="ck-st">${ic(d?'ok':k?'ban':'circle')}</span>
    <div class="grow" style="min-width:0"><div class="ck-t">${i.star?'<span class="ck-star" title="Основной шаг: без него организация не может работать">★</span>':i.learn?'<span class="tag">Изучить</span>':''}${i.isNew?' <span class="pill sm blue">Новое</span>':''} <b>${esc(i.t)}</b></div><div class="hint">${esc(i.w||'')}${art?` · <button class="linkbtn" data-ck-art="${art.id}">Статья</button>`:''}${d?` · <span class="green">${ckU().done[i.id]==='hand'?'отмечено вручную':'выполнено'}</span>`:k?' · пропущено':''}</div></div>
    <div class="ck-act">${d?'':`<button class="btn sm cta" data-ck-go="${i.id}">Перейти</button><button class="btn sm" data-ck-how="${i.id}">Показать как</button>`}<button class="icon-btn sm" data-ck-menu="${i.id}" aria-label="Ещё">${ic('more','sm')}</button></div></div>`};
  body.innerHTML=`<div class="box chk"><h3>${isAdmin()?'Программа администратора платформы':'Ваша программа обучения'}<span class="grow"></span>${kbBadge(s)}</h3>
    ${kbBar(s)}
    <div class="row"><span class="grow muted">Выполнено ${s.d} из ${s.n} · ${s.nx?kbNextTxt(s):'высший уровень'}. Шаги отмечаются сами, когда действие сохранено.</span>${nx?`<button class="btn cta" data-ck-go="${nx.id}">${ic('play','sm')}Продолжить: ${esc(nx.t.length>40?nx.t.slice(0,38)+'…':nx.t)}</button>`:''}</div></div>
  ${gs.map((g,gi)=>{const dn=g.items.filter(ckRes).length;const op=!closed.has(g.id);return `<div class="box ck-g" data-ckg="${g.id}"><button class="ck-gh" data-ck-tog="${g.id}" aria-expanded="${op}">${`<span class="ck-chev ${op?'op':''}">${ic('right','sm')}</span>`}<b class="grow">${gi+1}. ${esc(g.t)}</b><span class="chk-n ${dn===g.items.length?'green':''}">${dn} из ${g.items.length}</span></button>${op?`<div class="ck-list">${g.items.map(row).join('')}</div>`:''}</div>`}).join('')}`;
  body.onclick=e=>{let b;
    if(b=e.target.closest('[data-ck-tog]')){const id=b.dataset.ckTog;closed.has(id)?closed.delete(id):closed.add(id);store.set('ck.closed.'+S.me,[...closed]);renderPage();return}
    if(b=e.target.closest('[data-ck-art]')){kbArtDlg(KB_ARTS.find(a=>a.id===b.dataset.ckArt));return}
    if(b=e.target.closest('[data-ck-go]')){ckGo(b.dataset.ckGo);return}
    if(b=e.target.closest('[data-ck-how]')){ckHow(b.dataset.ckHow);return}
    if(b=e.target.closest('[data-ck-menu]')){const i=ckFind(b.dataset.ckMenu);const sc=ckU();const d=ckDone(i),k=ckSkip(i);
      menu(b,[i.learn&&!d?{label:'Отметить как изучено',icon:'ok',run:()=>{ckMark(i,'hand');kbSync(false);renderPage();renderSide()}}:null,!d&&!k?{label:'Пропустить',icon:'ban',sub:'Шаг станет серым: в уровень не засчитывается, но и не мешает идти дальше',run:()=>{sc.skip[i.id]=1;renderPage()}}:null,k?{label:'Вернуть',icon:'refresh',run:()=>{delete sc.skip[i.id];renderPage()}}:null,{label:'Показать как',icon:'play',run:()=>ckHow(i.id)}].filter(Boolean))}};
  if(nx&&S.preset!=='keep')setTimeout(()=>{const el=$(`[data-cki="${nx.id}"]`);if(el&&!closed.has(gs.find(g=>g.items.includes(nx)).id)){el.scrollIntoView({block:'center'});el.classList.add('ck-flash');setTimeout(()=>el.classList.remove('ck-flash'),2200)}},60)}
function kbUserDlg(e){const s=kbFor(e.id);openModal({size:'mid',render:()=>({title:esc(e.fio),sub:`${esc(ROLES.find(r=>r.id===e.role).name)} · уровень знаний`,body:`<div class="box"><div class="row">${kbBadge(s,{big:1})}<span class="grow"></span><span class="muted">${s.d} из ${s.n} шагов</span></div>${kbBar(s)}<span class="hint">${s.nx?kbNextTxt(s):'Высший уровень'} · программа сотрудника строится из его прав</span></div><div class="box"><h3>Прогресс по модулям</h3>${kbModsHtml(s)}</div><div class="box"><h3>Уровни</h3>${kbLevelsHtml(s)}</div>`,foot:'<div class="grow"></div><button class="btn cta" data-close>Готово</button>'})})}
// Блок уровня для «Мой профиль» и карточки сотрудника
function kbBox(s,o={}){return `<div class="box kb-box"><h3>Уровень знаний<span class="grow"></span>${o.link?`<button class="linkbtn" id="${o.link}" style="text-transform:none;letter-spacing:0;font-size:12.5px">Открыть Базу знаний</button>`:''}</h3><div class="row">${kbBadge(s,{big:1})}<span class="grow"></span><span class="muted">${s.d} из ${s.n} шагов</span></div>${kbBar(s)}<span class="hint">${s.nx?kbNextTxt(s):'Высший уровень'}${s.last?` · уровень «${esc(s.lv[s.cur].n)}» получен ${fmtD(((s.u.got||[]).find(x=>x.l===s.cur)||s.last).at.slice(0,10))}`:''}</span>${o.mods?kbModsHtml(s):''}</div>`}
/* Приветствие при первом входе — внутри окна «Что нового» (whatsNew, вкладка «Новости») */
const kbDot=()=>{try{return kbStat().pct===0}catch(e){return false}};
function renderSheetDot(){const b=$('#burger');if(b)b.classList.toggle('has-dot',(!!kbDot()||newsUnread()>0)&&isMobile())}
