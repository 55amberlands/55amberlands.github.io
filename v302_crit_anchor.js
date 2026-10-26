/* V30.2: compact critical damage above the monster, not a full-screen popup. */
(()=>{'use strict';
const st=document.createElement('style');st.id='amber-v302-crit-style';st.textContent=`
#scene{isolation:isolate}
#scene .damage{position:absolute!important;right:auto!important;bottom:auto!important;
 left:65%!important;top:23%!important;max-width:140px!important;
 z-index:11!important;font-size:clamp(12px,3.4vw,17px)!important;
 white-space:nowrap!important;line-height:1.1!important;pointer-events:none!important;
 text-shadow:0 1px 2px #000!important}
#px26Arena .px26-bd.crit{font-size:16px!important;line-height:1.1!important;
 z-index:10!important;pointer-events:none!important}
#px28Ann{max-width:min(210px,54vw)!important;font-size:11px!important;right:5px!important;
 left:auto!important;z-index:55!important}
#px28Ann .px28-ann{padding:4px 6px!important;font-size:11px!important;max-width:210px!important}
body:has(#modalWrap.show) #scene .damage,
body:has(#modalWrap.show) #px28Ann{display:none!important}
`;document.head.appendChild(st);
})();
