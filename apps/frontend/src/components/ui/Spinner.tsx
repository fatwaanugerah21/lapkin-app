import { clsx } from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

export const Spinner = ({ size = 'md', className }: SpinnerProps) => (
  <div className={clsx('animate-spin rounded-full border-2 border-gray-200 border-t-primary-600', sizeClasses[size], className)} />
);

export const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);
