export function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });
  return overlay;
}

export function createCloseButton(handler) {
  const btn = document.createElement('button');
  btn.className = 'close-btn';
  btn.innerHTML = '✕';
  if (typeof handler === 'function') {
    btn.addEventListener('click', handler);
  }
  return btn;
}
