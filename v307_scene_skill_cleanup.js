/* 55 AMBERLANDS V30.7 scene and skills guard */
(()=>{'use strict';if(window.AMBER_V307_CLEANUP)return;
window.AMBER_V307_CLEANUP=Object.freeze({version:'30.7',kind:'presentation'});
const s=document.createElement('style');s.id='amber-v307-source-guard';s.textContent=`
/* The source HTML uses transparent placeholders until Pixel V24 skins them. */
#scene #sprites .sprite>img.amber-v307-placeholder:not(.px24-hero){opacity:0!important}
#skills .amber-skill-hits,#skills .amber14-buff-tag{display:none!important}
#scene #px24Scene{image-rendering:pixelated!important;inset:0!important;max-width:100%!important}
#scene .partySprites{max-width:100%!important;min-width:0!important}
#skills.skills>button{overflow:hidden!important}
#skills.skills>button>small{max-width:100%!important;overflow-wrap:anywhere!important}
`;document.head.appendChild(s);
})();
