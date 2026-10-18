'use strict';
// Производное состояние: просрочки, остатки, статусы контрагентов (derive)
/* ═════════════ Derived state ═════════════ */
const DONE=new Set(['Сдан','Принят','Не требуется']);
const OPEN=new Set(['К сдаче','В работе','Требует исправления']);
function derive(){
  kpiIndex();
  CPS.forEach(c=>{c.overdue=0;c.avail=0;c.free=0;c.status=cpStatus(c);c.paused=c.status==='Приостановлен'});
  const recv={};OPS.forEach(o=>{if(o.kind==='in')(o.alloc||[]).forEach(x=>{recv[x.r]=(recv[x.r]||0)+x.a})});
  const by={};
  REPORTS.forEach(r=>{const t=tR(r);
    const sch=schedule(r);const u=sch.find(x=>x.paid<x.amount);r.payDue=t.sum?(u?u.due:(sch.length?sch[sch.length-1].due:r.due)):null;
    r.payStatus=!t.sum||r.status==='Не требуется'?'Не требуется':r.sum==null?'Не оплачено':r.sum===0?'Не требуется':r.paid>=r.sum?'Оплачено':r.paid>0?'Оплачено частично':'Не оплачено';
    if(t.payOnly&&r.status!=='Не требуется')r.status=r.sum>0&&r.paid>=r.sum?'Принят':'К сдаче';
    r.recv=recv[r.id]||0;const cpP=CPM[r.cp].paused;
    r.overdue=!cpP&&!r.superseded&&!t.payOnly&&OPEN.has(r.status)&&r.due<TODAY;
    r.payOverdue=!cpP&&!r.superseded&&feat('taxpay')&&['Не оплачено','Оплачено частично'].includes(r.payStatus)&&r.sum>0&&r.payDue<TODAY;
    r.money=null;
    if(r.overdue)CPM[r.cp].overdue++;
    (by[r.cp]=by[r.cp]||[]).push(r);
  });
  CPS.forEach(c=>{
    let av=0;OPS.forEach(o=>{if(o.cp!==c.id||!OPK[o.kind]||o.kind==='xfer')return;av+=(o.kind==='in'||o.kind==='back'||o.kind==='corr')?o.amount:-o.amount});
    c.avail=av;let left=av;
    const pend=(by[c.id]||[]).filter(r=>tR(r).sum&&r.sum>0&&r.status!=='Не требуется'&&!r.superseded).sort((a,b)=>a.payDue<b.payDue?-1:1);
    // Сначала под каждый отчёт резервируются деньги, принятые именно за него (детализация поступлений), потом свободный остаток идёт по сроку оплаты
    const ear={};pend.forEach(r=>{if(r.paid>=r.sum)return;const e=Math.max(0,Math.min(r.sum-r.paid,(r.recv||0)-r.paid,left));ear[r.id]=e;left-=e});
    pend.forEach(r=>{
      if(r.paid>=r.sum){r.money={s:'paid'};return}
      const need=r.sum-r.paid,rest=need-(ear[r.id]||0);if(left>=rest){r.money={s:'ok',need};left-=rest}else{r.money={s:'short',n:rest-left,need};left=0}
    });
    c.free=left;
    let debt=0;feeMonths(c).forEach(m=>{const due=feeDue(c,m);if(due<=TODAY)debt+=Math.max(0,feeCharge(c,m)-(c.feePaid[m]||0))});c.feeDebt=debt;
  });
}

