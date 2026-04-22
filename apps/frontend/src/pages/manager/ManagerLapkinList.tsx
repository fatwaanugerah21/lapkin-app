import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLapkinStore } from '../../stores/lapkin.store';
import { LapkinCard } from '../../components/lapkin/LapkinCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { Input } from '../../components/ui/Input';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Lapkin } from '../../types';
import { useAuthStore } from '../../stores/auth.store';
import { WorkflowHint } from '../../components/layout/WorkflowHint';

type LapkinGroupByEmployee = {
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  lapkins: Lapkin[];
};

type LapkinMonthGroup = {
  monthKey: string;
  monthLabel: string;
  lapkins: Lapkin[];
};

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

function groupLapkinsByEmployee(list: Lapkin[]): LapkinGroupByEmployee[] {
  const byId = new Map<string, Lapkin[]>();
  for (const lapkin of list) {
    const id = lapkin.employeeId;
    const bucket = byId.get(id);
    if (bucket) bucket.push(lapkin);
    else byId.set(id, [lapkin]);
  }

  const groups: LapkinGroupByEmployee[] = [];
  for (const [employeeId, employeeLapkins] of byId) {
    const sample = employeeLapkins[0]!;
    employeeLapkins.sort(
      (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime(),
    );
    groups.push({
      employeeId,
      employeeName: sample.employeeName,
      employeeNip: sample.employeeNip,
      lapkins: employeeLapkins,
    });
  }

  groups.sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'id', { sensitivity: 'base' }));
  return groups;
}

function reportDateKey(reportDate: string): string {
  return reportDate.slice(0, 10);
}

function lapkinMatchesDateRange(lapkin: Lapkin, from: string, to: string): boolean {
  const key = reportDateKey(lapkin.reportDate);
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

type FilterStatus = 'all' | 'locked' | 'evaluated';

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'locked', label: 'Menunggu Evaluasi' },
  { value: 'evaluated', label: 'Sudah Dievaluasi' },
];

export type DirectorLapkinListScope = 'manager' | 'pegawai';

interface ManagerLapkinListProps {
  /** For direktur: which owner role this list shows. Omitted for manajer (full list rules). */
  directorScope?: DirectorLapkinListScope;
}

