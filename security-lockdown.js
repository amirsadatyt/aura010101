/* security-lockdown.js */
(() => {
  const block = (name) => () => { throw new Error(`${name} blocked by security policy`); };
  window.eval = block('eval');
  window.Function = block('Function');
  Document.prototype.write = block('document.write');
  Document.prototype.writeln = block('document.writeln');

  const safeSet = (obj, key) => {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (!desc || desc.configurable) {
      Object.defineProperty(obj, key, { configurable: false, writable: false, value: obj[key] });
    }
  };
  [
    Element.prototype.insertAdjacentHTML,
    Element.prototype.setAttribute,
    Node.prototype.appendChild,
    Node.prototype.insertBefore
  ].forEach(fn => fn && safeSet(fn, 'name'));

  if (top !== self) {
    top.location = self.location;
  }

  const AUTO_LOCK_MS = 60_000;
  let hideTimer;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hideTimer = setTimeout(() => {
        try { localStorage.removeItem('aura_user_store'); } catch(e){}
        location.reload();
      }, AUTO_LOCK_MS);
    } else {
      clearTimeout(hideTimer);
    }
  }, { passive: true });

  if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {
    window.trustedTypes.createPolicy('aura', {
      createHTML: (s) => s,
      createScriptURL: (s) => s
    });
  }
})();
