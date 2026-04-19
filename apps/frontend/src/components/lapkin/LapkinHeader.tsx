import { Lapkin } from '../../types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface LapkinHeaderProps {
  lapkin: Lapkin;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[200px_1fr] text-sm">
    <span className="font-medium text-gray-600">{label}</span>
    <span className="text-gray-900">: {value}</span>
  </div>
);

export const LapkinHeader = ({ lapkin }: LapkinHeaderProps) => {
  const reportDateLabel = format(new Date(lapkin.reportDate), 'EEEE, dd MMMM yyyy', { locale: idLocale });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-2">
      <InfoRow label="NAMA" value={lapkin.employeeName} />
      <InfoRow label="NIP" value={lapkin.employeeNip} />
      <InfoRow label="JABATAN" value={lapkin.employeeJobTitle} />
      <InfoRow label="NAMA ATASAN LANGSUNG" value={lapkin.managerName ?? '-'} />
      <InfoRow label="JABATAN ATASAN LANGSUNG" value={lapkin.managerJobTitle ?? '-'} />
      <InfoRow label="HARI / TANGGAL" value={reportDateLabel} />
    </div>
  );
};
