/*
 * Adaptado de pixel-agents-hq/pixel-agents:
 * webview-ui/src/office/engine/gameLoop.ts
 * Copyright (c) 2026 Pablo De Lucca — licença MIT.
 * Veja THIRD_PARTY_NOTICES.md.
 */
function startGameLoop(canvas, callbacks) {
  const ctx = canvas.getContext('2d');
  let lastTime = 0;
  let rafId = 0;
  let stopped = false;

  const frame = time => {
    if (stopped) return;
    const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    callbacks.update(dt, time);
    callbacks.render(ctx, time);
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
  };
}
