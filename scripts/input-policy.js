(function (root) {
  'use strict';
  const interactive = 'button,a,input,textarea,select,summary,details,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="textbox"],[data-no-advance],nav,dialog';
  function isInteractive(target) {
    return !!(target && typeof target.closest === 'function' && target.closest(interactive));
  }
  function canAdvance({ fullscreen, panelOpen, transitioning, target, selectedText, dragged, inStage }) {
    return !!fullscreen && !panelOpen && !transitioning && !!inStage &&
      !isInteractive(target) && !String(selectedText || '').trim() && !dragged;
  }
  function isFullscreen(doc, media) {
    return !!(doc.fullscreenElement || doc.webkitFullscreenElement || (media && media.matches) ||
      (doc.body && doc.body.classList.contains('presentation-mode')));
  }
  const api = Object.freeze({ isInteractive, canAdvance, isFullscreen });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClassroomInput = api;
})(typeof window === 'object' ? window : this);
