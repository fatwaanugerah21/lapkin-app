import { ReactNode } from 'react';
import { FileX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      {icon ?? <FileX className="w-8 h-8 text-gray-400" />}
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
