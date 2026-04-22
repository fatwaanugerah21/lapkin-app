import { clsx } from 'clsx';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

const HIDE_MS = 100;
const TOUCH_VISIBLE_MS = 2800;

interface TooltipProps {
  content: ReactNode;
  children: React.ReactNode;
  /** When false, the tooltip never opens. */
  enabled?: boolean;
  /** Delay before opening (ms). */
  showDelayMs?: number;
  /**
   * Invisible layer on top of children so hover/touch works on disabled buttons
   * (native disabled controls often swallow pointer events).
   */
  captureHover?: boolean;
}

export function Tooltip({
  content,
  children,
  enabled = true,
  showDelayMs = 50,
  captureHover = false,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const showRef = useRef<ReturnType<typeof setTimeout>>();
  const hideRef = useRef<ReturnType<typeof setTimeout>>();

  const clearTimers = useCallback(() => {
    if (showRef.current) clearTimeout(showRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const scheduleOpen = useCallback(() => {
    if (!enabled || content == null || content === '') return;
    clearTimers();
    showRef.current = setTimeout(() => setOpen(true), showDelayMs);
  }, [enabled, content, showDelayMs, clearTimers]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    hideRef.current = setTimeout(() => setOpen(false), HIDE_MS);
  }, [clearTimers]);

  const openImmediate = useCallback(() => {
    if (!enabled || content == null || content === '') return;
    clearTimers();
    setOpen(true);
    hideRef.current = setTimeout(() => setOpen(false), TOUCH_VISIBLE_MS);
  }, [enabled, content, clearTimers]);

  const hoverHandlers = captureHover
    ? {}
    : {
      onMouseEnter: scheduleOpen,
      onMouseLeave: scheduleClose,
    };

  const captureHandlers = captureHover
    ? {
      onMouseEnter: scheduleOpen,
      onMouseLeave: scheduleClose,
      onTouchStart: () => {
        openImmediate();
      },
    }
    : {};

  return (
    <span className={clsx('relative inline-flex max-w-full justify-center')} {...hoverHandlers}>
      <span className="relative inline-flex">
        {children}
        {enabled && captureHover && (
          <span
            className="absolute inset-0 z-[1] cursor-help rounded-lg touch-manipulation"
            aria-hidden
            {...captureHandlers}
          />
        )}
      </span>
      <span
        role="tooltip"
        className={clsx(
          'absolute bottom-full left-1/2 z-[70] mb-2 -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-2 text-left text-xs font-normal leading-snug text-white shadow-xl',
          'min-w-[15rem] max-w-[30rem]',
          'pointer-events-none motion-safe:transition-[opacity,transform,visibility] motion-safe:duration-150 motion-safe:ease-out',
          open
            ? 'visible translate-y-0 opacity-100 motion-reduce:transition-none'
            : 'invisible translate-y-1 opacity-0 motion-reduce:translate-y-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}
