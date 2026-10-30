/* 55 AMBERLANDS V30.0: server-authenticated HP/MP maximums.
 * This is a DISPLAY bridge only: no client damage, healing, gold, or
 * potion quantity is calculated or stored here. The server is authoritative.
 */
(()=>{
  'use strict';
  if(typeof state==='undefined' || typeof maxHp!=='function' ||
     typeof maxMp!=='function' || typeof renderTop!=='function'){
    console.warn('[V300] HP/MP bridge waiting for game boot');return;
  }
  const cloud=()=>window.AMBER_CLOUD;
  let cache=null, pending=false, retryAfter=0, serial=0;
  const sane=n=>Number.isFinite(Number(n))?Number(n):0;
  const rawStat=k=>Math.max(0,sane(state?.stats?.[k]));
  const userId=()=>String(cloud()?.getUser?.()?.id||'');
  function fingerprint(){
    const eq=state?.eq||{},gear=Array.isArray(state?.gear)?state.gear:[];
    const equip=['W','S','G','B','R'].map(slot=>{
      const id=String(eq[slot]||'');
      const g=gear.find(item=>String(item.id)===id);
      return [slot,id,g?.enh,g?.req,g?.cls,g?.base?.HP,g?.base?.MP,g?.base?.VIT,g?.base?.INT,g?.opts];
    });
    return JSON.stringify([userId(),sane(state?.lv),sane(state?.v25?.rebirth),
      rawStat('VIT'),rawStat('INT'),state?.job,equip]);
  }
  function fallback(){
    // Preview uses the persisted stat mirror until Supabase replies. It never writes
    // HP, MP or equipment bonuses; server max_hp/max_mp replace this estimate.
    const lv=Math.max(1,Math.min(100,Math.round(sane(state?.lv)||1)));
    const rb=Math.max(0,Math.min(10,Math.round(sane(state?.v25?.rebirth))));
    const vit=rawStat('VIT'),intel=rawStat('INT');
    return {
      max_hp:Math.max(1,Math.round(250+(lv-1)*48+Math.max(0,vit-10)*8+rb*1500)),
      max_mp:Math.max(1,Math.round(120+(lv-1)*17+intel*2-10+Math.max(0,intel-5)*3+rb*400))
    };
  }
  function current(){
    return cache && cache.key===fingerprint()?cache:fallback();
  }
  maxHp=function v300MaxHp(){return current().max_hp};
  maxMp=function v300MaxMp(){return current().max_mp};
  const previousRenderTop=renderTop;
  renderTop=function v300RenderTop(...args){
    const result=previousRenderTop.apply(this,args);
    refresh(false);
    return result;
  };
  async function refresh(force=false){
    const sdk=cloud()?.getClient?.();
    if(!cloud()?.getStatus?.()?.cloudReady || !sdk || !userId())return;
    const key=fingerprint();
    if(pending || Date.now()<retryAfter)return;
    if(!force && cache?.key===key && Date.now()-cache.time<15000)return;
    pending=true;
    const id=++serial;
    try {
      const {data,error}=await sdk.rpc('amber_v300_vitals');
      if(error)throw error;
      const hp=Number(data?.max_hp),mp=Number(data?.max_mp);
      if(!data?.ok || !Number.isInteger(hp) || !Number.isInteger(mp) ||
         hp<=0 || mp<=0 || hp>500000 || mp>500000)throw Error('V300_INVALID_VITALS');
      // A reply for an older player/equipment setup must never update the HUD.
      if(id===serial && key===fingerprint()){
        const was=cache?.max_hp!==hp || cache?.max_mp!==mp || cache?.key!==key;
        cache={key,max_hp:hp,max_mp:mp,time:Date.now()};
        if(was)previousRenderTop();
      }
    } catch(err){
      retryAfter=Date.now()+3500;
      console.warn('[V300] Could not sync HP/MP maximum from Supabase',err);
    } finally {
      pending=false;
    }
  }
  window.AMBER_V300_VITALS={version:'30.0',refresh:()=>refresh(true),get:()=>({...current()})};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true)});
  window.addEventListener('pageshow',()=>refresh(true));
  window.addEventListener('focus',()=>refresh(true));
  setInterval(()=>refresh(true),16000);
  setTimeout(()=>refresh(true),1000);
  console.info('[55 AMBERLANDS V300] HP/MP maximums now read from verified Supabase equipment stats');
})();
