'use strict';
// Добавление и изменение контрагента
/* ── Add counterparty ── */
/* Ставка по виду: выбирается из ставок каталога, если их несколько */
const DEF_RATE=DB.ref.defaultRates;const defRate=t=>DEF_RATE[t.id]&&t.rates.includes(DEF_RATE[t.id])?DEF_RATE[t.id]:t.rates[0];
function rateRows(chosen,rates,fixed){const ids=[...chosen].filter(id=>T[id].rates&&T[id].rates.length);if(!ids.length)return '';
  return `<div class="tbl-wrap"><table class="mini"><thead><tr><th>Вид отчёта</th><th>Ставка</th>${fixed?'<th class="num">Повторяющаяся сумма, сом</th>':''}</tr></thead><tbody>${ids.map(id=>{const t=T[id];return `<tr><td><b>${esc(t.short)}</b> <span class="faint">${esc(t.name)}</span></td><td>${t.rates.length>1?sel('rt-'+id,t.rates,rates[id]||defRate(t),`data-rate="${id}" style="min-height:30px;padding:3px 8px;width:auto"`):esc(t.rates[0])}</td>${fixed?`<td class="num">${t.sum?`<input class="inp tnum" data-fix="${id}" value="${fixed[id]??''}" inputmode="decimal" placeholder="нет" style="max-width:120px;margin-left:auto;text-align:right;min-height:30px;padding:3px 8px" aria-label="Повторяющаяся сумма ${esc(t.short)}">`:'<span class="faint">—</span>'}</td>`:''}</tr>`}).join('')}</tbody></table></div>`}
