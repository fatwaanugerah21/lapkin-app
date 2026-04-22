import { Lapkin, LapkinRow, LapkinRowActivity, LapkinRowActivityInput } from '../../types';

export type ScoreDraft = {
  performance: string;
  fieldDuty: string;
  notWorking: string;
  finalScore: string;
  notes: string;
};

/** Stored as percent for API compatibility: 0 = unchecked, 100 = checked. */
export const NOT_WORKING_UNCHECKED = '0';
export const NOT_WORKING_CHECKED = '100';

/** Strip commas from display; turn decimal comma into a dot (e.g. 85,5 → 85.5). */
export function normalizeDecimalInputString(raw: string): string {
  const t = raw.trim();
  if (t === '') return '';
  const commaIdx = t.lastIndexOf(',');
  const dotIdx = t.lastIndexOf('.');
  if (commaIdx !== -1 && (dotIdx === -1 || commaIdx > dotIdx)) {
    return t.replace(/\./g, '').replace(',', '.');
  }
  return t.replace(/,/g, '');
}

export const notWorkingPercentToDraft = (value: string | null | undefined): string => {
  if (value == null || String(value).trim() === '') return NOT_WORKING_UNCHECKED;
  const n = Number(normalizeDecimalInputString(String(value)));
  return Number.isFinite(n) && n > 0 ? NOT_WORKING_CHECKED : NOT_WORKING_UNCHECKED;
};

export const isNotWorkingDraftChecked = (draft: string): boolean => {
  const n = Number(normalizeDecimalInputString(draft));
  return Number.isFinite(n) && n > 0;
};

export const parsePercentInput = (s: string): number | null => {
  const t = normalizeDecimalInputString(s);
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/** Whole number 0–100 for display and drafts (no decimals, no locale formatting). */
export function formatPercentCellDisplay(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = parsePercentInput(String(value));
  if (n == null) return '';
  return String(Math.round(Math.min(100, Math.max(0, n))));
}

/**
 * For text inputs: normalize paste/locale, clamp and round to integer 0–100.
 * Empty string allowed while editing.
 */
export function sanitizePercentIntegerInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  const normalized = normalizeDecimalInputString(trimmed);
  if (normalized === '' || normalized === '.') return '';
  const n = Number(normalized);
  if (!Number.isFinite(n)) return '';
  return String(Math.min(100, Math.max(0, Math.round(n))));
}

function percentFieldToPayload(s: string): number | null {
  const n = parsePercentInput(s);
  if (n == null) return null;
  return Math.round(Math.min(100, Math.max(0, n)));
}

/** Draft field: unset / null from API stays empty (no implied 0). */
export function percentDraftFromApi(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '';
  return formatPercentCellDisplay(value);
}

export const draftsFromRow = (row: LapkinRow): ScoreDraft[] =>
  row.activities.map((a) => ({
    performance: percentDraftFromApi(a.performancePercent),
    fieldDuty: percentDraftFromApi(a.fieldDutyPercent),
    notWorking: notWorkingPercentToDraft(a.notWorkingPercent),
    finalScore: a.isRest === true ? '' : percentDraftFromApi(a.finalScore),
    notes: a.notes ?? '',
  }));

export const buildManagerPayload = (row: LapkinRow, drafts: ScoreDraft[]): LapkinRowActivityInput[] =>
  row.activities.map((a, i) => {
    const d = drafts[i];
    if (a.isRest) {
      return {
        taskDescription: a.taskDescription,
        resultDescription: a.resultDescription,
        isRest: true,
        notes: a.notes,
        performancePercent: null,
        fieldDutyPercent: null,
        notWorkingPercent: null,
        finalScore: null,
      };
    }
    const notesTrimmed = d.notes.trim();
    return {
      taskDescription: a.taskDescription,
      resultDescription: a.resultDescription,
      isRest: false,
      notes: notesTrimmed === '' ? null : notesTrimmed,
      performancePercent: percentFieldToPayload(d.performance),
      fieldDutyPercent: percentFieldToPayload(d.fieldDuty),
      notWorkingPercent: isNotWorkingDraftChecked(d.notWorking) ? 100 : 0,
      finalScore: percentFieldToPayload(d.finalScore),
    };
  });

