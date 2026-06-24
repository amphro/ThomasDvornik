import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function hexToRgb(hex: string): string | null {
  const h = hex.trim().replace('#', '');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return `${r},${g},${b}`;
}

function readAccent(): string {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  return hexToRgb(hex) ?? '192,68,27';
}

export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);
  const accentRgbRef = useRef<string>('192,68,27');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const NODE_COUNT = 55;
    const CONNECT_DIST = 130;
    const REPEL_DIST = 110;

    accentRgbRef.current = readAccent();

    const observer = new MutationObserver(() => {
      accentRgbRef.current = readAccent();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function init() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      }));
    }

    function tick() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      nodesRef.current.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) { n.x = 0; n.vx *= -1; }
        if (n.x > w) { n.x = w; n.vx *= -1; }
        if (n.y < 0) { n.y = 0; n.vy *= -1; }
        if (n.y > h) { n.y = h; n.vy *= -1; }

        const dx = n.x - mx;
        const dy = n.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < REPEL_DIST && d > 0) {
          const force = ((REPEL_DIST - d) / REPEL_DIST) * 0.6;
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
          n.vx *= 0.92;
          n.vy *= 0.92;
        }

        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        const maxSpeed = 1.2;
        if (speed > maxSpeed) {
          n.vx = (n.vx / speed) * maxSpeed;
          n.vy = (n.vy / speed) * maxSpeed;
        }
      });
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const rgb = accentRgbRef.current;
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.3;
            ctx.strokeStyle = `rgba(${rgb},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        ctx.fillStyle = `rgba(${rgb},0.45)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function loop() {
      tick();
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    resize();
    init();

    if (prefersReduced) {
      draw();
    } else {
      loop();
    }

    function onResize() {
      resize();
      init();
      if (prefersReduced) draw();
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    window.addEventListener('resize', onResize);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
