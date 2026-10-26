/* AMBER V30.1.5 -- stable skill HUD: never recreate the same DOM each combat repaint.
 * V14/V12 retain original effects/cooldowns; V28 icon painter attaches once to stable buttons.
 * No additional hero or skill overlay, no RLS/write operations. */
(() => {
  'use strict';
  const apply = () => {
    const box = document.getElementById('skills');
    if (!box || typeof window.renderSkills !== 'function') return false;
    if (window.renderSkills.__amber3015) return true;
    const old = window.renderSkills;
    let prevSig = null;
    const stable = function (...args) {
      const el = document.getElementById('skills');
      let sig = null, expected = -1;
      try {
        if (typeof state !== 'undefined' && Array.isArray(state.learned)) {
          // Stable between skill learning, class, skill-point and level changes.
          expected = Math.min(8,state.learned.length);
          sig = [String(state.job || ''), String(state.lv || ''), String(state.skillPoints || ''), state.learned.join('\u001e')].join('\u001f');
        }
      } catch (_) { /* use original painter */ }
      if (sig !== null && sig === prevSig && el && el.children.length &&
          el.querySelectorAll(':scope > button').length === expected) return;
      const ret=old.apply(this,args);
      prevSig = sig;
      // Buttons remain in place until the signature changes; V28 icon painter can now
      // decorate the same <img> instead of endlessly flashing its fallback asset.
      return ret;
    };
    stable.__amber3015 = true;
    window.renderSkills = stable;
    return true;
  };
  if (!apply()) document.addEventListener('DOMContentLoaded', apply, {once:true});
})();