/** At least one of: hasil kinerja, tugas dinas luar, or tidak masuk kerja (checked). */
export function workActivityDraftHasAtLeastOneOfThree(d: ScoreDraft): boolean {
  if (parsePercentInput(d.performance) != null) return true;
  if (parsePercentInput(d.fieldDuty) != null) return true;
  if (isNotWorkingDraftChecked(d.notWorking)) return true;
  return false;
}

export const rowScoresComplete = (row: LapkinRow, drafts: ScoreDraft[] | undefined): boolean => {
  if (!drafts || drafts.length !== row.activities.length) return false;
  return row.activities.every((a, i) => {
    if (a.isRest) return true;
    const d = drafts[i];
    return workActivityDraftHasAtLeastOneOfThree(d) && parsePercentInput(d.finalScore) != null;
  });
};

/** True when this work activity has a saved, valid nilai akhir (counts toward progress / sign-off). */
export function activityFinalScoreEntered(a: LapkinRowActivity): boolean {
  if (a.isRest === true) return false;
  if (a.finalScore == null) return false;
  if (String(a.finalScore).trim() === '') return false;
  return parsePercentInput(String(a.finalScore)) != null;
}

/** Saved row: at least one of the three evaluation inputs is present (same rule as drafts). */
export function activitySavedHasAtLeastOneOfThree(a: LapkinRowActivity): boolean {
  if (a.isRest === true) return false;
  if (parsePercentInput(String(a.performancePercent ?? '')) != null) return true;
  if (parsePercentInput(String(a.fieldDutyPercent ?? '')) != null) return true;
  if (isNotWorkingDraftChecked(notWorkingPercentToDraft(a.notWorkingPercent))) return true;
  return false;
}

/** Progress bar: nilai akhir alone is not enough — one of the three inputs must also be set. */
export function activityCountsTowardEvaluationProgress(a: LapkinRowActivity): boolean {
  return activityFinalScoreEntered(a) && activitySavedHasAtLeastOneOfThree(a);
}

export function lapkinRowAllWorkActivitiesHaveFinalScore(row: LapkinRow): boolean {
  const work = (row.activities ?? []).filter((a) => a.isRest !== true);
  if (work.length === 0) return false;
  return work.every(activityFinalScoreEntered);
}

export function lapkinAllWorkActivitiesHaveFinalScore(lapkin: Lapkin): boolean {
  const work = lapkin.rows.flatMap((r) => (r.activities ?? []).filter((a) => a.isRest !== true));
  if (work.length === 0) return true;
  return work.every(activityFinalScoreEntered);
}

export function lapkinWorkActivityCount(lapkin: Lapkin): number {
  return lapkin.rows.reduce(
    (acc, r) => acc + (r.activities ?? []).filter((a) => a.isRest !== true).length,
    0,
  );
}

export function lapkinFinalScoreFilledCount(lapkin: Lapkin): number {
  return lapkin.rows.reduce(
    (acc, r) => acc + (r.activities ?? []).filter((a) => activityCountsTowardEvaluationProgress(a)).length,
    0,
  );
}

export function rowHasWorkActivities(row: LapkinRow): boolean {
  return (row.activities ?? []).some((a) => a.isRest !== true);
}

/** Every row that has work activities has a complete score draft (ready to persist on sign). */
export function lapkinAllEvaluableRowsDraftsComplete(
  lapkin: Lapkin,
  scoreDraftsByRow: Record<string, ScoreDraft[]>,
): boolean {
  const rowsWithWork = lapkin.rows.filter(rowHasWorkActivities);
  if (rowsWithWork.length === 0) return true;
  return rowsWithWork.every((r) => rowScoresComplete(r, scoreDraftsByRow[r.id]));
}

/** Count work activities with a non-empty nilai akhir in local drafts (before DB save). */
export function lapkinFinalScoreFilledCountFromDrafts(
  lapkin: Lapkin,
  scoreDraftsByRow: Record<string, ScoreDraft[]>,
): number {
  let n = 0;
  for (const row of lapkin.rows) {
    const acts = row.activities ?? [];
    const drafts = scoreDraftsByRow[row.id];
    if (!drafts) continue;
    acts.forEach((a, i) => {
      if (a.isRest === true) return;
      const d = drafts[i];
      if (
        d != null
        && workActivityDraftHasAtLeastOneOfThree(d)
        && parsePercentInput(d.finalScore) != null
      ) {
        n += 1;
      }
    });
  }
  return n;
}
