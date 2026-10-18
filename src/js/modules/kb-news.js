'use strict';
// База знаний: вкладка «Новости»
/* ═════════════ База знаний: «Новости» (ведёт администратор платформы) ═════════════ */
const NEWS_T={'Обновление':'blue','Нововведение':'green','Исправление':'orange','Объявление':'purple'};
const NEWS_ST=['Черновик','Опубликовано'];
const NEWS=DB.ref.news;
const NEWS_READ=dbSets(DB.newsRead);const newsRead=u=>NEWS_READ[u||S.me]=NEWS_READ[u||S.me]||new Set(NEWS.filter(n=>+n.ver<=28).map(n=>n.id));
const newsLive=n=>n.status==='Опубликовано'&&!n.off&&(n.date<TODAY||(n.date===TODAY&&bishkekNow().hm>='09:00'));
const newsVis=()=>NEWS.filter(n=>newsLive(n)&&(n.aud==='all'||isAdmin()));
const newsUnread=()=>{const r=newsRead();return newsVis().filter(n=>!r.has(n.id)).length};
const newsPill=t=>`<span class="pill sm ${NEWS_T[t]||'blue'}">${esc(t)}</span>`;
const newsLinkTxt=l=>!l?'':l.k==='art'?((KB_ARTS.find(a=>a.id===l.id)||{}).t||''):kbModT(l.id);
function newsOpen(n){newsRead().add(n.id);renderSide();renderSheetDot();
  openModal({size:'wide',render:()=>({title:esc(n.t),sub:`${fmtD(n.date)}${n.ver?' · версия '+esc(n.ver):''}${n.edited?' · изменено '+fmtD(n.edited):''}`,body:`<div class="row" style="gap:8px">${newsPill(n.type)}${n.pin?'<span class="tag">Закреплено</span>':''}</div><div class="kb-art">${n.html}</div>`,
    foot:`<div class="grow"></div>${n.link&&newsLinkOk(n.link)?`<button class="btn" id="nw-more">${ic('right','sm')}Подробнее: ${esc(newsLinkTxt(n.link))}</button>`:''}<button class="btn cta" data-close>Закрыть</button>`,
    mount(el,m){const b=$('#nw-more',el);if(b)b.onclick=()=>{m.close();n.link.k==='art'?kbArtDlg(KB_ARTS.find(a=>a.id===n.link.id)):go(n.link.id)}}}),onClose:()=>{if(S.mod==='kb')renderPage()}});if(S.mod==='kb')setTimeout(renderPage,0)}
const newsLinkOk=l=>l.k==='art'?kbArts().some(a=>a.id===l.id):mods().some(m=>m.id===l.id);
const NF={type:'',ver:'',q:''};
function renderNews(body){const all=newsVis();const r=newsRead();const q=NF.q.trim().toLowerCase();
  const l=all.filter(n=>(!NF.type||n.type===NF.type)&&(!NF.ver||n.ver===NF.ver)&&(!q||(n.t+' '+stripTags(n.html)).toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date));
  const vers=[...new Set(all.map(n=>n.ver).filter(Boolean))].sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
  const item=n=>{const t=stripTags(n.html);return `<button class="kb-a nw ${r.has(n.id)?'':'unread'}" data-news="${n.id}"><span class="row" style="gap:8px;flex-wrap:wrap">${newsPill(n.type)}<span class="muted">${fmtD(n.date)}${n.ver?' · версия '+esc(n.ver):''}</span>${r.has(n.id)?'':'<span class="pill sm red">Новое</span>'}${n.pin?`<span class="tag">${ic('star','sm')}Закреплено</span>`:''}</span><b>${esc(n.t)}</b><span class="hint">${esc(t.slice(0,170))}${t.length>170?'…':''}</span></button>`};
  const pins=l.filter(n=>n.pin),rest=l.filter(n=>!n.pin);const groups=[];rest.forEach(n=>{const k=n.ver||'';let g=groups.find(x=>x.k===k);if(!g)groups.push(g={k,l:[]});g.l.push(n)});
  groups.sort((a,b)=>!a.k?1:!b.k?-1:b.k.localeCompare(a.k,undefined,{numeric:true}));
  body.innerHTML=`<div class="box"><div class="row" style="flex-wrap:wrap"><span class="kb-search">${ic('search','sm')}<input class="inp" id="nw-q" placeholder="Поиск по новостям" value="${esc(NF.q)}" aria-label="Поиск по новостям"></span>${sel('nw-type',[['','Все типы'],...Object.keys(NEWS_T).map(x=>[x,x])],NF.type,'aria-label="Тип"')}${sel('nw-ver',[['','Все версии'],...vers.map(v=>[v,'Версия '+v])],NF.ver,'aria-label="Версия"')}<span class="muted">${l.length} ${plural(l.length,'новость','новости','новостей')}${r.size||all.length?` · непрочитанных ${all.filter(n=>!r.has(n.id)).length}`:''}</span>${all.some(n=>!r.has(n.id))?'<button class="linkbtn" id="nw-all">Отметить все прочитанными</button>':''}</div></div>
  ${!l.length?`<div class="state">${ic('bell','lg')}<b>${all.length?'Ничего не найдено':'Новостей пока нет'}</b>${all.length?'<button class="linkbtn" id="nw-x">Сбросить фильтры</button>':'<span>Здесь появятся новости об обновлениях платформы.</span>'}</div>`:''}
  ${pins.length?`<div class="box"><h3>Закреплено</h3><div class="kb-list">${pins.map(item).join('')}</div></div>`:''}
  ${groups.map(g=>`<div class="box"><h3>${g.k?`Версия ${esc(g.k)} — ${fmtD(g.l.reduce((a,n)=>n.date>a?n.date:a,''))}`:'Объявления'}</h3><div class="kb-list">${g.l.map(item).join('')}</div></div>`).join('')}`;
  const qi=$('#nw-q',body);qi.oninput=()=>{NF.q=qi.value;const p=qi.selectionStart;renderPage();const n=$('#nw-q');if(n){n.focus({preventScroll:true});n.setSelectionRange(p,p)}};
  $('#nw-type',body).onchange=e=>{NF.type=e.target.value;renderPage()};$('#nw-ver',body).onchange=e=>{NF.ver=e.target.value;renderPage()};
  body.onclick=e=>{const b=e.target.closest('[data-news]');if(b)return newsOpen(NEWS.find(n=>n.id===b.dataset.news));if(e.target.closest('#nw-x')){NF.type=NF.ver=NF.q='';renderPage()}if(e.target.closest('#nw-all')){all.forEach(n=>r.add(n.id));renderPage();renderSide();renderSheetDot()}}}
