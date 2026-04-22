import { useState, useEffect, useRef, useCallback } from 'react';
import { Lapkin } from '../../types';
import { useLapkinStore } from '../../stores/lapkin.store';
import {
  ScoreDraft,
  draftsFromRow,
  buildManagerPayload,
  rowScoresComplete,
  rowHasWorkActivities,
} from './lapkinTableScoreUtils';

export function useLapkinManagerRowScores(lapkin: Lapkin) {
  const { managerUpdateRowScores } = useLapkinStore();
  const [scoreDraftsByRow, setScoreDraftsByRow] = useState<Record<string, ScoreDraft[]>>({});
  const lapkinRef = useRef(lapkin);
  const draftsRef = useRef(scoreDraftsByRow);
  lapkinRef.current = lapkin;
  draftsRef.current = scoreDraftsByRow;

  useEffect(() => {
    const next: Record<string, ScoreDraft[]> = {};
    for (const row of lapkin.rows) {
      next[row.id] = draftsFromRow(row);
    }
    setScoreDraftsByRow(next);
  }, [lapkin.id, lapkin.updatedAt]);

  const patchScoreDraft = useCallback(
    (rowId: string, activityIndex: number, partial: Partial<ScoreDraft>) => {
      setScoreDraftsByRow((prev) => {
        const row = lapkinRef.current.rows.find((r) => r.id === rowId);
        if (!row) return prev;
        const current = prev[rowId] ?? draftsFromRow(row);
        const nextDrafts = current.map((d, i) => (i === activityIndex ? { ...d, ...partial } : d));
        return { ...prev, [rowId]: nextDrafts };
      });
    },
    [],
  );

  const persistAllEvaluableRows = useCallback(async () => {
    const l = lapkinRef.current;
    for (const row of l.rows) {
      if (!rowHasWorkActivities(row)) continue;
      const d = draftsRef.current[row.id];
      if (!d || !rowScoresComplete(row, d)) {
        throw new Error(
          `Lengkapi baris ${row.lineNumber}: isi minimal salah satu dari hasil kinerja, tugas dinas luar, atau tidak masuk kerja, serta nilai akhir, untuk setiap kegiatan.`,
        );
      }
      await managerUpdateRowScores(l.id, row.id, buildManagerPayload(row, d));
    }
  }, [managerUpdateRowScores]);

  return { scoreDraftsByRow, patchScoreDraft, persistAllEvaluableRows };
}
