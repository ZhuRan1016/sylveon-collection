let cards=[],activeEra='全部';
const owned=new Set(JSON.parse(localStorage.getItem('sylveon-owned-v3')||'[]'));
const key=c=>`${c.name}|${c.number}|${c.set}`;
const save=()=>localStorage.setItem('sylveon-owned-v3',JSON.stringify([...owned]));

async function init(){
  cards=await fetch('cards.json',{cache:'no-store'}).then(r=>r.json());
  render();
}
function render(){
  const q=document.querySelector('#search').value.trim().toLowerCase();
  const filter=document.querySelector('#filter').value;
  const eras=['全部',...new Set(cards.map(c=>c.era))];
  document.querySelector('#eras').innerHTML=eras.map(e=>`<button class="era ${e===activeEra?'active':''}" data-era="${e}">${e}</button>`).join('');
  document.querySelectorAll('.era').forEach(b=>b.onclick=()=>{activeEra=b.dataset.era;render()});

  const rows=cards.filter(c=>{
    const has=owned.has(key(c));
    return (!q||`${c.name} ${c.number} ${c.set}`.toLowerCase().includes(q))
      &&(activeEra==='全部'||c.era===activeEra)
      &&(filter==='all'||(filter==='owned'&&has)||(filter==='missing'&&!has));
  });

  document.querySelector('#list').innerHTML=rows.length?rows.map(c=>{
    const has=owned.has(key(c));
    return `<article class="card ${has?'owned':''}">
      <div class="icon">🎀</div>
      <div><div class="name">${c.name}</div><div class="meta"><b>${c.number}</b><br>${c.set} · ${c.era}</div></div>
      <button class="check" data-key="${encodeURIComponent(key(c))}">${has?'✓':'＋'}</button>
    </article>`;
  }).join(''):'<div class="empty">没有符合条件的卡</div>';

  document.querySelectorAll('.check').forEach(btn=>btn.onclick=()=>{
    const k=decodeURIComponent(btn.dataset.key);
    owned.has(k)?owned.delete(k):owned.add(k);
    save();render();
  });

  const n=cards.filter(c=>owned.has(key(c))).length;
  const p=cards.length?Math.round(n/cards.length*100):0;
  document.querySelector('#count').textContent=`已收集 ${n} / ${cards.length}`;
  document.querySelector('#percent').textContent=`${p}%`;
  document.querySelector('#bar').style.width=`${p}%`;
}
document.querySelector('#search').oninput=render;
document.querySelector('#filter').onchange=render;
document.querySelector('#exportBtn').onclick=()=>{
  const data={version:3,owned:[...owned],exportedAt:new Date().toISOString()};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download='sylveon-collection-backup.json';a.click();
};
document.querySelector('#importFile').onchange=async e=>{
  try{
    const data=JSON.parse(await e.target.files[0].text());
    owned.clear();(data.owned||[]).forEach(x=>owned.add(x));save();render();alert('导入成功');
  }catch{alert('备份文件格式不正确')}
};
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');
init();
