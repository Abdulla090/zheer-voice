import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  color?: string;
}

const Waveform: React.FC<WaveformProps> = ({ analyser, isPlaying, color = '#38bdf8' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    // We need to wait for layout to get client sizes, but assuming standard container
    const rect = canvas.getBoundingClientRect();

    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Normalize coordinate system to use css pixels.
    ctx.scale(dpr, dpr);

    // Configuration
    const fftSize = 256;
    let dataArray: Uint8Array;
    let bufferLength: number = 0;

    if (analyser) {
      analyser.fftSize = fftSize;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const draw = () => {
      // Use CSS dimensions
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // --- Draw Background Line ---
      ctx.beginPath();
      ctx.strokeStyle = `${color}33`; // low opacity
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else if (dataArray) {
        // If paused/stopped, zero out slowly or instantly? Instantly for now.
        dataArray.fill(0);
      }

      if (analyser) {
        const barWidth = (width / (bufferLength / 1.5)) * 1; // Show lower ~2/3rds of frequencies
        let barHeight;
        let x = 0;

        ctx.fillStyle = color;

        // We only draw the first portion of frequencies as speech usually resides there
        const meaningfulLength = Math.floor(bufferLength * 0.7);

        for (let i = 0; i < meaningfulLength; i++) {
          const value = dataArray[i];
          const percent = value / 255;

          barHeight = percent * height;

          // Center the bars vertically
          const y = (height - barHeight) / 2;

          // Draw rounded bars
          roundRect(ctx, x, y, barWidth - 2, barHeight, 2);

          x += barWidth;
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isPlaying, color]);

  // Helper for rounded rects
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full opacity-90"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Waveform;