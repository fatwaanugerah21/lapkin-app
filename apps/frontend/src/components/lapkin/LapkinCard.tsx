import { Lapkin } from '../../types';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface LapkinCardProps {
  lapkin: Lapkin;
  onView: (lapkin: Lapkin) => void;
  showPegawai?: boolean;
}

const formatTanggal = (dateStr: string) =>
  format(new Date(dateStr), 'EEEE, dd MMMM yyyy', { locale: idLocale });

export const LapkinCard = ({ lapkin, onView, showPegawai = false }: LapkinCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <StatusBadge status={lapkin.status} />
          <span className="text-xs text-gray-400">{lapkin.rows.length} baris</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mb-1">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {formatTanggal(lapkin.tanggal)}
        </div>

        {showPegawai && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{lapkin.pegawaiName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <FileText className="w-3 h-3" />
          {lapkin.pegawaiJabatan}
        </div>
      </div>

      <Button size="sm" variant="secondary" onClick={() => onView(lapkin)} className="ml-4 flex-shrink-0">
        Lihat
      </Button>
    </div>
  </Card>
);
