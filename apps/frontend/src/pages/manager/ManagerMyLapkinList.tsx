import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useLapkinStore } from '../../stores/lapkin.store';
import { useAuthStore } from '../../stores/auth.store';
import { LapkinCard } from '../../components/lapkin/LapkinCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/ui/DatePicker';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import type { Lapkin } from '../../types';
import { WorkflowHint } from '../../components/layout/WorkflowHint';

type LapkinMonthGroup = {
  monthKey: string;
  monthLabel: string;
  lapkins: Lapkin[];
};

const MONTH_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
] as const;

function monthKeyFromReportDate(reportDate: string): string {
  return reportDate.slice(0, 7);
}

function monthLabelFromKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthKey;
  return format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: idLocale });
}

function groupLapkinsByMonth(list: Lapkin[]): LapkinMonthGroup[] {
  const byMonth = new Map<string, Lapkin[]>();
  for (const lapkin of list) {
    const key = monthKeyFromReportDate(lapkin.reportDate);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(lapkin);
    else byMonth.set(key, [lapkin]);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthLapkins]) => ({
      monthKey,
      monthLabel: monthLabelFromKey(monthKey),
      lapkins: [...monthLapkins].sort(
        (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime(),
      ),
    }));
}

function reportDateKey(reportDate: string): string {
  return reportDate.slice(0, 10);
}

function monthPart(reportDate: string): string {
  const value = reportDate.slice(5, 7);
  return /^\d{2}$/.test(value) ? value : '';
}

function yearPart(reportDate: string): string {
  const value = reportDate.slice(0, 4);
  return /^\d{4}$/.test(value) ? value : '';
}

