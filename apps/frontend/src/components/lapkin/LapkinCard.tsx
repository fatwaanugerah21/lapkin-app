import { Lapkin } from '../../types';
import { Card } from '../ui/Card';
import { StatusBadge, SignedByEmployeeBadge, SignedByManagerBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface LapkinCardProps {
  lapkin: Lapkin;
  onView: (lapkin: Lapkin) => void;
  showPegawai?: boolean;
}

const formatReportDate = (dateStr: string) =>
  format(new Date(dateStr), 'EEEE, dd MMMM yyyy', { locale: idLocale });

/** Non-rest activities with a numeric finalScore (same source as kolom Nilai Akhir di tabel). */
function getFinalScoreSummary(lapkin: Lapkin) {
  let workActivityCount = 0;
  const scores: number[] = [];
  for (const row of lapkin.rows) {
    for (const a of row.activities ?? []) {
      if (a.isRest === true) continue;
      workActivityCount += 1;
      const raw = a.finalScore;
      if (raw == null || String(raw).trim() === '') continue;
      const n = Number(raw);
      if (Number.isFinite(n)) scores.push(n);
    }
  }
  const scoredCount = scores.length;
  const average =
    scoredCount > 0
      ? Math.round((scores.reduce((s, x) => s + x, 0) / scoredCount) * 10) / 10
      : null;
  return { workActivityCount, scoredCount, average };
}

export const LapkinCard = ({ lapkin, onView, showPegawai = false }: LapkinCardProps) => {
  const { workActivityCount, scoredCount, average } = getFinalScoreSummary(lapkin);
  const showNilaiAkhir = workActivityCount > 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={lapkin.status} />
            <SignedByManagerBadge isSigned={lapkin.isSignedByManager === true} />
            <SignedByEmployeeBadge isSigned={lapkin.isSignedByEmployee === true} />
            <span className="text-xs text-gray-400">{lapkin.rows.length} baris</span>
          </div>

          {showNilaiAkhir && (
            <div className="mb-2 rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-2">
              <p className="text-xs font-medium text-gray-700">Nilai akhir (%)</p>
              {average != null ? (
                <p className="text-sm mt-0.5">
                  <span className="font-semibold tabular-nums text-green-700">{average}%</span>
                  <span className="text-xs text-gray-500 ml-1.5">
                    rata-rata · {scoredCount}/{workActivityCount} kegiatan
                  </span>
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">Belum ada nilai akhir pada kegiatan kerja.</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mb-1">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {formatReportDate(lapkin.reportDate)}
          </div>

          {showPegawai && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{lapkin.employeeName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <FileText className="w-3 h-3" />
            {lapkin.employeeJobTitle}
          </div>
        </div>

        <Button size="sm" variant="secondary" onClick={() => onView(lapkin)} className="ml-4 flex-shrink-0">
          Lihat
        </Button>
      </div>
    </Card>
  );
};
