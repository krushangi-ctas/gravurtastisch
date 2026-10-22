import { useEffect, useRef } from "react";

interface WaveConfig {
  yBase: number;       // Vertical base ratio (0 to 1)
  amp: number;         // Primary amplitude in px (increased for smooth round curves)
  amp2: number;        // Secondary harmonic amplitude in px
  freq: number;        // Primary frequency
  freq2: number;       // Secondary frequency
  speed: number;       // Animation speed
  color: [number, number, number]; // Brand RGB colors
  fillAlpha: number;   // Fill opacity
  lineWidth: number;   // Stroke width
  strokeAlpha: number; // Stroke opacity
}

export function FooterWaveCanvas({ className = "absolute inset-0 w-full h-full pointer-events-none" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number = 0;
    let isVisible = true;
    let time = 0;
    let mouseX = -1;
    let targetMouseWave = 0;
    let currentMouseWave = 0;

    // 3 Curvaceous, visibly rounded ("golakar") waves in brand colors (#0032ab & #4f6ef7)
    const waves: WaveConfig[] = [
      {
        yBase: 0.30,
        amp: 28,
        amp2: 14,
        freq: 0.0036,
        freq2: 0.0068,
        speed: 0.013,
        color: [79, 110, 247], // #4f6ef7 (Brand Bright Blue)
        fillAlpha: 0.18,
        lineWidth: 1.8,
        strokeAlpha: 0.70,
      },
      {
        yBase: 0.50,
        amp: 36,
        amp2: 16,
        freq: 0.0030,
        freq2: 0.0058,
        speed: 0.016,
        color: [0, 50, 171], // #0032ab (Brand Main Navy)
        fillAlpha: 0.24,
        lineWidth: 2.0,
        strokeAlpha: 0.75,
      },
      {
        yBase: 0.68,
        amp: 28,
        amp2: 12,
        freq: 0.0040,
        freq2: 0.0076,
        speed: 0.011,
        color: [79, 110, 247], // #4f6ef7 (Brand Bright Blue)
        fillAlpha: 0.20,
        lineWidth: 1.6,
        strokeAlpha: 0.60,
      },
    ];

    // High DPI / Retina support
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (width === 0 || height === 0) return;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      targetMouseWave = 1.0;
    };

    const handleMouseLeave = () => {
      targetMouseWave = 0.0;
    };

    const parentElem = canvas.parentElement;
    if (parentElem) {
      parentElem.addEventListener("mousemove", handleMouseMove, { passive: true });
      parentElem.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    }

    // Pause when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Animation Loop
    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      currentMouseWave += (targetMouseWave - currentMouseWave) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const step = width < 768 ? 5 : 2.5;

      waves.forEach((w, waveIdx) => {
        const [r, g, b] = w.color;
        const baseY = height * w.yBase;

        // Draw filled wave down to bottom of band
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width + step; x += step) {
          const primary = Math.sin(x * w.freq + time * w.speed * 60 + waveIdx * 1.8) * w.amp;
          const secondary = Math.cos(x * w.freq2 - time * w.speed * 32 + waveIdx) * w.amp2;

          let mouseFactor = 0;
          if (currentMouseWave > 0.01 && mouseX >= 0) {
            const dist = Math.abs(x - mouseX);
            if (dist < 220) {
              const influence = (1 - dist / 220) * currentMouseWave;
              mouseFactor = Math.sin((x - mouseX) * 0.02 + time * 3) * (8 * influence);
            }
          }

          const y = baseY + primary + secondary + mouseFactor;

          if (x === 0) {
            ctx.lineTo(0, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(0, baseY - w.amp, 0, height);
        fillGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${w.fillAlpha})`);
        fillGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${w.fillAlpha * 0.6})`);
        fillGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.02)`);
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Draw crisp wave crest stroke
        ctx.beginPath();
        for (let x = 0; x <= width + step; x += step) {
          const primary = Math.sin(x * w.freq + time * w.speed * 60 + waveIdx * 1.8) * w.amp;
          const secondary = Math.cos(x * w.freq2 - time * w.speed * 32 + waveIdx) * w.amp2;

          let mouseFactor = 0;
          if (currentMouseWave > 0.01 && mouseX >= 0) {
            const dist = Math.abs(x - mouseX);
            if (dist < 220) {
              const influence = (1 - dist / 220) * currentMouseWave;
              mouseFactor = Math.sin((x - mouseX) * 0.02 + time * 3) * (8 * influence);
            }
          }

          const y = baseY + primary + secondary + mouseFactor;
          if (x === 0) ctx.moveTo(0, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${w.strokeAlpha})`;
        ctx.lineWidth = w.lineWidth;
        ctx.stroke();
      });

      time += 0.016;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      if (parentElem) {
        parentElem.removeEventListener("mousemove", handleMouseMove);
        parentElem.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
