import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-gray-500 text-sm mt-1 leading-snug">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0 sm:ml-4">{action}</div>}
  </div>
);