const bindRates=(el,rates,fixed)=>{$$('[data-rate]',el).forEach(s=>s.onchange=()=>rates[s.dataset.rate]=s.value);if(fixed)$$('[data-fix]',el).forEach(i=>i.oninput=()=>{const n=parseNum(i.value);if(isNaN(n))delete fixed[i.dataset.fix];else fixed[i.dataset.fix]=n})};
function addCpDlg(kind){
  const st={regime:'Единый налог',regime2:'',ben:[],form:'ОсОО',kind:kind||'regular',per:'M',sel:new Set(),rates:{}};
  openModal({form:true,size:'mid',render:m=>{const fake={regime:st.regime,regime2:st.regime2,ben:st.ben,form:st.form,assign:[...st.sel].filter(id=>['enq','enm'].includes(id)).map(id=>({t:id,rate:st.rates[id]||defRate(T[id])}))};const d=st.d||{};const reg=st.kind==='regular';const feeOn=feat('fee')&&can('fee')&&reg;
    return {title:'Новый контрагент',sub:'Обязательные поля отмечены звёздочкой, остальные можно заполнить позже',body:`<div class="form">
    <div class="fld full"><label>Тип обслуживания</label><div class="seg" role="group" aria-label="Тип обслуживания" id="nc-kind" style="align-self:flex-start;width:max-content">${[['regular','Постоянное обслуживание'],['oneoff','Разовое']].map(([k,l])=>`<button type="button" data-k="${k}" class="${st.kind===k?'on':''}">${l}</button>`).join('')}</div><div class="hint">${reg?'Сдаёт отчёты, платит за обслуживание по тарифу.':'Отчётов и тарифа нет: только разовые услуги и проекты. Потом можно перевести в постоянное.'}</div></div>
    ${fld('Название',inp('nc-name',d.name||'','placeholder="ОсОО «Компания»"'),{req:true,full:true,id:'nc-name'})}
    ${fld('ИНН',inp('nc-inn',d.inn||'','inputmode="numeric" maxlength="14" class="inp mono" placeholder="14 цифр"'),{req:true,id:'nc-inn'})}
    ${fld('Телефон (звонок и WhatsApp)',phoneInput('nc-ph',d.ph),{req:true,id:'nc-ph'})}
    ${fld('Форма собственности',sel('nc-form',DICT.forms.items.filter(x=>x.active).map(x=>x.name),st.form),{id:'nc-form'})}
    ${fld('Режим налогообложения',sel('nc-reg',[['','— не указан —'],...DICT.regimes.items.filter(x=>x.active).map(x=>[x.name,REGIME_FULL[x.name]||x.name])],st.regime),{id:'nc-reg',hint:st.regime?'':'Не обязательно. Без режима доступны все виды отчётов — проверьте назначение вручную.'})}
    ${st.regime?fld('Дополнительный режим',sel('nc-reg2',reg2Opts(st.regime,st.regime2),st.regime2),{id:'nc-reg2',hint:'Если контрагент совмещает режимы по разным видам деятельности, например ОНР и майнинг'}):''}
    ${fld('Льготы и особые статусы',benChips('nc-ben',st.ben),{full:true,id:'nc-ben',hint:'Необязательно. Подсказывают льготную ставку и какие отчёты не нужны'})}
    ${fld('Налоговый орган (УГНС)',sel('nc-ugns',[['','— не указан —'],...DICT.ugns.items.filter(x=>x.active).map(x=>[ugK(x),ugT(x)])],d.ugns||''),{id:'nc-ugns',hint:'Список ведёт администратор платформы'})}
    ${reg?fld('Какие отчёты сдаёт',typeChips('nc-types',fake,st.sel),{req:true,full:true,id:'nc-types',hint:'Доступны только виды, подключённые организацией и подходящие к режиму. Наведите на недоступный, чтобы увидеть причину.'}):''}
    ${reg?`<div class="fld full">${benHint(fake,st.sel)}</div>`:''}
    ${reg&&st.sel.size?`<div class="fld full"><label>Ставки налога</label>${rateRows(st.sel,st.rates)||'<span class="faint">У выбранных видов ставка не выбирается</span>'}<div class="hint">Ставки ведёт администратор платформы в каталоге видов отчётов. Повторяющуюся сумму (например, патент) можно задать позже в «Назначить отчёты».</div></div>`:''}
    ${fld('Ответственный бухгалтер',sel('nc-resp',[['','— выберите —'],...EMP.filter(e=>e.active).map(e=>[e.id,e.short])],d.resp||(me().role==='acc'?S.me:'')),{req:true,id:'nc-resp'})}
    ${fld(reg?'Дата начала обслуживания':'Дата первого обращения',inp('nc-start',d.start||TODAY,'type="date"'),{id:'nc-start'})}
    ${feeOn?`${fld('Стоимость обслуживания, сом',`<div class="row" style="flex-wrap:nowrap">${inp('nc-fee',d.fee||'','inputmode="decimal" class="inp tnum"')}<div class="seg" role="group" aria-label="Периодичность оплаты" id="nc-per" style="flex-shrink:0;white-space:nowrap">${[['M','в месяц'],['Y','в год']].map(([k,l])=>`<button type="button" data-p="${k}" class="${st.per===k?'on':''}">${l}</button>`).join('')}</div></div>`,{req:true,id:'nc-fee',hint:st.per==='Y'?'Годовой тариф начисляется раз в год, в месяце начала обслуживания':''})}${st.per==='M'?fld('Первый неполный месяц',sel('nc-first',[['prorate','Пропорционально дням'],['full','Полный месяц'],['next','Со следующего месяца']],d.first||'prorate'),{id:'nc-first'}):'<div></div>'}`:reg&&feat('fee')?`<div class="note full" style="grid-column:1/-1">${ic('lock')}<span>Стоимость обслуживания вам не видна. Её внесёт владелец или сотрудник с правом «Плата за обслуживание».</span></div>`:''}
    ${reg&&feat('taxpay')?`<label class="check-row full" style="grid-column:1/-1"><input type="checkbox" class="sw" id="nc-needf" ${d.needf?'checked':''}><span class="grow">Обязательно требовать прикрепления при поступлении от контрагента<div class="hint">Поступление денег нельзя будет сохранить без скрина перевода или квитанции</div></span></label>`:''}
    ${fld('Руководитель',inp('nc-head',d.head||''),{id:'nc-head'})}${fld('Контактное лицо',inp('nc-contact',d.contact||''),{id:'nc-contact'})}${fld('Номер договора',inp('nc-cno',d.cno||'','placeholder="Например: 45/26"'),{id:'nc-cno'})}${fld('Дата договора',inp('nc-cdate',d.cdate||'','type="date"'),{id:'nc-cdate'})}
    ${fld('Примечание',`<textarea class="inp" id="nc-note" style="min-height:60px">${esc(d.note||'')}</textarea>`,{full:true,id:'nc-note'})}
    </div><div id="nc-pro" class="hint"></div>`,
    foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="nc-ok">Сохранить контрагента</button>',
    mount(el){bindPhone(el,'nc-ph');bindRates(el,st.rates);
      const snap=()=>{st.d={name:val(el,'nc-name'),inn:val(el,'nc-inn'),ph:readPhone(el,'nc-ph').ph,resp:val(el,'nc-resp'),start:val(el,'nc-start'),ugns:val(el,'nc-ugns'),fee:$('#nc-fee',el)?val(el,'nc-fee'):(st.d||{}).fee||'',first:$('#nc-first',el)?val(el,'nc-first'):'prorate',head:val(el,'nc-head'),contact:val(el,'nc-contact'),cno:val(el,'nc-cno'),cdate:val(el,'nc-cdate'),note:val(el,'nc-note'),needf:!!($('#nc-needf',el)&&$('#nc-needf',el).checked)}};
      const pro=()=>{const p=$('#nc-pro',el);if(!$('#nc-fee',el)){p.textContent='';return}const n=parseNum(val(el,'nc-fee')),s=val(el,'nc-start'),f=$('#nc-first',el)?val(el,'nc-first'):'full';if(isNaN(n)||!s){p.textContent='';return}const k=s.slice(0,7);const days=+lastDay(k).slice(8),left=days-(+s.slice(8))+1;
        if(st.per==='Y'){p.textContent=`Начисление ${som(n)} раз в год: в ${ymLabel(k)}, затем каждый ${MONTHS[+k.slice(5)-1].toLowerCase()}.`;return}
        p.textContent=s.slice(8)==='01'?`За ${ymLabel(k)} начислится полная ставка ${som(n)}.`:f==='prorate'?`За ${ymLabel(k)}: ${fmtM(n,false)} × ${left} / ${days} = ${som(Math.round(n*left/days))}`:f==='full'?`За ${ymLabel(k)} начислится полная ставка ${som(n)}.`:`За ${ymLabel(k)} ничего не начислится, с ${ymG(addMonths(k,1))} — ${som(n)}.`};
      ['nc-fee','nc-start','nc-first'].forEach(i=>{const x=$('#'+i,el);if(x){x.addEventListener('input',pro);x.addEventListener('change',pro)}});pro();
      $('#nc-kind',el).onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;snap();st.kind=b.dataset.k;m.draw()};
      if($('#nc-per',el))$('#nc-per',el).onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;snap();st.per=b.dataset.p;m.draw()};
      if($('#nc-reg2',el))$('#nc-reg2',el).onchange=e=>{snap();st.regime2=e.target.value;m.draw()};
      $('#nc-ben',el).onclick=e=>{const b=e.target.closest('[data-b]');if(!b)return;snap();const n=b.dataset.b;st.ben=st.ben.includes(n)?st.ben.filter(x=>x!==n):[...st.ben,n];m.draw()};
      $('#nc-reg',el).onchange=e=>{snap();st.regime=e.target.value;if(st.regime2===st.regime||!st.regime)st.regime2='';[...st.sel].forEach(id=>{if(compatible(T[id],{regime:st.regime,regime2:st.regime2,form:st.form}))st.sel.delete(id)});m.draw()};
      $('#nc-form',el).onchange=e=>{snap();st.form=e.target.value;[...st.sel].forEach(id=>{if(compatible(T[id],{regime:st.regime,form:st.form}))st.sel.delete(id)});m.draw()};
      if($('#nc-types',el))$('#nc-types',el).onclick=e=>{const b=e.target.closest('[data-t]');if(!b||b.disabled)return;snap();st.sel.has(b.dataset.t)?st.sel.delete(b.dataset.t):st.sel.add(b.dataset.t);m.draw()};
      $('#nc-inn',el).addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,14)});
      $('#nc-ok',el).onclick=()=>{if(m.saving)return;const name=val(el,'nc-name'),inn=val(el,'nc-inn'),ph=readPhone(el,'nc-ph'),resp=val(el,'nc-resp');
        const dup=CPS.find(c=>c.inn===inn);
        const ok=[setErr(el,'nc-name',name?'':'Введите название'),
          setErr(el,'nc-inn',!/^\d{14}$/.test(inn)?'ИНН — ровно 14 цифр':!/^[0-2]/.test(inn)?'ИНН в КР начинается с 0, 1 или 2':dup?`Такой ИНН уже есть: ${dup.name}${dup.archived?' (в архиве — верните его из архива, а не создавайте заново)':''}`:''),
          setErr(el,'nc-ph',ph.empty?'Введите номер телефона':!ph.ok?`Номер для этой страны — ${ph.need} цифр`:''),
          reg?setErr(el,'nc-types',st.sel.size?'':'Выберите хотя бы один отчёт'):true,
          setErr(el,'nc-resp',resp?'':'Выберите ответственного'),
          $('#nc-fee',el)?setErr(el,'nc-fee',isNaN(parseNum(val(el,'nc-fee')))||parseNum(val(el,'nc-fee'))<0?'Введите сумму, 0 — допустимо':''):true].every(Boolean);
        if(dup&&dup.archived&&can('createCp')){const e=el.querySelector('[data-f="nc-inn"] .err');if(e){e.insertAdjacentHTML('beforeend',' <button type="button" class="btn xs" id="nc-unarch">Вернуть из архива</button>');$('#nc-unarch',el).onclick=()=>{m.close();unarchiveCp(dup);openCp(dup)}}}
        if(!ok){const f=el.querySelector('.fld.bad');f&&f.scrollIntoView({block:'center',behavior:'smooth'});return}
        m.saving=true;const start=val(el,'nc-start')||TODAY;
        const c={id:CPID++,name,inn,phone:ph.ph,form:st.form,regime:st.regime,regime2:st.regime2,ben:[...st.ben],resp,head:val(el,'nc-head'),contact:val(el,'nc-contact'),start,contract:(()=>{const cno=val(el,'nc-cno').trim(),cd=val(el,'nc-cdate');return cno||cd?`${cno?'№ '+cno:'Без номера'}${cd?' от '+fmtD(cd):''}`:'—'})(),note:val(el,'nc-note'),paysTo:'emp',archived:false,assign:[],tariffs:[],feeDay:10,feePaid:{},first:$('#nc-first',el)?val(el,'nc-first'):'full',files:[],
          kind:st.kind,ugns:val(el,'nc-ugns')||null,oneSum:false,needInFile:!!($('#nc-needf',el)&&$('#nc-needf',el).checked),periods:reg?[{from:start.slice(0,7),to:null}]:[]};
        if($('#nc-fee',el))c.tariffs.push({amount:parseNum(val(el,'nc-fee')),per:st.per,from:start.slice(0,7),by:S.me,at:TODAY,note:'Первая ставка'});
        if(!st.regime)setTimeout(()=>toast('Режим налогообложения не указан: проверьте, что назначены правильные отчёты','alert',true),1600);
        const nR=REPORTS.length,nH=HIST.length;
        try{born(c);CPS.push(c);CPM[c.id]=c;log('cp',c.id,reg?'Контрагент создан':'Создан разовый контрагент',c.id);if(reg)assignTypes(c,[...st.sel],start,st.rates)}
        catch(err){m.saving=false;const i=CPS.indexOf(c);if(i>=0)CPS.splice(i,1);delete CPM[c.id];REPORTS.length=nR;HIST.length=nH;console.error(err);toast('Не удалось сохранить контрагента, ничего не создано. Попробуйте ещё раз','alert',true);return}
        m.close();refreshAll();toast(reg?`Контрагент добавлен, отчётов создано: ${REPORTS.filter(r=>r.cp===c.id).length}`:'Разовый контрагент добавлен','building');openCp(c)}}};
  }});
}