export const ManagerLapkinList = ({ directorScope }: ManagerLapkinListProps = {}) => {
  const { user } = useAuthStore();
  const { lapkins, fetchAll, isLoading } = useLapkinStore();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = user?.role === 'direktur' ? '/direktur' : '/manager';
  const isDirector = user?.role === 'direktur';

  const listSource = useMemo(() => {
    if (isDirector && directorScope) {
      return lapkins.filter((l) => l.employeeRole === directorScope);
    }
    if (!isDirector && user?.role === 'manager' && user.id) {
      return lapkins.filter((l) => l.employeeId !== user.id);
    }
    return lapkins;
  }, [lapkins, isDirector, directorScope, user?.role, user?.id]);

  const directorListBackPath =
    isDirector && directorScope === 'pegawai'
      ? '/direktur/lapkin/pegawai'
      : isDirector
        ? '/direktur/lapkin'
        : undefined;
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collapsedEmployeeIds, setCollapsedEmployeeIds] = useState<Set<string>>(() => new Set());
  const [collapsedMonthKeysByEmployee, setCollapsedMonthKeysByEmployee] = useState<Record<string, Set<string>>>({});

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const employeeOptions = useMemo(() => {
    const map = new Map<string, { name: string; nip: string }>();
    for (const l of listSource) {
      if (!map.has(l.employeeId)) {
        map.set(l.employeeId, { name: l.employeeName, nip: l.employeeNip });
      }
    }
    return [...map.entries()]
      .map(([id, { name, nip }]) => ({
        value: id,
        label: `${name} — NIP ${nip}`,
        searchHaystack: `${name} ${nip}`.toLowerCase(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'id', { sensitivity: 'base' }));
  }, [listSource]);

  const managerOptions = useMemo(() => {
    if (!(isDirector && directorScope === 'pegawai')) return [];

    const map = new Map<string, { name: string; nip: string | null }>();
    for (const l of listSource) {
      if (l.managerId && !map.has(l.managerId)) {
        map.set(l.managerId, { name: l.managerName ?? '-', nip: l.managerNip });
      }
    }

    return [...map.entries()]
      .map(([id, { name, nip }]) => ({
        value: id,
        label: nip ? `${name} — NIP ${nip}` : name,
        searchHaystack: `${name} ${nip ?? ''}`.toLowerCase(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'id', { sensitivity: 'base' }));
  }, [listSource, isDirector, directorScope]);

  const filtered = useMemo(() => {
    let list = listSource;
    if (statusFilter !== 'all') list = list.filter((l) => l.status === statusFilter);
    if (selectedManagerId) list = list.filter((l) => l.managerId === selectedManagerId);
    if (selectedEmployeeId) list = list.filter((l) => l.employeeId === selectedEmployeeId);
    if (dateFrom || dateTo) list = list.filter((l) => lapkinMatchesDateRange(l, dateFrom, dateTo));
    return list;
  }, [listSource, statusFilter, selectedManagerId, selectedEmployeeId, dateFrom, dateTo]);

  const grouped = useMemo(() => {
    const groups = groupLapkinsByEmployee(filtered);
    if (!(isDirector && directorScope === 'pegawai')) return groups;

    return [...groups].sort((a, b) => {
      const managerA = a.lapkins[0]?.managerName ?? '';
      const managerB = b.lapkins[0]?.managerName ?? '';
      const managerCompare = managerA.localeCompare(managerB, 'id', { sensitivity: 'base' });
      if (managerCompare !== 0) return managerCompare;
      return a.employeeName.localeCompare(b.employeeName, 'id', { sensitivity: 'base' });
    });
  }, [filtered, isDirector, directorScope]);

  const activeFilterBadges = useMemo(() => {
    const badges: { key: string; label: string }[] = [];
    if (selectedEmployeeId) {
      const opt = employeeOptions.find((o) => o.value === selectedEmployeeId);
      const display = opt?.label ?? selectedEmployeeId;
      const short = display.length > 36 ? `${display.slice(0, 36)}…` : display;
      badges.push({
        key: 'pegawai',
        label: `${isDirector && directorScope === 'pegawai' ? 'Pegawai' : isDirector ? 'Manajer' : 'Pegawai'}: ${short}`,
      });
    }
    if (selectedManagerId) {
      const opt = managerOptions.find((o) => o.value === selectedManagerId);
      const display = opt?.label ?? selectedManagerId;
      const short = display.length > 36 ? `${display.slice(0, 36)}…` : display;
      badges.push({ key: 'manager', label: `Manager: ${short}` });
    }
    if (dateFrom) badges.push({ key: 'from', label: `Dari: ${dateFrom}` });
    if (dateTo) badges.push({ key: 'to', label: `Sampai: ${dateTo}` });
    if (statusFilter !== 'all') {
      const label = filterOptions.find((o) => o.value === statusFilter)?.label ?? statusFilter;
      badges.push({ key: 'status', label: `Status: ${label}` });
    }
    return badges;
  }, [selectedEmployeeId, employeeOptions, selectedManagerId, managerOptions, dateFrom, dateTo, statusFilter, isDirector, directorScope]);

  const hasActiveFilters = activeFilterBadges.length > 0;

  const clearFilters = () => {
    setSelectedEmployeeId('');
    setSelectedManagerId('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
  };

  useEffect(() => {
    clearFilters();
    setCollapsedEmployeeIds(new Set());
    setCollapsedMonthKeysByEmployee({});
  }, [location.pathname, directorScope]);

  const toggleGroup = (employeeId: string) => {
    setCollapsedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const toggleMonthForEmployee = (employeeId: string, monthKey: string) => {
    setCollapsedMonthKeysByEmployee((prev) => {
      const current = prev[employeeId] ?? new Set(groupLapkinsByMonth(
        grouped.find((g) => g.employeeId === employeeId)?.lapkins ?? [],
      ).map((m) => m.monthKey));
      const nextSet = new Set(current);
      if (nextSet.has(monthKey)) nextSet.delete(monthKey);
      else nextSet.add(monthKey);
      return { ...prev, [employeeId]: nextSet };
    });
  };

  const emptyDescription =
    listSource.length === 0
      ? isDirector && directorScope === 'pegawai'
        ? 'Belum ada LAPKIN pegawai di bawah struktur Anda (yang sudah dikunci atau selesai).'
        : isDirector && directorScope === 'manager'
          ? 'Belum ada LAPKIN milik manajer bawahan Anda (yang sudah dikunci atau selesai).'
          : 'Belum ada laporan kinerja yang sesuai dengan filter ini.'
      : 'Ubah pegawai, tanggal, atau status untuk melihat hasil lain.';

  const pageTitle = (() => {
    if (!isDirector) return 'LAPKIN Bawahan';
    if (directorScope === 'pegawai') return 'LAPKIN Pegawai';
    return 'LAPKIN Manajer';
  })();

  const pageSubtitle = (() => {
    if (!isDirector) {
      return 'Hanya LAPKIN bawahan langsung (terkunci atau selesai). LAPKIN pribadi Anda ada di menu LAPKIN Saya.';
    }
    if (directorScope === 'pegawai') {
      return 'Pantau LAPKIN pegawai di bawah manajer Anda. Penilaian oleh manajer langsung; halaman ini untuk transparansi pimpinan.';
    }
    return 'LAPKIN yang pemiliknya berperan sebagai manajer: Anda dapat mengisi nilai, meninjau baris, dan paraf setelah siap.';
  })();

  return (
    <div className="p-4">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />

      <div className="mb-3">
        <WorkflowHint
          variant={directorScope === 'pegawai' ? 'directorPegawai' : 'supervisor'}
          className="mb-3"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm hover:bg-gray-50 transition-colors"
          aria-expanded={filtersOpen}
          aria-controls="manager-lapkin-filters"
          id="manager-lapkin-filters-toggle"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={clsx(
                'w-4 h-4 shrink-0 text-gray-500 transition-transform duration-200',
                !filtersOpen && '-rotate-90',
              )}
              aria-hidden
            />
            <span className="text-sm font-medium text-gray-900">Cari &amp; filter</span>
            <span className="ml-auto text-xs text-gray-500 tabular-nums shrink-0">
              {filtered.length}/{listSource.length} LAPKIN
            </span>
          </div>
          {activeFilterBadges.length > 0 && (
            <div
              className="mt-2 flex flex-wrap gap-1 pl-6"
              aria-label="Filter yang dipakai"
            >
              {activeFilterBadges.map((b) => (
                <span
                  key={b.key}
                  className="inline-flex max-w-[min(100%,18rem)] rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-950"
                  title={b.label}
                >
                  <span className="truncate">{b.label}</span>
                </span>
              ))}
            </div>
          )}
        </button>

        {filtersOpen && (
          <div
            id="manager-lapkin-filters"
            role="region"
            aria-labelledby="manager-lapkin-filters-toggle"
            className="mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-3"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-2">
              {isDirector && directorScope === 'pegawai' && (
                <div className="sm:col-span-4">
                  <SearchableSelect
                    label="Manager"
                    placeholder="Semua manager"
                    value={selectedManagerId}
                    onChange={setSelectedManagerId}
                    options={managerOptions}
                  />
                </div>
              )}
              <div className={isDirector && directorScope === 'pegawai' ? 'sm:col-span-4' : 'sm:col-span-5'}>
                <SearchableSelect
                  label={
                    isDirector && directorScope === 'pegawai'
                      ? 'Pegawai'
                      : isDirector
                        ? 'Manajer'
                        : 'Pegawai'
                  }
                  placeholder={
                    isDirector && directorScope === 'pegawai'
                      ? 'Semua pegawai'
                      : isDirector
                        ? 'Semua manajer'
                        : 'Semua pegawai'
                  }
                  value={selectedEmployeeId}
                  onChange={setSelectedEmployeeId}
                  options={employeeOptions}
                />
              </div>
              <div className={isDirector && directorScope === 'pegawai' ? 'sm:col-span-2' : 'sm:col-span-3'}>
                <Input
                  label="Tgl dari"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="py-2 text-sm"
                />
              </div>
              <div className={isDirector && directorScope === 'pegawai' ? 'sm:col-span-2' : 'sm:col-span-4'}>
                <Input
                  label="Tgl sampai"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
              <span className="text-[11px] font-medium text-gray-500 shrink-0 mr-0.5">Status</span>
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    statusFilter === opt.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300',
                  )}
                >
                  {opt.label}
                  {opt.value !== 'all' && (
                    <span className="ml-1 opacity-80 tabular-nums">
                      ({listSource.filter((l) => l.status === opt.value).length})
                    </span>
                  )}
                </button>
              ))}
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-xs"
                >
                  Hapus filter
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={listSource.length === 0 ? 'Tidak ada LAPKIN' : 'Tidak ada hasil'}
          description={emptyDescription}
          action={
            listSource.length > 0 && hasActiveFilters ? (
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Hapus filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => {
            const isExpanded = !collapsedEmployeeIds.has(group.employeeId);
            const pendingEvaluationCount = group.lapkins.filter((lapkin) => lapkin.status === 'locked').length;
            const sampleLapkin = group.lapkins[0];
            const managerDetails =
              sampleLapkin?.managerName && sampleLapkin?.managerNip
                ? `${sampleLapkin.managerName} (NIP ${sampleLapkin.managerNip})`
                : sampleLapkin?.managerName ?? '-';
            return (
              <section key={group.employeeId} className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.employeeId)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <ChevronDown
                    className={clsx(
                      'w-5 h-5 shrink-0 text-gray-500 mt-0.5 transition-transform duration-200',
                      !isExpanded && '-rotate-90',
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-gray-900">{group.employeeName}</h2>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">NIP {group.employeeNip}</p>
                    {isDirector && directorScope === 'pegawai' && (
                      <p className="text-xs text-gray-600 mt-1">
                        Manager: <span className="font-medium text-gray-700">{managerDetails}</span>
                      </p>
                    )}
                  </div>
                  {pendingEvaluationCount > 0 && (
                    <span className="shrink-0 rounded-full border border-yellow-200 bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800 self-center tabular-nums">
                      {pendingEvaluationCount} perlu evaluasi
                    </span>
                  )}
                  <span className="text-xs text-gray-500 shrink-0 tabular-nums self-center">
                    {group.lapkins.length} LAPKIN
                  </span>
                </button>
                {isExpanded && (
                  <div className="space-y-3 px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50/50">
                    {groupLapkinsByMonth(group.lapkins).map((monthGroup) => {
                      const collapsedMonthKeys = collapsedMonthKeysByEmployee[group.employeeId]
                        ?? new Set(groupLapkinsByMonth(group.lapkins).map((m) => m.monthKey));
                      const isMonthExpanded = !collapsedMonthKeys.has(monthGroup.monthKey);
                      return (
                        <div key={monthGroup.monthKey} className="rounded-md border border-gray-200 bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleMonthForEmployee(group.employeeId, monthGroup.monthKey)}
                            className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-gray-50 transition-colors"
                            aria-expanded={isMonthExpanded}
                          >
                            <ChevronDown
                              className={clsx(
                                'w-4 h-4 shrink-0 text-gray-500 transition-transform duration-200',
                                !isMonthExpanded && '-rotate-90',
                              )}
                              aria-hidden
                            />
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              {monthGroup.monthLabel}
                            </h3>
                            <span className="ml-auto text-[11px] text-gray-500 tabular-nums">
                              {monthGroup.lapkins.length} LAPKIN
                            </span>
                          </button>
                          {isMonthExpanded && (
                            <div className="grid grid-cols-1 gap-2 border-t border-gray-100 bg-gray-50/40 p-2 md:grid-cols-2 xl:grid-cols-3">
                              {monthGroup.lapkins.map((lapkin) => (
                                <LapkinCard
                                  key={lapkin.id}
                                  lapkin={lapkin}
                                  onView={(l) =>
                                    navigate(`${basePath}/lapkin/${l.id}`, {
                                      state: directorListBackPath ? { directorListBackPath } : undefined,
                                    })
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
