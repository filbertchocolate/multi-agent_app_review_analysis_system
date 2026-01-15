
import React, { useEffect, useRef } from 'react';
import { Stone, Star, Point, Meteor } from '../types';

interface BackgroundCanvasProps {
  hoverTargetId: string | null;
}

const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ hoverTargetId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stonesRef = useRef<Stone[]>([]);
  const starsRef = useRef<Star[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
  // Fix: Provided 'null' as an initial argument to useRef to satisfy 'Expected 1 arguments, but got 0' error.
  const animationFrameRef = useRef<number | null>(null);

  const generatePoints = (count: number): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.6 + Math.random() * 0.4;
      pts.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return pts;
  };

  const createMeteor = (startX?: number, startY?: number): Meteor => {
    const width = window.innerWidth;
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
    const speed = 18 + Math.random() * 12;
    
    // If coordinates provided, start there. Otherwise start off-screen top/left
    const x = startX !== undefined ? startX : Math.random() * width;
    const y = startY !== undefined ? startY : -100;

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: 100 + Math.random() * 120,
      opacity: 1,
      active: true
    };
  };

  const init = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    stonesRef.current = [];
    starsRef.current = [];
    meteorsRef.current = [];

    for (let i = 0; i < 25; i++) {
      stonesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 200 + 100,
        points: generatePoints(6 + Math.floor(Math.random() * 4)),
        opacity: 0.1 + Math.random() * 0.1,
        rotation: Math.random() * Math.PI * 2
      });
    }

    for (let i = 0; i < 120; i++) {
      const vx = (Math.random() - 0.5) * 0.1;
      const vy = (Math.random() - 0.5) * 0.1;
      starsRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        baseVx: vx + 0.05, 
        baseVy: vy + 0.02, 
        blink: Math.random() * Math.PI,
        blinkSpeed: 0.02 + Math.random() * 0.03
      });
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0a0c14';
    ctx.fillRect(0, 0, width, height);

    // Draw Stones
    ctx.lineJoin = 'round';
    stonesRef.current.forEach(stone => {
      ctx.save();
      ctx.translate(stone.x, stone.y);
      ctx.rotate(stone.rotation);
      ctx.beginPath();
      ctx.moveTo(stone.points[0].x * stone.size, stone.points[0].y * stone.size);
      for (let i = 1; i < stone.points.length; i++) {
        ctx.lineTo(stone.points[i].x * stone.size, stone.points[i].y * stone.size);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(20, 30, 45, ${stone.opacity})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(50, 70, 100, 0.2)`;
      ctx.stroke();
      ctx.restore();
    });

    // Golden flowing background lines
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.06)';
    ctx.lineWidth = 1;
    const time = Date.now() * 0.0005;
    for (let i = 0; i < 12; i++) {
      ctx.moveTo(0, height * (i / 12) + Math.sin(time + i) * 30);
      ctx.bezierCurveTo(
        width * 0.33, height * (i / 12) - 100 * Math.sin(time),
        width * 0.66, height * (i / 12) + 100 * Math.cos(time),
        width, height * (i / 12) + Math.cos(time + i) * 30
      );
    }
    ctx.stroke();

    // Random Meteors logic
    if (Math.random() < 0.004 && meteorsRef.current.length < 5) {
      meteorsRef.current.push(createMeteor());
    }

    meteorsRef.current.forEach((m) => {
      if (!m.active) return;
      m.x += m.vx;
      m.y += m.vy;
      m.opacity -= 0.012;

      if (m.opacity <= 0 || m.x > width + 400 || m.y > height + 400 || m.x < -400 || m.y < -400) {
        m.active = false;
      } else {
        const tailLength = 15;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * tailLength, m.y - m.vy * tailLength);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
        grad.addColorStop(0.1, `rgba(212, 175, 55, ${m.opacity * 0.9})`);
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * tailLength, m.y - m.vy * tailLength);
        ctx.stroke();

        // Glow effect
        ctx.beginPath();
        ctx.fillStyle = `rgba(212, 175, 55, ${m.opacity * 0.4})`;
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    meteorsRef.current = meteorsRef.current.filter(m => m.active);

    // Attraction target
    let targetX: number | null = null;
    let targetY: number | null = null;
    if (hoverTargetId) {
      const el = document.getElementById(hoverTargetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }
    }

    // Stars logic
    starsRef.current.forEach(star => {
      let dx = 0;
      let dy = 0;
      let speedMultiplier = 1;

      if (targetX !== null && targetY !== null) {
        const vecX = targetX - star.x;
        const vecY = targetY - star.y;
        const dist = Math.sqrt(vecX * vecX + vecY * vecY);
        if (dist < 400) {
            const angle = Math.atan2(vecY, vecX);
            const pullStrength = (400 - dist) / 100;
            dx = Math.cos(angle) * pullStrength;
            dy = Math.sin(angle) * pullStrength;
            speedMultiplier = 2;
        }
      }

      star.x += (star.baseVx * speedMultiplier) + (dx * 0.2);
      star.y += (star.baseVy * speedMultiplier) + (dy * 0.2);
      star.blink += star.blinkSpeed;

      if (star.x < -10) star.x = width + 10;
      if (star.x > width + 10) star.x = -10;
      if (star.y < -10) star.y = height + 10;
      if (star.y > height + 10) star.y = -10;

      const opacity = (Math.sin(star.blink) + 1) / 2;
      
      if (star.size > 1.2) {
        const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
        grad.addColorStop(0, `rgba(212, 175, 55, ${opacity * 0.3})`);
        grad.addColorStop(1, `rgba(212, 175, 55, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(212, 175, 55, ${opacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    init();
    draw();

    const handleResize = () => init();
    const handleClick = (e: MouseEvent) => {
      // Trigger a meteor at the click position
      meteorsRef.current.push(createMeteor(e.clientX, e.clientY));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', handleClick);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleClick);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export default BackgroundCanvas;
