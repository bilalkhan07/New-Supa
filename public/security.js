// Comprehensive Protection Script for Design Quixo
(function() {
  'use strict';

  function disableInspection() {
    // 1. Disable Right Click Context Menu on Window & Document
    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    window.addEventListener('contextmenu', preventDefault, true);
    document.addEventListener('contextmenu', preventDefault, true);
    document.oncontextmenu = () => false;
    window.oncontextmenu = () => false;

    // 2. Keyboard shortcut prevention (F12, DevTools, View Source, Save, Print)
    const blockKeys = (e) => {
      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+I / Cmd+Option+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+Shift+K
      if (ctrlOrMeta && (e.shiftKey || e.altKey)) {
        const k = (e.key || '').toUpperCase();
        if (k === 'I' || k === 'J' || k === 'C' || k === 'K' || k === 'S' || k === 'E') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+U (View Source), Ctrl+S (Save), Ctrl+P (Print), Ctrl+A (Select all)
      if (ctrlOrMeta) {
        const k = (e.key || '').toUpperCase();
        if (k === 'U' || k === 'S' || k === 'P') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    window.addEventListener('keydown', blockKeys, true);
    document.addEventListener('keydown', blockKeys, true);

    // 3. Block Dragging & Selection (Allow only form inputs)
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    }, true);

    document.addEventListener('selectstart', (e) => {
      const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        return false;
      }
    }, true);

    document.addEventListener('copy', (e) => {
      const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        return false;
      }
    }, true);
  }

  disableInspection();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', disableInspection);
  }
})();
