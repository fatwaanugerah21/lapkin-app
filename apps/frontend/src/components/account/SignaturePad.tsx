import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { clsx } from 'clsx';

export type SignaturePadHandle = {
  toDataURL: () => string | null;
  clear: () => void;
  loadFromDataUrl: (url: string | null) => void;
};

type SignaturePadProps = {
  className?: string;
};

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 160;

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const hasInkRef = useRef(false);
    const lastRef = useRef<{ x: number; y: number } | null>(null);

    const applyBaseStyle = useCallback((ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }, []);

    const fillWhite = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      applyBaseStyle(ctx);
    }, [applyBaseStyle]);

    const clear = useCallback(() => {
      fillWhite();
      hasInkRef.current = false;
      lastRef.current = null;
    }, [fillWhite]);

    useEffect(() => {
      clear();
    }, [clear]);

    const getPoint = (ev: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (ev.clientX - rect.left) * scaleX,
        y: (ev.clientY - rect.top) * scaleY,
      };
    };

    const onPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      ev.currentTarget.setPointerCapture(ev.pointerId);
      drawingRef.current = true;
      hasInkRef.current = true;
      lastRef.current = getPoint(ev);
      const ctx = canvas.getContext('2d');
      if (!ctx || !lastRef.current) return;
      applyBaseStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x, lastRef.current.y);
    };

    const onPointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const last = lastRef.current;
      if (!canvas || !ctx || !last) return;
      const p = getPoint(ev);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastRef.current = p;
    };

    const onPointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
      drawingRef.current = false;
      lastRef.current = null;
      try {
        ev.currentTarget.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    };

    useImperativeHandle(ref, () => ({
      clear,
      loadFromDataUrl: (url: string | null) => {
        clear();
        if (!url || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          hasInkRef.current = true;
        };
        img.src = url;
      },
      toDataURL: () => {
        if (!hasInkRef.current || !canvasRef.current) return null;
        return canvasRef.current.toDataURL('image/png');
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className={clsx(
          'touch-none cursor-crosshair rounded-lg border border-gray-300 bg-white max-w-full h-auto w-full',
          className,
        )}
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
      />
    );
  },
);

SignaturePad.displayName = 'SignaturePad';