function getLapkinAverageScore(lapkin: Lapkin): number | null {
  const scores: number[] = [];
  for (const row of lapkin.rows) {
    for (const activity of row.activities ?? []) {
      if (activity.isRest === true) continue;
      if (activity.finalScore == null || String(activity.finalScore).trim() === '') continue;
      const parsed = Number(activity.finalScore);
      if (Number.isFinite(parsed)) scores.push(parsed);
    }
  }
  if (scores.length === 0) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export const ManagerMyLapkinList = () => {
  const { user } = useAuthStore();
  const { lapkins, fetchAll, createLapkin, isLoading } = useLapkinStore();
  const { isLoading: isCreating, run } = useAsyncAction();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reportDate, setReportDate] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [scoreMin, setScoreMin] = useState('');
  const [scoreMax, setScoreMax] = useState('');
  const [collapsedMonthKeys, setCollapsedMonthKeys] = useState<Set<string>>(new Set());

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const myLapkins = useMemo(() => {
    if (!user?.id) return [];
    return lapkins.filter((l) => l.employeeId === user.id);
  }, [lapkins, user?.id]);
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const lapkin of myLapkins) {
      const year = yearPart(lapkin.reportDate);
      if (year) years.add(year);
    }
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [myLapkins]);
  const filteredLapkins = useMemo(() => {
    const parsedMin = scoreMin.trim() === '' ? null : Number(scoreMin);
    const parsedMax = scoreMax.trim() === '' ? null : Number(scoreMax);

    return myLapkins.filter((lapkin) => {
      const dateKey = reportDateKey(lapkin.reportDate);
      if (selectedDate && dateKey !== selectedDate) return false;
      if (selectedMonth && monthPart(lapkin.reportDate) !== selectedMonth) return false;
      if (selectedYear && yearPart(lapkin.reportDate) !== selectedYear) return false;

      if (parsedMin != null || parsedMax != null) {
        const avg = getLapkinAverageScore(lapkin);
        if (avg == null) return false;
        if (parsedMin != null && Number.isFinite(parsedMin) && avg < parsedMin) return false;
        if (parsedMax != null && Number.isFinite(parsedMax) && avg > parsedMax) return false;
      }

      return true;
    });
  }, [myLapkins, selectedDate, selectedMonth, selectedYear, scoreMin, scoreMax]);
  const groupedByMonth = useMemo(() => groupLapkinsByMonth(filteredLapkins), [filteredLapkins]);

  useEffect(() => {
    setCollapsedMonthKeys((prev) => {
      const validKeys = new Set(groupedByMonth.map((group) => group.monthKey));
      const next = new Set<string>();
      for (const key of prev) {
        if (validKeys.has(key)) next.add(key);
      }
      return next;
    });
  }, [groupedByMonth]);

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonthKeys((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setScoreMin('');
    setScoreMax('');
  };

  const activeFilterCount = [
    selectedDate,
    selectedMonth,
    selectedYear,
    scoreMin.trim(),
    scoreMax.trim(),
  ].filter(Boolean).length;

  const handleCreate = async () => {
    if (!reportDate) return;
    const lapkin = await run(() => createLapkin(reportDate), { successToast: 'LAPKIN berhasil dibuat' });
    if (lapkin) {
      setShowCreateModal(false);
      navigate(`/manager/lapkin/${(lapkin as Lapkin).id}`, {
        state: { managerListBackPath: '/manager/lapkin/saya' },
      });
    }
  };

  return (
    <div className="p-4">
      <PageHeader
        title="LAPKIN Saya"
        subtitle="Laporan kinerja Anda sebagai manajer — sama seperti pegawai: isi draf, kunci untuk ditinjau atasan (direktur)"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Buat LAPKIN Baru
          </Button>
        }
      />

      <WorkflowHint variant="pegawai" className="mb-3" />

      <div className="mb-3">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm hover:bg-gray-50 transition-colors"
          aria-expanded={filtersOpen}
          aria-controls="manager-my-lapkin-filters"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={clsx('w-4 h-4 text-gray-500 transition-transform duration-200', !filtersOpen && '-rotate-90')}
              aria-hidden
            />
            <span className="text-sm font-medium text-gray-900">Filter</span>
            <span className="ml-auto text-xs text-gray-500 tabular-nums">
              {filteredLapkins.length}/{myLapkins.length} LAPKIN
            </span>
          </div>
        </button>
        {filtersOpen && (
          <div
            id="manager-my-lapkin-filters"
            className="mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-3"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <DatePicker
                  label="Tanggal"
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
              </div>
              <div className="sm:col-span-4">
                <SelectMenu
                  label="Bulan"
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  options={MONTH_OPTIONS.map((month) => ({ value: month.value, label: month.label }))}
                  placeholder="Semua bulan"
                />
              </div>
              <div className="sm:col-span-4">
                <SelectMenu
                  label="Tahun"
                  value={selectedYear}
                  onChange={setSelectedYear}
                  options={availableYears.map((year) => ({ value: year, label: year }))}
                  placeholder="Semua tahun"
                />
              </div>
              <div className="sm:col-span-6">
                <Input
                  label="Nilai evaluasi min"
                  type="number"
                  min={0}
                  max={100}
                  value={scoreMin}
                  onChange={(e) => setScoreMin(e.target.value)}
                  clearable
                />
              </div>
              <div className="sm:col-span-6">
                <Input
                  label="Nilai evaluasi max"
                  type="number"
                  min={0}
                  max={100}
                  value={scoreMax}
                  onChange={(e) => setScoreMax(e.target.value)}
                  clearable
                />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  Hapus filter
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : myLapkins.length === 0 ? (
        <EmptyState
          title="Belum ada LAPKIN"
          description="Buat LAPKIN pertama dengan tombol Buat LAPKIN Baru di atas."
          action={
            <Button onClick={() => setShowCreateModal(true)}>Buat LAPKIN Baru</Button>
          }
        />
      ) : filteredLapkins.length === 0 ? (
        <EmptyState
          title="Tidak ada hasil"
          description="Ubah filter tanggal, bulan, tahun, atau nilai evaluasi untuk melihat hasil lain."
          action={<Button type="button" variant="secondary" onClick={clearFilters}>Hapus filter</Button>}
        />
      ) : (
        <div className="space-y-4">
          {groupedByMonth.map((group) => {
            const isExpanded = !collapsedMonthKeys.has(group.monthKey);
            return (
              <section key={group.monthKey} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMonth(group.monthKey)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <ChevronDown
                    className={clsx(
                      'w-4 h-4 shrink-0 text-gray-500 transition-transform duration-200',
                      !isExpanded && '-rotate-90',
                    )}
                    aria-hidden
                  />
                  <h2 className="text-sm font-semibold text-gray-800 capitalize">{group.monthLabel}</h2>
                  <span className="ml-auto text-xs text-gray-500 tabular-nums">{group.lapkins.length} LAPKIN</span>
                </button>
                {isExpanded && (
                  <div className="grid grid-cols-1 gap-2 border-t border-gray-100 bg-gray-50/40 p-2 md:grid-cols-2 xl:grid-cols-3">
                    {group.lapkins.map((lapkin) => (
                      <LapkinCard
                        key={lapkin.id}
                        lapkin={lapkin}
                        onView={(l) =>
                          navigate(`/manager/lapkin/${l.id}`, {
                            state: { managerListBackPath: '/manager/lapkin/saya' },
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Buat LAPKIN Baru" size="sm">
        <div className="space-y-4">
          <Input
            label="Tanggal"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Batal</Button>
            <Button onClick={handleCreate} isLoading={isCreating} disabled={!reportDate}>Buat</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
