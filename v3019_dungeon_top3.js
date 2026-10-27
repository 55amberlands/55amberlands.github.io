/* 55 AMBERLANDS V30.1.9 — Dungeon Top 3 overlay (visual only).
 * Reads the authenticated server dungeon snapshot already fetched by v23_dungeon.js.
 * Never changes combat, player saves, rewards, standings, or Supabase data.
 */
(()=>{
  'use strict';
  const KEY='amber3019DungeonTop3', STYLE='amber3019DungeonTop3CSS';
  let root=null, list=null, toggle=null, previous='', folded=false;
  const medals=['🥇','🥈','🥉'];
  const byId=id=>(window.AMBER_PUBLIC_PEERS||[]).find(p=>String(p.by)===String(id))?.presence||null;
  const me=()=>String(window.AMBER_CLOUD?.getUser?.()?.id||'');
  const cleanDamage=x=>Number.isFinite(Number(x))?Math.max(0,Math.floor(Number(x))):0;
  const format=x=>cleanDamage(x).toLocaleString('th-TH');
  const make=(tag,className,text)=>{
    const e=document.createElement(tag);
    if(className)e.className=className;
    if(text!=null)e.textContent=String(text);
    return e;
  };

  const styles=`
#${KEY}{position:absolute;right:7px;top:9px;z-index:28;width:clamp(126px,37%,174px);max-width:calc(100% - 16px);pointer-events:none;color:#fff5dc;font-family:system-ui,sans-serif;font-size:11px;line-height:1.15;filter:drop-shadow(0 2px 5px #0009)}
#${KEY} .dg-top3-toggle{pointer-events:auto;width:100%;height:29px;min-height:29px;display:flex;align-items:center;justify-content:space-between;gap:5px;box-sizing:border-box;padding:5px 8px;background:#111d30e8;border:1px solid #e6bc69;border-radius:8px 8px 0 0;color:#ffe5a0;font:800 10px system-ui,sans-serif;text-align:left;cursor:pointer;touch-action:manipulation}
#${KEY}.folded{width:119px}
#${KEY}.folded .dg-top3-toggle{border-radius:8px}
#${KEY} .dg-top3-list{background:#091525d6;border:1px solid #aa8b5c;border-top:0;border-radius:0 0 8px 8px;overflow:hidden}
#${KEY} .dg-top3-list[hidden]{display:none!important}
#${KEY} .dg-top3-row{display:grid;grid-template-columns:16px 28px minmax(0,1fr);column-gap:3px;align-items:center;min-height:37px;padding:2px 3px;border-top:1px solid #ffffff12}
#${KEY} .dg-top3-row:first-child{border-top:0;background:#aa7c2030}
#${KEY} .dg-top3-medal{font-size:13px;line-height:1;text-align:center}
#${KEY} .dg-top3-avatar{width:25px;height:31px;display:flex;align-items:center;justify-content:center;overflow:hidden}
#${KEY} .dg-top3-avatar img{display:block;width:25px;height:30px;max-width:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 1px 2px #000)}
#${KEY} .dg-top3-avatar .dg-top3-placeholder{font-size:18px}
#${KEY} .dg-top3-details{display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0}
#${KEY} .dg-top3-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:700}
#${KEY} .dg-top3-score{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:10px;font-weight:800;color:#eec56a;font-variant-numeric:tabular-nums}
#${KEY} .dg-top3-self .dg-top3-name{color:#9fefff}
@media (max-width:390px){#${KEY}{top:57px;right:5px;width:128px}#${KEY} .dg-top3-row{min-height:33px}#${KEY} .dg-top3-avatar img{height:27px}}
@media (prefers-reduced-motion:reduce){#${KEY}{transition:none}}
`;

  function initStyle(){
    if(document.getElementById(STYLE))return;
    const el=make('style');el.id=STYLE;el.textContent=styles;document.head.appendChild(el);
  }
  function forget(){
    if(root){root.remove();root=null;list=null;toggle=null;}
    previous='';
  }
  function reflectFold(){
    if(!root||!list||!toggle)return;
    root.classList.toggle('folded',folded);
    list.hidden=folded;
    toggle.setAttribute('aria-expanded',String(!folded));
    toggle.textContent=folded?'🏆 TOP 3  ＋':'🏆 อันดับดาเมจ 1–3  −';
  }
  function create(scene){
    initStyle();
    root=make('aside');root.id=KEY;root.setAttribute('aria-label','อันดับดาเมจผู้เล่นสามอันดับแรกในดันเจี้ยน');
    toggle=make('button','dg-top3-toggle');toggle.type='button';
    toggle.setAttribute('aria-label','ย่อหรือขยายอันดับดาเมจดันเจี้ยน');
    toggle.addEventListener('click',()=>{
      folded=!folded;reflectFold();
    });
    list=make('div','dg-top3-list');
    root.append(toggle,list);
    scene.appendChild(root);
    reflectFold();
    previous='';
  }
  function avatar(id){
    const p=byId(id)||{};
    const local=id===me();
    const st=(typeof state==='object'&&state)||{};
    const gender=String(local?(st.gender||'male'):(p.gender||'male'));
    const job=String(local?(st.job||'นักผจญภัย'):(p.job||'นักผจญภัย'));
    return {gender,job};
  }
  const avatarCache=new Map();
  function avatarSrc(gender,job){
    const key=gender+'|'+job;
    if(avatarCache.has(key))return avatarCache.get(key);
    let src='';
    try{src=window.AMBER_AVATAR?.get?.(gender,job)||'';}catch(e){src='';}
    if(avatarCache.size>30)avatarCache.clear();
    if(typeof src!=='string')src='';
    avatarCache.set(key,src);
    return src;
  }
  function render(){
    const dg=window.AMBER_DUNGEON;
    const scene=document.getElementById('scene');
    const room=dg?.room?.();
    if(!scene||!dg?.isViewing?.()||!room||!['active','finished'].includes(room.status)){
      forget();return;
    }
    // v23_dungeon.js exposes the authorized snapshot from amber_dungeon_snapshot.
    const ranked=(Array.isArray(room.members)?room.members:[])
      .filter(p=>p&&p.accepted&&p.user_id)
      .map(p=>({
        id:String(p.user_id),
        name:String(p.name||'ผู้เล่น'),
        damage:cleanDamage(p.damage_dealt)
      }))
      .sort((a,b)=>b.damage-a.damage||a.id.localeCompare(b.id))
      .slice(0,3);
    if(!ranked.length){forget();return;}
    if(!root||root.parentNode!==scene){forget();create(scene);}
    const displayed=ranked.map(p=>({...p,appearance:avatar(p.id)}));
    const key=JSON.stringify([room.id,room.status,displayed]);
    if(previous===key)return;
    previous=key;
    const fragment=document.createDocumentFragment();
    for(const [i,p] of displayed.entries()){
      const row=make('div','dg-top3-row'+(p.id===me()?' dg-top3-self':''));
      const medal=make('span','dg-top3-medal',medals[i]);
      const art=make('span','dg-top3-avatar');
      const src=avatarSrc(p.appearance.gender,p.appearance.job);
      if(src){const img=make('img');img.src=src;img.alt='';img.decoding='async';art.appendChild(img);}
      else art.appendChild(make('span','dg-top3-placeholder','🧙'));
      const details=make('span','dg-top3-details');
      const name=make('span','dg-top3-name',p.name);name.title=p.name;
      const amount=make('span','dg-top3-score',format(p.damage));
      details.append(name,amount);
      row.append(medal,art,details);
      fragment.appendChild(row);
    }
    list.replaceChildren(fragment);
  }
  // A visual-only refresh: no extra RPC, events or server traffic.
  const update=()=>{try{render();}catch(e){console.warn('[DG TOP3] visual refresh:',e);}};
  window.setInterval(update,1000);
  window.addEventListener('focus',update);
  window.addEventListener('pageshow',update);
  window.addEventListener('amber-v19-realtime',update);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
  update();
})();
