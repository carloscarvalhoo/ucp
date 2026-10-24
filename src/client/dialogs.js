(() => {
  const bound = new WeakSet();
  function bind(dialog) {
    if (bound.has(dialog)) return;
    bound.add(dialog);
    let startedOutside = false;
    function outside(event) {
      const r = dialog.getBoundingClientRect();
      return (
        event.target === dialog &&
        (event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom)
      );
    }
    function dismiss() {
      if (dialog.dispatchEvent(new Event('before-dismiss', { cancelable: true }))) dialog.close();
    }
    dialog.addEventListener('pointerdown', (event) => {
      startedOutside = outside(event);
    });
    dialog.addEventListener('click', (event) => {
      if (startedOutside && outside(event)) dismiss();
      startedOutside = false;
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      dismiss();
    });
  }
  document.querySelectorAll('dialog').forEach(bind);
  new MutationObserver((records) => {
    for (const record of records)
      for (const added of record.addedNodes) {
        if (added.nodeType !== 1) continue;
        if (added.matches('dialog')) bind(added);
        added.querySelectorAll('dialog').forEach(bind);
      }
  }).observe(document.body, { childList: true, subtree: true });
})();
