const palette = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899'];

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 320;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width, height };
}

function projectPoint(point, width, height, padding) {
  const px = padding + point.x * (width - padding * 2);
  const py = height - padding - point.y * (height - padding * 2);
  return { x: px, y: py };
}

function drawAxes(ctx, width, height, padding) {
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.fillText('Centralité existentielle →', width / 2 - 60, height - padding + 24);
  ctx.save();
  ctx.translate(padding - 32, height / 2 + 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Densité relationnelle →', 0, 0);
  ctx.restore();
}

function drawBubbles(ctx, points, clusters, width, height, padding) {
  return points.map((p) => {
    const cluster = clusters?.get(p.word) ?? 0;
    const color = palette[cluster % palette.length];
    const { x, y } = projectPoint(p, width, height, padding);
    const radius = Math.max(8, p.r || 10);
    ctx.fillStyle = `${color}55`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.word, x, y + 3);
    return { ...p, x: x, y: y, radius };
  });
}

function drawTooltip(ctx, bubble) {
  if (!bubble) return;
  const padding = 6;
  const text = `${bubble.word} · x:${bubble.rawX} y:${bubble.rawY}`;
  ctx.font = '11px Inter, system-ui, sans-serif';
  const textWidth = ctx.measureText(text).width;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = 24;
  const x = Math.min(bubble.x + 10, ctx.canvas.clientWidth - boxWidth - 4);
  const y = Math.max(bubble.y - boxHeight - 10, 8);

  ctx.fillStyle = '#0f172acc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, boxWidth, boxHeight);
  ctx.strokeRect(x, y, boxWidth, boxHeight);
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + padding, y + boxHeight / 1.5);
}

export function renderBubbleDiagram(canvas, points, clusters) {
  const { ctx, width, height } = setupCanvas(canvas);
  const padding = 42;
  let rendered = [];

  function redraw(hovered) {
    ctx.clearRect(0, 0, width, height);
    drawAxes(ctx, width, height, padding);
    rendered = drawBubbles(ctx, points, clusters, width, height, padding);
    if (hovered) drawTooltip(ctx, hovered);
  }

  redraw();

  function handleMove(evt) {
    const rect = canvas.getBoundingClientRect();
    const mx = evt.clientX - rect.left;
    const my = evt.clientY - rect.top;
    const hit = rendered.find((b) => (mx - b.x) ** 2 + (my - b.y) ** 2 <= (b.radius + 4) ** 2);
    redraw(hit ? { ...hit, rawX: points.find((p) => p.word === hit.word)?.x ?? 0, rawY: points.find((p) => p.word === hit.word)?.y ?? 0 } : null);
  }

  const handleLeave = () => redraw();

  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseleave', handleLeave);

  return () => {
    canvas.removeEventListener('mousemove', handleMove);
    canvas.removeEventListener('mouseleave', handleLeave);
  };
}

export function exportDiagram(canvas) {
  return canvas.toDataURL('image/png', 1);
}