/* ── Edit counterparty: реквизиты (тип обслуживания, отчёты, тариф и дата начала меняются своими действиями) ── */
function editCpDlg(c){
  const cm=String(c.contract||'').match(/№\s*(\S+)(?:\s+от\s+(\d\d)\.(\d\d)\.(\d{4}))?/);
  const st={form:c.form,regime:c.regime||'',regime2:c.regime2||'',ben:[...(c.ben||[])],d:{name:c.name,inn:c.inn,ph:c.phone,head:c.head||'',contact:c.contact||'',note:c.note||'',cno:cm?cm[1]:'',cdate:cm&&cm[2]?`${cm[4]}-${cm[3]}-${cm[2]}`:'',feeDay:c.feeDay}};
  const feeOn=feat('fee')&&can('fee')&&c.kind!=='oneoff';
  openModal({form:true,size:'mid',render:m=>{const d=st.d;const bad=c.assign.filter(a=>!a.to&&compatible(T[a.t],{regime:st.regime,regime2:st.regime2,form:st.form,assign:c.assign}));
    return {title:'Изменить контрагента',sub:esc(c.name),body:`<div class="form">
    ${fld('Название',inp('ec-name',d.name,'placeholder="ОсОО «Компания»"'),{req:true,full:true,id:'ec-name'})}
    ${fld('ИНН',inp('ec-inn',d.inn,'inputmode="numeric" maxlength="14" class="inp mono" placeholder="14 цифр"'),{req:true,id:'ec-inn'})}
    ${fld('Телефон (звонок и WhatsApp)',phoneInput('ec-ph',d.ph),{req:true,id:'ec-ph'})}
    ${fld('Форма собственности',sel('ec-form',DICT.forms.items.filter(x=>x.active||x.name===c.form).map(x=>x.name),st.form),{id:'ec-form'})}
    ${fld('Режим налогообложения',sel('ec-reg',[['','— не указан —'],...DICT.regimes.items.filter(x=>x.active||x.name===c.regime).map(x=>[x.name,REGIME_FULL[x.name]||x.name])],st.regime),{id:'ec-reg'})}
    ${st.regime?fld('Дополнительный режим',sel('ec-reg2',reg2Opts(st.regime,st.regime2),st.regime2),{id:'ec-reg2'}):'<div></div>'}
    ${fld('Льготы и особые статусы',benChips('ec-ben',st.ben),{full:true,id:'ec-ben'})}
    <div class="full" style="grid-column:1/-1">${benHint({ben:st.ben},new Set(c.assign.filter(a=>!a.to).map(a=>a.t)))}</div>
    ${bad.length?`<div class="note warn full" style="grid-column:1/-1">${ic('alert')}<span>Назначенные отчёты не меняются сами. Не подходят к новому режиму или форме: ${bad.map(a=>esc(T[a.t].short)).join(', ')}. Проверьте их в «Назначить отчёты».</span></div>`:''}
    ${fld('Руководитель',inp('ec-head',d.head),{id:'ec-head'})}${fld('Контактное лицо',inp('ec-contact',d.contact),{id:'ec-contact'})}
    ${fld('Номер договора',inp('ec-cno',d.cno,'placeholder="Например: 45/26"'),{id:'ec-cno'})}${fld('Дата договора',inp('ec-cdate',d.cdate,'type="date"'),{id:'ec-cdate'})}
    ${feeOn?fld('День оплаты обслуживания',inp('ec-fday',d.feeDay,'type="number" min="1" max="28" class="inp tnum"'),{id:'ec-fday',hint:'Число месяца, до которого контрагент платит за обслуживание (1–28)'}):''}
    ${fld('Примечание',`<textarea class="inp" id="ec-note" style="min-height:60px">${esc(d.note)}</textarea>`,{full:true,id:'ec-note'})}
    </div><div class="hint">Тип обслуживания, отчёты, тариф, ответственный и периоды обслуживания меняются своими действиями в карточке.</div>`,
    foot:'<button class="btn ghost" data-close>Отмена</button><button class="btn cta" id="ec-ok">Сохранить</button>',
    mount(el){bindPhone(el,'ec-ph');
      const snap=()=>{st.d={name:val(el,'ec-name'),inn:val(el,'ec-inn'),ph:readPhone(el,'ec-ph').ph||st.d.ph,head:val(el,'ec-head'),contact:val(el,'ec-contact'),note:val(el,'ec-note'),cno:val(el,'ec-cno'),cdate:val(el,'ec-cdate'),feeDay:$('#ec-fday',el)?val(el,'ec-fday'):st.d.feeDay}};
      $('#ec-reg',el).onchange=e=>{snap();st.regime=e.target.value;if(st.regime2===st.regime||!st.regime)st.regime2='';m.draw()};if($('#ec-reg2',el))$('#ec-reg2',el).onchange=e=>{snap();st.regime2=e.target.value;m.draw()};
      $('#ec-ben',el).onclick=e=>{const b=e.target.closest('[data-b]');if(!b)return;snap();const n=b.dataset.b;st.ben=st.ben.includes(n)?st.ben.filter(x=>x!==n):[...st.ben,n];m.draw()};$('#ec-form',el).onchange=e=>{snap();st.form=e.target.value;m.draw()};
      $('#ec-inn',el).addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,14)});
      $('#ec-ok',el).onclick=()=>{const name=val(el,'ec-name'),inn=val(el,'ec-inn'),ph=readPhone(el,'ec-ph');const dup=CPS.find(x=>x.inn===inn&&x.id!==c.id);const fd=$('#ec-fday',el)?parseInt(val(el,'ec-fday'),10):c.feeDay;
        const ok=[setErr(el,'ec-name',name?'':'Введите название'),
          setErr(el,'ec-inn',!/^\d{14}$/.test(inn)?'ИНН — ровно 14 цифр':!/^[0-2]/.test(inn)?'ИНН в КР начинается с 0, 1 или 2':dup?`Такой ИНН уже есть: ${dup.name}${dup.archived?' (в архиве)':''}`:''),
          setErr(el,'ec-ph',ph.empty?'Введите номер телефона':!ph.ok?`Номер для этой страны — ${ph.need} цифр`:''),
          $('#ec-fday',el)?setErr(el,'ec-fday',fd>=1&&fd<=28?'':'Число от 1 до 28'):true].every(Boolean);
        if(!ok){const f=el.querySelector('.fld.bad');f&&f.scrollIntoView({block:'center',behavior:'smooth'});return}
        const cno=val(el,'ec-cno'),cd=val(el,'ec-cdate');
        const nv={name,inn,phone:ph.ph,form:st.form,regime:st.regime,regime2:st.regime2,ben:[...st.ben],head:val(el,'ec-head'),contact:val(el,'ec-contact'),note:val(el,'ec-note'),contract:cno||cd?`${cno?'№ '+cno:'Без номера'}${cd?' от '+fmtD(cd):''}`:'—',feeDay:fd};
        const L={name:'название',inn:'ИНН',phone:'телефон',form:'форма собственности',regime:'режим налогообложения',regime2:'дополнительный режим',ben:'льготы и особые статусы',head:'руководитель',contact:'контактное лицо',note:'примечание',contract:'договор',feeDay:'день оплаты обслуживания'};
        const ch=Object.keys(nv).filter(k=>JSON.stringify(nv[k]??'')!==JSON.stringify(c[k]??''));
        if(!ch.length){m.close();return toast('Изменений нет')}
        const was=bad.length;Object.assign(c,nv);touch(c);log('cp',c.id,'Изменено: '+ch.map(k=>L[k]).join(', '),c.id);m.close();refreshAll();
        toast('Контрагент сохранён');if(was&&(ch.includes('regime')||ch.includes('regime2')||ch.includes('form')))setTimeout(()=>toast('Проверьте назначенные отчёты: часть не подходит к новому режиму или форме','alert',true),1400)}}}}});
}

