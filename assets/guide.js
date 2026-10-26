/* Shared engine for TheHauData study guides.
   A lesson page defines window.GUIDE = { EX, RES, stepNames, er:[{host,W,H,nodes,edges}], open:'id' } then loads this file.
   Exercise spec: {id,grp,tag,lvl,vi,en,out[],flt[],blocks[],combine,flow[],ctes[],st[],sql,res,resLabel,expect,watch[]} */
(function(){
const $ = (s, r=document) => r.querySelector(s);
const el = (t, a={}, h='') => { const e=document.createElement(t); for(const k in a){ if(k==='class') e.className=a[k]; else e.setAttribute(k,a[k]); } if(h) e.innerHTML=h; return e; };
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
window.G = {$, el, esc};

/* ---------- tabs ---------- */
const tabs = [...document.querySelectorAll('nav.tabs button')];
const store = 'tab:'+location.pathname;
function show(id){
  tabs.forEach(b=>{ const on=b.id===id; b.setAttribute('aria-selected',on); $('#'+b.getAttribute('aria-controls')).classList.toggle('on',on); });
  try{ localStorage.setItem(store,id);}catch(e){}
  window.scrollTo({top:0});
}
tabs.forEach(b=>b.addEventListener('click',()=>show(b.id)));
document.querySelectorAll('[data-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();show(a.dataset.go);}));
try{ const t=localStorage.getItem(store); if(t && $('#'+t)) show(t); }catch(e){}
G.show = show;

/* ---------- SQL highlight ---------- */
const KW=/\b(SELECT|DISTINCT|TOP|FROM|LEFT|RIGHT|INNER|FULL|CROSS|OUTER|JOIN|ON|WHERE|AND|OR|IN|AS|BETWEEN|UNION|ALL|ORDER|BY|DESC|ASC|IS|NOT|NULL|LIKE|CAST|VARCHAR|NVARCHAR|GROUP|HAVING|CASE|WHEN|THEN|ELSE|END|WITH|OVER|PARTITION|ROWS|UNBOUNDED|PRECEDING|FOLLOWING|CURRENT|ROW|COUNT|SUM|AVG|MIN|MAX|YEAR|MONTH|DAY|DATEDIFF|DATEPART|DATEADD|QUARTER|WEEKDAY|LOWER|LAG|LEAD|RANK|DENSE_RANK|ROW_NUMBER|PERCENT_RANK|COALESCE|LEN|LEFT|RIGHT|REPLACE|TRIM|SUBSTRING|CONCAT|FORMAT|ROUND|INT|DATE)\b/gi;
function hl(code){
  return code.split('\n').map(line=>{
    const i=line.indexOf('--'); let main=line, cm='';
    if(i>=0){ main=line.slice(0,i); cm=line.slice(i); }
    let out=''; let last=0; const re=/'(?:[^']|'')*'/g; let m;
    const seg=t=>esc(t).replace(KW,'<span class="k">$&</span>').replace(/\b\d+(\.\d+)?\b/g,'<span class="nm">$&</span>');
    while((m=re.exec(main))){ out+=seg(main.slice(last,m.index))+'<span class="s">'+esc(m[0])+'</span>'; last=m.index+m[0].length; }
    out+=seg(main.slice(last));
    return out+(cm?'<span class="c">'+esc(cm)+'</span>':'');
  }).join('\n');
}
G.hl = hl;
document.querySelectorAll('pre.sql[data-hl]').forEach(p=>{ p.innerHTML=hl(p.textContent); });

/* ---------- ER map ---------- */
G.drawER = function(host,W,H,nodes,edges){
  const bw=165,bh=52; let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Table relationship map">
  <defs><marker id="ar${host.id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--muted)"/></marker></defs>`;
  const N={}; nodes.forEach(n=>N[n.id]=n);
  const ctr=n=>[n.x+bw/2,n.y+bh/2];
  const edge=(a,b)=>{ const [ax,ay]=ctr(a),[bx,by]=ctr(b); const dx=bx-ax,dy=by-ay; const t=Math.min(Math.abs((bw/2+4)/(dx||1e-9)),Math.abs((bh/2+4)/(dy||1e-9)));
    const p1=[ax+dx*t,ay+dy*t]; const u=Math.min(Math.abs((bw/2+8)/(dx||1e-9)),Math.abs((bh/2+8)/(dy||1e-9))); const p2=[bx-dx*u,by-dy*u]; return [p1,p2]; };
  edges.forEach(e=>{ const [p1,p2]=edge(N[e.a],N[e.b]); const mx=(p1[0]+p2[0])/2,my=(p1[1]+p2[1])/2;
    s+=`<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#ar${host.id})"/>`;
    const lab=(e.warn?'⚠ ':'')+e.k, w=lab.length*6.4+12;
    s+=`<rect x="${mx-w/2}" y="${my-9}" width="${w}" height="17" rx="8" fill="var(--surface)" stroke="${e.warn?'var(--warn)':'var(--line)'}"/><text x="${mx}" y="${my+3.5}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${e.warn?'var(--warn)':'var(--fg)'}">${lab}</text>`; });
  nodes.forEach(n=>{ const c=n.fact?'var(--orange)':'var(--blue)', bg=n.fact?'var(--orange-soft)':'var(--blue-soft)';
    s+=`<rect x="${n.x}" y="${n.y}" width="${bw}" height="${bh}" rx="8" fill="${bg}" stroke="${c}" stroke-width="2"/>
    <text x="${n.x+10}" y="${n.y+20}" font-size="12" font-weight="700" fill="var(--fg)" font-family="var(--mono)">${n.id}</text>
    <text x="${n.x+10}" y="${n.y+38}" font-size="10.5" fill="var(--muted)">${n.sub}</text>`; });
  host.innerHTML=s+'</svg>';
};

