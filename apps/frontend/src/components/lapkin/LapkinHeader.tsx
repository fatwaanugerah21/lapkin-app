import { Lapkin } from '../../types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface LapkinHeaderProps {
  lapkin: Lapkin;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-x-1 text-sm leading-snug sm:grid-cols-[200px_1fr]">
    <span className="font-medium text-gray-600">{label}</span>
    <span className="text-gray-900">: {value}</span>
  </div>
);

export const LapkinHeader = ({ lapkin }: LapkinHeaderProps) => {
  const reportDateLabel = format(new Date(lapkin.reportDate), 'EEEE, dd MMMM yyyy', { locale: idLocale });

  const supervisorName =
    lapkin.managerName?.trim()
    || (lapkin.employeeRole === 'manager' ? '—' : '-');
  const supervisorJobTitle =
    lapkin.managerJobTitle?.trim()
    || (lapkin.employeeRole === 'manager' ? 'Direktur' : '-');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-1.5">
      <InfoRow label="NAMA" value={lapkin.employeeName} />
      <InfoRow label="NIP" value={lapkin.employeeNip} />
      <InfoRow label="JABATAN" value={lapkin.employeeJobTitle} />
      <InfoRow label="NAMA ATASAN LANGSUNG" value={supervisorName} />
      <InfoRow label="JABATAN ATASAN LANGSUNG" value={supervisorJobTitle} />
      <InfoRow label="HARI / TANGGAL" value={reportDateLabel} />
    </div>
  );
};
