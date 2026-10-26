/* V30.5 presentation-only safeguards. NO economy, combat or Supabase calls. */
(()=>{'use strict';
if(window.AMBER_V305_LAYOUT)return;
window.AMBER_V305_LAYOUT=Object.freeze({version:'30.5',purpose:'single HUD and V28 branding'});
const sheet=document.createElement('style');sheet.id='amber-v305-stable-layout';sheet.textContent=`
/* V28 pixel-art identity, replacing the original procedural V1 image */
.top #logo{display:block!important;width:min(94vw,480px)!important;height:auto!important;
  max-height:120px!important;aspect-ratio:1200/296!important;object-fit:contain!important;
  margin-inline:auto!important;image-rendering:auto!important;}
/* Exactly one quick-action bar, in the character profile, NEVER on top of the world. */
.top .statsline #px28Hud{position:static!important;inset:auto!important;
  margin:5px 0 0!important;padding:0!important;display:flex!important;
  width:100%!important;max-width:100%!important;align-items:center!important;
  justify-content:flex-start!important;gap:3px!important;flex-wrap:nowrap!important;
  transform:none!important;z-index:auto!important;box-sizing:border-box!important;
  background:transparent!important;overflow:visible!important;}
.top .statsline #px28Hud .px28-hq{display:flex!important;flex:1 1 auto!important;
  width:100%!important;margin:0!important;gap:3px!important;justify-content:flex-start!important;
  align-items:center!important;flex-wrap:nowrap!important;min-width:0!important;}
.top .statsline #px28Hud [data-px28]{position:static!important;float:none!important;
  min-width:0!important;min-height:27px!important;padding:3px 4px!important;
  font-size:10px!important;line-height:1.2!important;white-space:nowrap!important;
  display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;
  flex:1 1 0!important;box-sizing:border-box!important;max-width:100%!important;}
.top .statsline #px28Hud [data-px28] img{height:15px!important;width:15px!important;
  object-fit:contain!important;flex:none!important;}
/* One full-size pixel world canvas; no old inline HTML-world texture bleeding through. */
#scene{background-image:none!important;background-color:#101827!important;isolation:isolate;}
#scene #px24Scene{display:block!important;opacity:1!important;z-index:0!important;
  animation:none!important;filter:none!important;pointer-events:none!important;}
/* Avoid duplicate weapon glows: V28 is the owner of equipment enchant effects. */
#sprites .sprite:has(>.px28-enh)>.px24-equipfx.weapon{display:none!important;}
/* Keep titles and wings visible, but stop oversized white bloom obscuring monsters. */
#sprites .sprite>.px25-aura{opacity:.32!important;filter:none!important;}
/* World Boss: bound its rendered background and sparks, NOT boss damage/effects. */
#px26Arena{height:100dvh!important;max-height:100dvh!important;overscroll-behavior:contain!important;}
#px26Arena #px26Bg{opacity:.18!important;filter:brightness(.62)!important;}
#px26Arena #px26Fx{opacity:.4!important;}
#px26Arena .px26-field{min-height:0!important;max-width:100%!important;
  overflow-y:auto!important;overflow-x:hidden!important;flex:1 1 0!important;}
@media(max-width:700px){
  .top #logo{width:min(92vw,440px)!important;max-height:112px!important;}
  .top .statsline #px28Hud [data-px28]{font-size:9px!important;padding:2px 2px!important;}
  #px26Arena .px26-bimg{height:min(20dvh,155px)!important;}
  #px26Arena .px26-top{min-width:0!important;gap:5px!important;padding:4px 7px!important;}
  #px26Arena .px26-top>*{min-width:0!important;}
  #px26Arena .px26-boss{min-width:0!important;}
}
/* The emoji button never overlaps the mobile nav or the scene toolbar. */
body:not(.amber24-menu-closed) #px25EmoBtn{bottom:calc(var(--amber24-nav-height,165px) + 72px + env(safe-area-inset-bottom,0px))!important;}
body:not(.amber24-menu-closed) #px25EmoPanel{bottom:calc(var(--amber24-nav-height,165px) + 120px + env(safe-area-inset-bottom,0px))!important;}
body:has(#modalWrap.show) #px25EmoBtn,body:has(#modalWrap.show) #px25EmoPanel{display:none!important;}
`;document.head.appendChild(sheet);
})();