/* ---------- exercises ---------- */
function tcard(t,role,sub,isBase){
  return `<div class="tcard${isBase?' base':''}">${role?`<span class="role">${isBase?'FROM · ':''}${role}</span>`:''}<b>${t}</b>${sub?`<em>${sub}</em>`:''}</div>`;
}
function blockHTML(b){
  let h=`<div>${b.label?`<div class="maplabel" style="margin-bottom:4px">${b.label}</div>`:''}<div class="blk">${tcard(b.base.t,b.base.role,b.base.use,true)}`;
  if(b.joins && b.joins.length){
    h+=`<div class="arms">`+b.joins.map(j=>`<div class="arm"><div class="link"><span class="jt">${j.type}</span><span>ON ${j.key}</span>${j.cast?'<span class="cast">⚠ CAST type</span>':''}</div>${tcard(j.t,'',(j.from?`via ${j.from} · `:'')+'adds '+j.adds,false)}</div>`).join('')+`</div>`;
  }
  return h+`</div></div>`;
}
function flowHTML(f){
  return `<div class="flow">`+f.map((x,i)=>`<div class="fl${x[2]==='skip'?' skip':''}"><i>${x[3]||i+1}</i><b>${x[0]}</b><code>${esc(x[1])}</code></div>`).join('')+`</div>`;
}
function chainHTML(c){
  return `<div class="chain">`+c.map((x,i)=>`${i?'<span class="ar">→</span>':''}<div class="cte${x.fin?' fin':''}"><b>${esc(x.n)}</b>${esc(x.d)}${x.w?`<span class="win">${esc(x.w)}</span>`:''}</div>`).join('')+`</div>`;
}
function resHTML(RES,ids,labels){
  ids=[].concat(ids||[]); return ids.map((id,i)=>{
    const r=RES[id]; if(!r) return '';
    const th=r.cols.map(c=>`<th>${esc(c)}</th>`).join('');
    const rows=r.sample.map(x=>'<tr>'+x.map(v=>`<td class="${v===null?'nul':''}">${v===null?'NULL':esc(typeof v==='number'?v.toLocaleString('en-US'):v)}</td>`).join('')+'</tr>').join('');
    return `<div class="res"><header>${labels?labels[i]+' · ':''}${r.n.toLocaleString()} row${r.n===1?'':'s'}<span>first ${Math.min(r.sample.length,r.n)} shown</span></header><div class="tbl-wrap"><table class="d"><tr>${th}</tr>${rows}</table></div></div>`;
  }).join('');
}
G.render = function(cfg){
  const {EX,RES}=cfg; const steps=cfg.stepNames||['Expected output','Which tables?','Keys & JOIN type','Filter & validate'];
  const list=$('#exlist');
  EX.forEach(e=>{
    const d=el('details',{class:'ex','data-grp':e.grp,id:'ex-'+e.id});
    const maps=[];
    if(e.flow) maps.push(`<div class="maplabel">Query in execution order</div>${flowHTML(e.flow)}`);
    if(e.ctes) maps.push(`<div class="maplabel">CTE chain</div>${chainHTML(e.ctes)}`);
    if(e.blocks) maps.push(`<div class="maplabel">Table map</div>`+e.blocks.map((b,k)=>blockHTML(b)+(e.combine&&k<e.blocks.length-1?`<div class="comb">${e.combine}</div>`:'')).join(''));
    const outRow=(e.out&&e.out.length)?`<div class="out"><span class="maplabel">Output</span>${e.out.map(o=>`<span class="pill">${esc(o)}</span>`).join('')}${(e.flt&&e.flt.length)?'<span class="maplabel" style="margin-left:8px">Filter</span>':''}${(e.flt||[]).map(o=>`<span class="flt">${esc(o)}</span>`).join('')}</div>`:'';
    d.innerHTML=`<summary><span class="tag${e.grp==='Classwork'||/class/i.test(e.grp)?'':' o'}">${e.tag}</span><span class="ex-title">${esc(e.en)}</span><span class="tag g">${e.lvl}</span></summary>
    <div class="ex-body">
      <div class="q"><b>${e.viLabel||'Question (Vietnamese, as given)'}</b><br>${esc(e.vi)}</div>
      <div class="stepbox">${e.st.map((s,k)=>`<div class="stp"><div class="n">${k+1}</div><div><b>${(e.stepNames||steps)[k]||''}</b><div>${s}</div></div></div>`).join('')}</div>
      ${(maps.length||outRow)?`<div class="map">${maps.join('')}${outRow}</div>`:''}
      <div class="codewrap"><pre class="sql">${hl(e.sql)}</pre><button class="copy" type="button">Copy</button></div>
      ${resHTML(RES,e.res,e.resLabel)}${G.chartHTML?G.chartHTML(e,RES):''}${e.expect?`<div class="note">${e.expect}</div>`:''}
      ${(e.watch&&e.watch.length)?`<div class="watch"><b>Watch out</b><ul>${e.watch.map(w=>`<li>${w}</li>`).join('')}</ul></div>`:''}
    </div>`;
    d.querySelector('.copy').addEventListener('click',async ev=>{
      const btn=ev.currentTarget;
      try{ await navigator.clipboard.writeText(e.sql); btn.textContent='Copied'; }
      catch(_){ const r=document.createRange(); r.selectNodeContents(d.querySelector('pre')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent='Selected'; }
      setTimeout(()=>btn.textContent='Copy',1500);
    });
    list.appendChild(d);
  });
  if(cfg.open && $('#ex-'+cfg.open)) $('#ex-'+cfg.open).open=true;
  const groups=['All',...new Set(EX.map(e=>e.grp))];
  const fb=$('#filters'); let cur='All';
  groups.forEach(g=>{ const b=el('button',{class:'chip',type:'button','aria-pressed':g==='All'},`${g} <span style="opacity:.7">${g==='All'?EX.length:EX.filter(e=>e.grp===g).length}</span>`);
    b.addEventListener('click',()=>{cur=g;[...fb.children].forEach(c=>c.setAttribute('aria-pressed',c===b));
      [...list.children].forEach(d=>d.hidden=!(g==='All'||d.dataset.grp===g));}); fb.appendChild(b); });
  (cfg.er||[]).forEach(m=>G.drawER($(m.host),m.W,m.H,m.nodes,m.edges));
  if(G.chartInit)G.chartInit();
};
})();
/* ---- charts: bar, col, line, stack, heat. SVG drawn at the host's real pixel width, redrawn on resize. ---- */
(function(){
const G=window.G;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function fv(f,v){
  v=+v;const a=Math.abs(v);
  if(f==='usd')return '$'+(a>=1e6?(v/1e6).toFixed(a>=1e7?0:1)+'M':a>=1e3?Math.round(v/1e3)+'K':Math.round(v));
  if(f==='pct')return (a<10&&v%1?v.toFixed(1):Math.round(v))+'%';
  if(f==='pct1')return v.toFixed(1)+'%';
  if(f==='usd0')return '$'+Math.round(v).toLocaleString('en-US');
  if(f==='days')return v.toFixed(2)+' d';
  if(f==='n2')return v.toLocaleString('en-US',{maximumFractionDigits:2});
  return Math.round(v).toLocaleString('en-US');
}
function fvFull(f,v){ v=+v; if(f==='usd')return '$'+Math.round(v).toLocaleString('en-US'); return fv(f,v); }
function nice(max,n){ n=n||4;const raw=max/n,p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p;
  const s=(m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;return {step:s,max:Math.ceil(max/s-1e-9)*s}; }
function rbar(x,y,w,h,r){ // rounded data end (right), square at the baseline
  r=Math.min(r,h/2,Math.max(w,0));if(w<=0)return '';
  return 'M'+x+','+y+'h'+(w-r)+'a'+r+','+r+' 0 0 1 '+r+','+r+'v'+(h-2*r)+'a'+r+','+r+' 0 0 1 -'+r+','+r+'h-'+(w-r)+'z'; }
function cbar(x,y,w,h,r){ // rounded top, square at the baseline
  r=Math.min(r,w/2,h);if(h<=0)return '';
  return 'M'+x+','+(y+h)+'v-'+(h-r)+'a'+r+','+r+' 0 0 1 '+r+',-'+r+'h'+(w-2*r)+'a'+r+','+r+' 0 0 1 '+r+','+r+'v'+(h-r)+'z'; }
function trunc(s,px){ const n=Math.max(4,Math.floor(px/6.4)); s=String(s); return s.length>n?s.slice(0,n-1)+'…':s; }
const SER=['s1','s2','s3'];
const ix=(cols,c)=>cols.indexOf(c);

function prep(spec,r){
  let cols=r.cols,rows=r.full||(r.sample.length===r.n?r.sample:null);
  if(!rows)return null;
  if(spec.wide){ // one row of several columns -> one category per column
    const row=rows[0];rows=spec.wide.cols.map((c,i)=>[spec.wide.labels[i],row[cols.indexOf(c)]]);cols=['label','value'];
    spec=Object.assign({},spec,{cat:'label',val:'value'});
    if(spec.sort)rows.sort((a,b)=>b[1]-a[1]);
  }
  return {spec,cols,rows};
}

function drawBar(W,spec,cols,rows,host){
  const series=spec.series||[{col:spec.val,label:spec.valLabel||spec.val}];
  const ci=ix(cols,spec.cat),vi=series.map(s=>ix(cols,s.col));
  const maxLab=Math.max(...rows.map(r=>String(r[ci]).length));
  const Lw=Math.min(Math.round(W*0.42),Math.max(60,maxLab*6.6+10));
  const R=64,rowH=series.length*17+(series.length>1?14:12),top=4;
  const H=top+rows.length*rowH+4;
  const max=nice(Math.max(...rows.flatMap(r=>vi.map(i=>+r[i]))),4).max;
  if(series.length>1)host._legend=series.map((se,j)=>'<span><i class="sw '+SER[j]+'"></i>'+esc(se.label)+'</span>').join('');
  const pw=W-Lw-R;let s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(spec.title)+'">';
  rows.forEach((r,k)=>{
    const y0=top+k*rowH,hi=(spec.hi||[]).includes(r[ci]);
    s+='<text class="vz-t" x="'+(Lw-8)+'" y="'+(y0+rowH/2+4)+'" text-anchor="end">'+esc(trunc(r[ci],Lw-10))+'</text>';
    series.forEach((se,j)=>{
      const v=+r[vi[j]],w=Math.max(0,v/max*pw),by=y0+(rowH-series.length*15-(series.length-1)*2)/2+j*17;
      const cls=series.length>1?SER[j]:(hi?'s2':'s1');
      s+='<path class="vz-f '+cls+'" d="'+rbar(Lw,by,w,15,4)+'" data-tip="'+esc(r[ci])+(series.length>1?' · '+esc(se.label):'')+': '+fvFull(spec.fmt,v)+'"/>';
      s+='<text class="vz-m" x="'+(Lw+w+6)+'" y="'+(by+11.5)+'">'+fv(spec.fmt,v)+'</text>';
    });
  });
  return s+'<line class="vz-ax" x1="'+Lw+'" x2="'+Lw+'" y1="'+top+'" y2="'+(H-4)+'"/></svg>';
}
function drawCol(W,spec,cols,rows){
  const ci=ix(cols,spec.cat),vi=ix(cols,spec.val),H=240,L=46,Rr=12,T=22,B=30;
  const n=nice(Math.max(...rows.map(r=>+r[vi])),4),pw=W-L-Rr,ph=H-T-B,slot=pw/rows.length,bw=Math.min(90,slot*0.5);
  let s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(spec.title)+'">';
  for(let t=0;t<=n.max+1e-9;t+=n.step){const y=T+ph-t/n.max*ph;
    s+='<line class="'+(t?'vz-g':'vz-ax')+'" x1="'+L+'" x2="'+(W-Rr)+'" y1="'+y+'" y2="'+y+'"/><text class="vz-m" x="'+(L-6)+'" y="'+(y+4)+'" text-anchor="end">'+fv(spec.tfmt||spec.fmt,t)+'</text>';}
  rows.forEach((r,k)=>{const v=+r[vi],h=v/n.max*ph,x=L+k*slot+(slot-bw)/2,hi=(spec.hi||[]).includes(r[ci]);
    s+='<path class="vz-f '+(hi?'s2':'s1')+'" d="'+cbar(x,T+ph-h,bw,h,4)+'" data-tip="'+esc(r[ci])+': '+fvFull(spec.fmt,v)+'"/>';
    s+='<text class="vz-t" x="'+(x+bw/2)+'" y="'+(T+ph-h-6)+'" text-anchor="middle" font-weight="600">'+fv(spec.fmt,v)+'</text>';
    s+='<text class="vz-t" x="'+(x+bw/2)+'" y="'+(H-10)+'" text-anchor="middle">'+esc(r[ci])+'</text>';});
  return s+'</svg>';
}
function drawLine(W,spec,cols,rows){
  const xi=ix(cols,spec.x),yi=ix(cols,spec.y),H=W<480?210:250,L=W<480?42:50,Rr=W<480?48:62,T=16,B=26;
  const pw=W-L-Rr,ph=H-T-B,N=rows.length,ys=rows.map(r=>+r[yi]);
  const n=nice(Math.max(...ys),4);
  const X=i=>L+(N>1?i/(N-1)*pw:pw/2),Y=v=>T+ph-v/n.max*ph;
  let s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(spec.title)+'">';
  for(let t=0;t<=n.max+1e-9;t+=n.step)
    s+='<line class="'+(t?'vz-g':'vz-ax')+'" x1="'+L+'" x2="'+(W-Rr)+'" y1="'+Y(t)+'" y2="'+Y(t)+'"/><text class="vz-m" x="'+(L-6)+'" y="'+(Y(t)+4)+'" text-anchor="end">'+fv(spec.tfmt||spec.fmt,t)+'</text>';
  const lab=rows.map(r=>String(r[xi]));const isM=lab.every(l=>/^\d{4}-\d{2}$/.test(l));
  const maxT=Math.max(2,Math.floor(pw/54));let ticks=[];
  if(isM){const jan=lab.map((l,i)=>l.endsWith('-01')?i:-1).filter(i=>i>=0);const k=Math.ceil(jan.length/maxT);ticks=jan.filter((_,j)=>j%k===0).map(i=>[i,lab[i].slice(0,4)]);}
  else{const k=Math.ceil(N/maxT);ticks=lab.map((l,i)=>[i,l]).filter(([i])=>i%k===0);}
  ticks.forEach(([i,t])=>{s+='<text class="vz-m" x="'+X(i)+'" y="'+(H-8)+'" text-anchor="middle">'+esc(t)+'</text>';});
  const pts=ys.map((v,i)=>[X(i),Y(v)]);const pl=spec.partialLast&&N>2;
  const main=pl?pts.slice(0,-1):pts;
  s+='<path class="vz-l s1" d="M'+main.map(p=>p.join(',')).join('L')+'"/>';
  if(pl)s+='<path class="vz-l s1 dash" d="M'+pts[N-2].join(',')+'L'+pts[N-1].join(',')+'"/>';
  const last=pts[N-1];
  s+='<circle class="vz-d s1'+(pl?' hollow':'')+'" cx="'+last[0]+'" cy="'+last[1]+'" r="4"/>';
  s+='<text class="vz-t" x="'+(last[0]+8)+'" y="'+(last[1]+4)+'" font-weight="600">'+fv(spec.fmt,ys[N-1])+'</text>';
  if(pl)s+='<text class="vz-m" x="'+(last[0]+8)+'" y="'+(last[1]+18)+'">partial</text>';
  if(spec.peak){const m=ys.indexOf(Math.max(...ys.slice(0,pl?N-1:N)));
    s+='<circle class="vz-d s2" cx="'+pts[m][0]+'" cy="'+pts[m][1]+'" r="4"/><text class="vz-t" x="'+Math.min(pts[m][0],W-Rr-70)+'" y="'+(pts[m][1]-9)+'" font-weight="600">Peak '+fv(spec.fmt,ys[m])+'</text>';}
  if(spec.first){s+='<circle class="vz-d s1" cx="'+pts[0][0]+'" cy="'+pts[0][1]+'" r="4"/><text class="vz-t" x="'+(pts[0][0]+2)+'" y="'+(pts[0][1]-9)+'" font-weight="600">'+fv(spec.fmt,ys[0])+'</text>';}
  s+='<line class="vz-x" id="vzx" x1="0" x2="0" y1="'+T+'" y2="'+(T+ph)+'" visibility="hidden"/><circle class="vz-d s1" id="vzc" r="5" visibility="hidden"/>';
  const sw=pw/Math.max(N-1,1);
  rows.forEach((r,i)=>{s+='<rect class="vz-hit" x="'+(X(i)-sw/2)+'" y="'+T+'" width="'+sw+'" height="'+ph+'" data-i="'+i+'" data-px="'+X(i)+'" data-py="'+Y(ys[i])+'" data-tip="'+esc(r[xi])+': '+fvFull(spec.fmt,ys[i])+((pl&&i===N-1)?' (partial)':'')+'"/>';});
  return s+'</svg>';
}
function drawStack(W,spec,cols,rows,host){
  const xi=ix(cols,spec.x),ci=ix(cols,spec.cat),vi=ix(cols,spec.val);
  const years=[...new Set(rows.map(r=>r[xi]))].sort(),totals={};
  rows.forEach(r=>{totals[r[ci]]=(totals[r[ci]]||0)+ +r[vi];});
  const top=Object.keys(totals).sort((a,b)=>totals[b]-totals[a]).slice(0,spec.top||3);
  const segs=top.concat(['Other']);
  host._legend=segs.map((n,i)=>'<span><i class="sw '+(i<top.length?SER[i]:'sx')+'"></i>'+esc(n)+'</span>').join('');
  const H=250,L=40,Rr=W<560?8:132,T=10,B=26,pw=W-L-Rr,ph=H-T-B,slot=pw/years.length,bw=Math.min(76,slot*0.62);
  let s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(spec.title)+'">';
  [0,25,50,75,100].forEach(t=>{const y=T+ph-t/100*ph;s+='<line class="'+(t?'vz-g':'vz-ax')+'" x1="'+L+'" x2="'+(W-Rr)+'" y1="'+y+'" y2="'+y+'"/><text class="vz-m" x="'+(L-6)+'" y="'+(y+4)+'" text-anchor="end">'+t+'%</text>';});
  years.forEach((yr,k)=>{
    const x=L+k*slot+(slot-bw)/2,share={};let acc=0;
    segs.forEach(n=>share[n]=0);
    rows.filter(r=>r[xi]===yr).forEach(r=>{const n=top.includes(r[ci])?r[ci]:'Other';share[n]+= +r[vi];});
    const sum=segs.reduce((a,n)=>a+share[n],0);
    segs.forEach((n,i)=>{const h=share[n]/sum*ph;if(h<=0)return;const y=T+ph-acc-h;acc+=h;
      s+='<rect class="vz-f '+(i<top.length?SER[i]:'sx')+'" x="'+x+'" y="'+(y+0.5)+'" width="'+bw+'" height="'+Math.max(h-1,0.5)+'" rx="1.5" data-tip="'+yr+' · '+esc(n)+': '+(share[n]/sum*100).toFixed(1)+'%"/>';
      if(k===years.length-1&&W>=560)s+='<text class="vz-t" x="'+(x+bw+8)+'" y="'+(y+h/2+4)+'">'+esc(trunc(n,Rr-12))+' '+(share[n]/sum*100).toFixed(0)+'%</text>';});
    s+='<text class="vz-m" x="'+(x+bw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+yr+'</text>';
  });
  return s+'</svg>';
}
function drawHeat(W,spec,cols,rows){
  const ci=ix(cols,spec.cat),vcols=spec.vals,vi=vcols.map(c=>ix(cols,c));
  const L=Math.min(86,W*0.22),T=26,cw=(W-L-4)/vcols.length,ch=Math.min(32,Math.max(24,cw*0.55)),H=T+rows.length*ch+4;
  const vals=rows.flatMap(r=>vi.map(i=>+r[i]).filter(v=>!isNaN(v)));const mx=Math.max(...vals);
  const heads=spec.heads||vcols;
  let s='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(spec.title)+'">';
  vcols.forEach((c,j)=>{s+='<text class="vz-m" x="'+(L+j*cw+cw/2)+'" y="'+(T-9)+'" text-anchor="middle">'+esc(heads[j])+'</text>';});
  rows.forEach((r,k)=>{
    s+='<text class="vz-t" x="'+(L-8)+'" y="'+(T+k*ch+ch/2+4)+'" text-anchor="end">'+esc(r[ci])+'</text>';
    vi.forEach((i,j)=>{const v=+r[i],t=Math.min(1,v/mx),hi=t>0.45;
      s+='<rect class="vz-cell" x="'+(L+j*cw+1)+'" y="'+(T+k*ch+1)+'" width="'+(cw-2)+'" height="'+(ch-2)+'" rx="3" style="fill:color-mix(in srgb,var(--h1) '+Math.round(t*100)+'%,var(--h0))" data-tip="'+esc(r[ci])+' · '+esc(heads[j])+': '+v.toFixed(1)+'%"/>';
      s+='<text x="'+(L+j*cw+cw/2)+'" y="'+(T+k*ch+ch/2+4)+'" text-anchor="middle" style="fill:var('+(hi?'--htx':'--fg')+');pointer-events:none">'+v.toFixed(1)+'</text>';});
  });
  return s+'</svg>';
}
const DRAW={bar:drawBar,col:drawCol,line:drawLine,stack:drawStack,heat:drawHeat};

function paint(host){
  const W=Math.floor(host.clientWidth);if(W<120||host._w===W)return;host._w=W;
  const P=host._p;const svg=DRAW[P.spec.type](W,P.spec,P.cols,P.rows,host);
  host.querySelector('.viz-leg').innerHTML=host._legend||'';
  host.querySelector('.viz-svg').innerHTML=svg;
}
function wire(host){
  const tip=host.querySelector('.viz-tip'),box=host.querySelector('.viz-svg');
  box.addEventListener('pointermove',ev=>{
    const t=ev.target.closest&&ev.target.closest('[data-tip]');
    if(!t){tip.hidden=true;return;}
    tip.textContent=t.getAttribute('data-tip');tip.hidden=false;
    const b=box.getBoundingClientRect();let x=ev.clientX-b.left+12,y=ev.clientY-b.top-34;
    x=Math.min(x,b.width-tip.offsetWidth-4);tip.style.left=Math.max(0,x)+'px';tip.style.top=Math.max(0,y)+'px';
    if(t.dataset.i!==undefined){const vx=box.querySelector('#vzx'),vc=box.querySelector('#vzc');
      vx.setAttribute('x1',t.dataset.px);vx.setAttribute('x2',t.dataset.px);vc.setAttribute('cx',t.dataset.px);vc.setAttribute('cy',t.dataset.py);
      vx.setAttribute('visibility','visible');vc.setAttribute('visibility','visible');}
  });
  box.addEventListener('pointerleave',()=>{tip.hidden=true;const vx=box.querySelector('#vzx'),vc=box.querySelector('#vzc');if(vx){vx.setAttribute('visibility','hidden');vc.setAttribute('visibility','hidden');}});
}
G.chartHTML=function(e,RES){
  if(!e.chart)return '';
  const r=RES[[].concat(e.res||[])[0]];if(!r)return '';
  const P=prep(e.chart,r);if(!P)return '';
  const id='viz-'+e.id;G._viz=G._viz||{};G._viz[id]=P;
  return '<figure class="viz" id="'+id+'"><figcaption><b>'+esc(e.chart.title)+'</b><span>'+esc(e.chart.sub||'')+'</span></figcaption><div class="viz-leg"></div><div class="viz-box"><div class="viz-svg"></div><div class="viz-tip" hidden></div></div></figure>';
};
G.chartInit=function(){
  document.querySelectorAll('figure.viz').forEach(h=>{
    h._p=G._viz[h.id];wire(h);
    new ResizeObserver(()=>paint(h)).observe(h);paint(h);
  });
};
})();
