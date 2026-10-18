'use strict';
// Сессия, права (can), функции учётной политики (feat)
/* ═════════════ Session, rights, features ═════════════ */
const S={me:'e1',search:'',navHidden:store.get('nav',false),open:new Set(store.get('tree',[])),taskView:'day',cal:null,calSel:null,preset:null,loggedIn:true};
const me=()=>S.me==='admin'?PLATFORM_ADMIN:EM[S.me];
const isAdmin=()=>S.me==='admin';
const myRole=()=>ROLES.find(r=>r.id===me().role);
function can(p){if(isAdmin())return false;const u=me();if(u.role==='owner')return true;const r=myRole();return !!(r&&r.perms.includes(p))}
const feat=f=>!!ORG.features[f];
const visCps=(all)=>CPS.filter(c=>(all||!c.archived)&&(can('viewAll')||c.resp===S.me));
const visReports=()=>REPORTS.filter(r=>!r.superseded&&(can('viewAll')||r.resp===S.me));
function born(o,who){o._cb=o._ub=who||S.me;o._ca=o._ua=nowStamp();return o}
function touch(o){if(o){o._ub=S.me;o._ua=nowStamp()}return o}
function log(ent,id,what,cp){HIST.push({at:nowStamp(),who:S.me,ent,id,cp,what});ckSoon();
  touch(ent==='r'?REPORTS.find(r=>r.id===id):ent==='cp'?CPM[id]:ent==='t'?TASKS.find(t=>t.id===id):ent==='emp'?EM[id]:ent==='org'?ORG.types&&ORG.types[id]:ent==='role'?ROLES.find(r=>r.id===id):ent==='p'?PROJECTS.find(p=>p.id===id):ent==='s'?SERVICES.find(s=>s.id===id):null)}
const whoName=id=>!id?'':id==='admin'?'Администратор платформы':id==='system'?'Система':empName(id)||id;
function auditKv(o){return `<div><span class="k">Создал</span><span class="v">${esc(whoName(o._cb)||'—')}<div class="aud">${fmtDT(o._ca)}</div></span></div><div><span class="k">Изменил</span><span class="v">${esc(whoName(o._ub||o._cb)||'—')}<div class="aud">${fmtDT(o._ua||o._ca)}</div></span></div>`}
const BNAV={business:['home','cps','reports','tasks'],admin:['accounts','orgs','pdicts','tg']};

