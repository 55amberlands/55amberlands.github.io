/* 55 AMBERLANDS V30.6 | Mobile layout / HUD stability
 * Compare with index.html (V1/V6/V8), V24 scene, V28 HUD, V30.3-30.5 CSS.
 * PRESENTATION ONLY. No SQL, Supabase RPC, save, combat, drop, skill cost or inventory changes.
 * This file is loaded after V30.5. Revert by removing its <script> from index.html.
 */
(() => {
  'use strict';
  if (window.AMBER_V306_MOBILE_STABILITY) return;
  window.AMBER_V306_MOBILE_STABILITY = Object.freeze({version:'30.6', type:'presentation-only'});

  const css = document.createElement('style');
  css.id = 'amber-v306-mobile-layout';
  css.textContent = `
/* A single sizing model. The V8 display:contents layout must not fight V6 flex. */
html,body{width:100%;max-width:100%;overflow-x:hidden}
.layout,.layout>.left,.layout>.middle,.layout>.right,
.layout .panel,.layout .scene,.layout .scenefoot,
.layout .battlecontrols,.layout .skills{box-sizing:border-box;min-width:0;max-width:100%}
.layout .panel{overflow-x:hidden}
#scene{position:relative;isolation:isolate;overflow:hidden!important;max-width:100%!important}
#scene #px24Scene{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:100%!important;object-fit:fill;pointer-events:none!important}
#scene #sprites,#scene #mobScene{max-width:100%;box-sizing:border-box}
#scene #sprites .sprite{min-width:0!important;box-sizing:border-box}
#scene #sprites .sprite>img:not(.px24-wing):not(.amber20-characterWing):not(.amber23-pet-sprite){max-width:100%!important;object-fit:contain!important;background:transparent!important}
/* Skill cards are NOT a free-width flex row: prevent 5 narrow towers and letter wrapping. */
#skills.skills{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))!important;gap:8px!important;width:100%!important;padding:8px!important;align-content:start!important;align-items:stretch!important;justify-content:stretch!important;overflow:visible!important}
#skills.skills>button{position:relative!important;display:grid!important;grid-template-columns:46px minmax(0,1fr)!important;align-items:center!important;justify-items:stretch!important;align-content:center!important;gap:7px!important;min-width:0!important;max-width:100%!important;width:100%!important;min-height:66px!important;height:auto!important;padding:7px 8px!important;margin:0!important;white-space:normal!important;overflow:hidden!important;transform:none!important;animation:none!important;text-align:left!important;box-sizing:border-box!important}
#skills.skills>button>img{display:block!important;grid-column:1!important;width:46px!important;height:46px!important;max-width:46px!important;max-height:46px!important;min-width:0!important;flex:none!important;object-fit:contain!important;animation:none!important;transform:none!important}
#skills.skills>button>small{display:-webkit-box!important;grid-column:2!important;min-width:0!important;width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;line-clamp:2;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;line-height:1.35!important;font-size:12px!important;font-weight:750!important;text-align:left!important}
#skills.skills>small{grid-column:1/-1;white-space:normal}
/* The skill-tree modal is a vertical list, never narrow multi-columns. */
#skilltree,.skillrow{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
#skilltree .skillrow{display:grid!important;grid-template-columns:48px minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important;width:100%!important}
#skilltree .skillrow>img{width:44px!important;height:44px!important;max-width:100%!important;object-fit:contain!important}
#skilltree .skillrow>div{min-width:0!important;overflow-wrap:anywhere!important}
#skilltree .skillrow>button{min-width:50px!important;max-width:76px!important;padding:5px!important}
#modalWrap.show .modal{min-width:0!important;max-width:min(580px,calc(100vw - 16px))!important;overflow-x:hidden!important;box-sizing:border-box!important}
#modalBody,#modalBody>*{max-width:100%;min-width:0;box-sizing:border-box}
/* V30.5 quick potions must fit profile width, not spill onto the world scene. */
.top .statsline{min-width:0!important;max-width:100%!important;overflow:visible!important}
.top .statsline #px28Hud{box-sizing:border-box!important;max-width:100%!important;width:100%!important;min-width:0!important;transform:none!important}
.top .statsline #px28Hud .px28-hq{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important;width:100%!important;min-width:0!important;align-items:stretch!important}
.top .statsline #px28Hud .px28-hq>[data-px28]{min-width:0!important;width:auto!important;min-height:32px!important;padding:4px 2px!important;white-space:nowrap!important;overflow:hidden!important;font-size:11px!important;flex:none!important}
/* Old layered HUD inside the scene must not cover the live scene canvas. */
#scene #px28Hud{display:none!important}
@media(max-width:700px){
 .layout{display:flex!important;flex-flow:column nowrap!important;width:100%!important;max-width:100%!important;margin:0 auto!important;padding:6px!important;gap:8px!important;overflow:visible!important}
 .layout>.middle,.layout>.left,.layout>.right{display:flex!important;flex-flow:column nowrap!important;align-items:stretch!important;align-content:initial!important;gap:8px!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important}
 .layout>.middle{order:0!important}.layout>.left{order:1!important}.layout>.right{order:2!important}
 .layout>.middle>.panel,.layout>.left>.panel,.layout>.right>.panel{width:100%!important;max-width:100%!important;min-width:0!important;flex:0 0 auto!important;order:initial!important}
 .layout .panel:has(#scene){order:0!important}
 .layout .scene{width:100%!important;height:clamp(300px,100vw,450px)!important;min-height:300px!important;max-height:450px!important}
 .layout .scenetitle{max-width:calc(100% - 16px)!important;white-space:normal!important;overflow-wrap:anywhere!important}
 .layout .scenefoot{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
 .layout .scenefoot>*{min-width:0!important;max-width:100%!important}
 .layout .scenefoot>label{grid-column:1/-1!important}
 .layout .battlecontrols{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
 .layout .battlecontrols>button{min-width:0!important;width:100%!important}
 #skills.skills{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}
 #skills.skills>button{grid-template-columns:40px minmax(0,1fr)!important;min-height:64px!important;padding:5px!important;gap:5px!important}
 #skills.skills>button>img{width:40px!important;height:40px!important;max-width:40px!important;max-height:40px!important}
 #skills.skills>button>small{font-size:11px!important}
 .top .statsline #px28Hud .px28-hq>[data-px28]{font-size:10px!important}
 .nav{box-sizing:border-box!important;max-width:100vw!important;left:0!important;right:0!important;overflow-x:hidden!important}
 .nav>button{min-width:0!important;max-width:100%!important;box-sizing:border-box!important;white-space:normal!important;overflow-wrap:anywhere!important}
 #px26Arena{left:0!important;right:0!important;width:100%!important;max-width:100vw!important;overflow-x:hidden!important}
 #px26Arena .px26-field,#px26Arena .px26-party-stack{min-width:0!important;max-width:100%!important;overflow-x:hidden!important}
 #px26Arena .px26-grp{min-width:0!important;max-width:100%!important}
}
@media(max-width:359px){
 #skills.skills{grid-template-columns:1fr!important}
 #skills.skills>button{grid-template-columns:46px minmax(0,1fr)!important}
}
`;
  document.head.appendChild(css);

  // HP/MP/EXP bars: avoid replacing entire elements each combat tick.
  // This also preserves any animated fill instead of restarting it every 0.5-1s.
  function stableBar(id, value, maximum, type) {
    const host = document.getElementById(id);
    if (!host) return;
    const numeric = Number(value) || 0, max = Number(maximum) || 0;
    const pct = max > 0 ? Math.max(0,Math.min(100, numeric / max * 100)) : 0;
    let fill = host.querySelector(':scope > .fill');
    let label = host.querySelector(':scope > .barlabel');
    if (!fill || !label) {
      host.replaceChildren();
      fill = document.createElement('div');
      label = document.createElement('div');
      host.append(fill,label);
    }
    const cls = 'fill ' + String(type || '');
    if (fill.className !== cls) fill.className = cls;
    const width = pct.toFixed(3) + '%';
    if (fill.style.width !== width) fill.style.width = width;
    if (label.className !== 'barlabel') label.className = 'barlabel';
    const fmt = n => Math.max(0,Number(n)||0).toLocaleString('th-TH',{maximumFractionDigits:0});
    const labelValue = fmt(numeric) + ' / ' + fmt(max);
    if (label.textContent !== labelValue) label.textContent = labelValue;
  }
  if (typeof window.bar === 'function' && !window.bar.__amber306) {
    stableBar.__amber306 = true;
    window.bar = stableBar;
  }

  // The legacy renderer creates HTML from data: image URLs on every battle tick.
  // Compare learned skill IDs, not the entire markup/image URL. One logical
  // skill load should produce one stable card DOM, then V28 paints its icon.
  if (typeof window.renderSkills === 'function' && !window.renderSkills.__amber306) {
    const original = window.renderSkills;
    const stableSkills = function(...args) {
      try {
        const host = document.getElementById('skills');
        const st = typeof state !== 'undefined' ? state : null;
        const arr = typeof SKILLS !== 'undefined' ? SKILLS : null;
        if (host && st && Array.isArray(st.learned) && Array.isArray(arr)) {
          const sig = arr.filter(sk => st.learned.includes(sk.id)).slice(0,8).map(sk => String(sk.id)).join('|') || '__none__';
          if (host.dataset.amber306SkillSig === sig && host.firstElementChild) return;
          const result = original.apply(this,args);
          host.dataset.amber306SkillSig = sig;
          return result;
        }
      } catch (e) { console.warn('[AMBER V30.6] stable skills fallback',e); }
      return original.apply(this,args);
    };
    stableSkills.__amber306 = true;
    window.renderSkills = stableSkills;
  }

  // Keep layout height/safe-area accurate when the expanded bottom menu changes
  // size, without touching the menu's existing open/close or persisted setting.
  const nav = document.querySelector('.nav');
  if (nav && typeof ResizeObserver === 'function') {
    const fit = () => {
      const h = Math.ceil(nav.getBoundingClientRect().height);
      if (h > 0 && h < window.innerHeight * .8) {
        const v = h + 'px';
        if (document.body.style.getPropertyValue('--amber24-nav-height') !== v)
          document.body.style.setProperty('--amber24-nav-height',v);
      }
    };
    const obs = new ResizeObserver(fit);obs.observe(nav);fit();
  }
  console.info('[55 AMBERLANDS] V30.6 mobile layout + stable skill & vitals render enabled');
})();
