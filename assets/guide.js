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
      ${resHTML(RES,e.res,e.resLabel)}${e.expect?`<div class="note">${e.expect}</div>`:''}
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
};
})();
