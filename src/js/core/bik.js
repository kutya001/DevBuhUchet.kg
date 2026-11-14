'use strict';
/* ═════════════ Справочник «БИК банков» (решение заказчика 14.11.2026) ═════════════
   БИК участников платёжной системы КР по данным НБКР: {bik, swift, type, name, addr, status, succ, bank — код провайдера или ''}.
   Первые три цифры БИК — код банка, головной офис — «<код>001». У провайдера банка «Код банка в БИК» (bikCode, 3 цифры).
   В «Расчётном счёте» БИК вписывается первым: банк и филиал определяются сами; БИК не из справочника — банк выбирается вручную, счёт с отметкой bikOff */
const BIK_T=['НБКР','Банк','Филиал банка','ЦК КР','Нерезидент'];
const BIK_ST=['Активный','Введены ограничения','Приостановлен','Закрыт'];
const BIK_STC={'Активный':['green','check'],'Введены ограничения':['yellow','alert'],'Приостановлен':['orange','pause'],'Закрыт':['red','ban'],'':['gray','circle']};
// Коды из файла НБКР: тип участника 1, 2, 3, 4, 7; статус 1, 2, 3, 0
const BIK_T_N={1:'НБКР',2:'Банк',3:'Филиал банка',4:'ЦК КР',7:'Нерезидент'},BIK_ST_N={1:'Активный',2:'Введены ограничения',3:'Приостановлен',0:'Закрыт'};
const BIKD=()=>(DICT.bik&&DICT.bik.items)||[];
const bikNorm=c=>String(c==null?'':c).replace(/\D/g,'');
const bikFind=c=>{c=bikNorm(c);return c.length===6?BIKD().find(x=>x.bik===c)||null:null};
const bikHead=c=>BIKD().find(x=>x.bik===bikNorm(c).slice(0,3)+'001')||null;
// Провайдер банка для БИК: по ссылке записи, иначе по «Коду банка в БИК» у провайдера
function bikProv(x){if(!x)return null;const B=DICT.banks.items;return (x.bank&&B.find(b=>b.code===x.bank))||B.find(b=>b.bikCode&&b.bikCode===String(x.bik).slice(0,3))||null}
// Строка под полем: головной банк · филиал · адрес
function bikLine(x){const h=x.type==='Филиал банка'?bikHead(x.bik):null;return [h&&h!==x?h.name:'',x.name,x.addr].filter(Boolean).join(' · ')}
// Сколько реквизитов организации ссылаются на БИК (в прототипе — одна организация)
const bikUsed=c=>ORG.accounts.filter(a=>a.kind!=='phone'&&a.bik===c).length;
// Проверка БИК в «Расчётном счёте»: {x, prov, err, warn, none, succ}
function bikCheck(c){c=String(c||'').trim();if(!c)return {err:'Введите БИК'};if(!/^\d{6}$/.test(c))return {err:'БИК — 6 цифр'};const x=bikFind(c);
  if(!x)return {none:true,warn:'БИК не найден в справочнике НБКР. Проверьте код или выберите банк вручную'};const prov=bikProv(x);
  if(x.status==='Закрыт'){const s=x.succ&&bikFind(x.succ);return {x,prov,err:s?`БИК закрыт, новый — ${x.succ}`:'БИК закрыт',succ:s?x.succ:''}}
  return {x,prov,warn:x.status==='Введены ограничения'||x.status==='Приостановлен'?`У БИК статус «${x.status}» в справочнике НБКР: платежи через него могут не пройти. Сохранить можно`:''}}
// Счёт другого банка: первые три цифры счёта не совпадают с кодом банка в БИК
const bikAccWarn=(bik,acc)=>{const a=bikNorm(acc);return /^\d{6}$/.test(String(bik||'').trim())&&a.length>=3&&a.slice(0,3)!==String(bik).trim().slice(0,3)?'Счёт, похоже, другого банка: первые три цифры счёта не совпадают с кодом банка в БИК. Сохранить можно':''};
// Подсказки при вводе: по первым цифрам и по названию банка или филиала (закрытые БИК не предлагаются)
const bikList=id=>`<datalist id="${id}">${BIKD().filter(x=>x.status!=='Закрыт').map(x=>`<option value="${x.bik}" label="${esc(x.name)}">${esc(x.name)}</option>`).join('')}</datalist>`;
