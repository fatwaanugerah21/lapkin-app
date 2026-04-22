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
    <Card className="flex h-full min-h-0 flex-col hover:shadow-md transition-shadow">
      <div className="flex min-h-0 flex-1 flex-col gap-3">

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {formatReportDate(lapkin.reportDate)}
          </div>

          {showPegawai && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{lapkin.employeeName}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={lapkin.status} />
            <SignedByManagerBadge isSigned={lapkin.isSignedByManager === true} />
            <SignedByEmployeeBadge isSigned={lapkin.isSignedByEmployee === true} />
            <span className="text-xs text-gray-400">{lapkin.rows.length} baris</span>
          </div>

          {showNilaiAkhir && (
            <div className="rounded-md border border-gray-100 bg-gray-50/80 px-2 py-1.5">
              <p className="text-xs font-medium text-gray-700">Nilai akhir (%)</p>
              {average != null ? (
                <p className="text-sm mt-0.5 leading-snug">
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

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <strong>Penilai: </strong>
            <span className="truncate">{lapkin.employeeJobTitle}</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onView(lapkin)}
          className="mt-auto w-full shrink-0 justify-center"
        >
          Lihat
        </Button>
      </div>
    </Card>
  );
};
