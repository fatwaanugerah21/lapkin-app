import { clsx } from 'clsx';

const FTS_HREF = 'https://ftsdigihouse.com';

export type FtsDigihouseCreditVariant = 'login' | 'sidebar' | 'footer';

interface FtsDigihouseCreditProps {
  variant: FtsDigihouseCreditVariant;
}

export const FtsDigihouseCredit = ({ variant }: FtsDigihouseCreditProps) => (
  <a
    href={FTS_HREF}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="FTS digihouse — buka situs web"
    className={clsx(
      'group flex items-center gap-2 no-underline transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-md',
      variant === 'sidebar' && 'flex-col px-2 py-2 text-center focus-visible:ring-primary-500 focus-visible:ring-offset-gray-900',
      variant === 'footer' &&
        'justify-center gap-2.5 py-2.5 px-4 focus-visible:ring-primary-500 focus-visible:ring-offset-white',
      variant === 'login' &&
        'flex-col gap-2 pb-6 focus-visible:ring-primary-300 focus-visible:ring-offset-primary-900',
    )}
  >
    <img
      src="/fts-logo.png"
      alt=""
      className={clsx(
        'object-contain shrink-0',
        variant === 'sidebar' && 'h-9 w-auto max-w-[7rem]',
        variant === 'footer' && 'h-8 w-auto max-w-[6.5rem]',
        variant === 'login' && 'h-11 w-auto max-w-[8rem] drop-shadow-md',
      )}
    />
    <span
      className={clsx(
        'text-xs leading-snug',
        variant === 'sidebar' && 'text-gray-500 group-hover:text-gray-400',
        variant === 'footer' && 'text-gray-600 group-hover:text-gray-700',
        variant === 'login' && 'text-center text-primary-100/95',
      )}
    >
      Dibangun oleh{' '}
      <span
        className={clsx(
          'font-semibold',
          variant === 'sidebar' && 'text-gray-300',
          variant === 'footer' && 'text-gray-800',
          variant === 'login' && 'text-white',
        )}
      >
        ftsdigihouse
      </span>
    </span>
  </a>
);
