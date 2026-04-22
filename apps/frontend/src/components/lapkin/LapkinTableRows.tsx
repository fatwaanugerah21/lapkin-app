import { clsx } from 'clsx';
import { Pencil, Trash2 } from 'lucide-react';
import { Lapkin, LapkinRow, LAPKIN_REST_ACTIVITY_LABEL } from '../../types';
import {
  ScoreDraft,
  NOT_WORKING_CHECKED,
  NOT_WORKING_UNCHECKED,
  draftsFromRow,
  formatPercentCellDisplay,
  isNotWorkingDraftChecked,
  sanitizePercentIntegerInput,
} from './lapkinTableScoreUtils';

const notWorkingCheckboxClass = clsx(
  'h-4 w-4 rounded border-gray-300 text-primary-600 shrink-0',
  'focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-0',
  'disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed',
);

const scoreInputClass = clsx(
  'input-number-no-spin w-full min-w-0 max-w-[4.25rem] mx-auto block text-center',
  'rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 tabular-nums shadow-sm',
  'transition-all duration-200 placeholder:text-gray-400',
  'hover:border-gray-300 hover:shadow',
  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md',
);

const ketTextareaClass = clsx(
  'w-full min-w-[12rem] max-w-full mx-auto block min-h-[2.75rem] resize-y',
  'rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 shadow-sm',
  'placeholder:text-gray-400',
  'hover:border-gray-300 hover:shadow',
  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md',
);

function printPercentOrDash(draft: string): string {
  return formatPercentCellDisplay(draft) || '-';
}

export interface LapkinTableRowsProps {
  lapkin: Lapkin;
  canEdit: boolean;
  canEvaluate: boolean;
  /** When false (draft), score / evaluation columns are omitted. */
  showEvaluationColumns: boolean;
  emptyColSpan: number;
  scoreDraftsByRow: Record<string, ScoreDraft[]>;
  patchScoreDraft: (rowId: string, activityIndex: number, partial: Partial<ScoreDraft>) => void;
  onEditRow?: (row: LapkinRow) => void;
  onDeleteRow?: (row: LapkinRow) => void;
  rowActionsDisabled?: boolean;
}

export function LapkinTableRows({
  lapkin,
  canEdit,
  canEvaluate,
  showEvaluationColumns,
  emptyColSpan,
  scoreDraftsByRow,
  patchScoreDraft,
  onEditRow,
  onDeleteRow,
  rowActionsDisabled = false,
}: LapkinTableRowsProps) {
  const hasRowActions = onEditRow != null && onDeleteRow != null;

  return (
    <tbody>
      {lapkin.rows.length === 0 && (
        <tr>
          <td colSpan={emptyColSpan} className="text-center py-10 text-gray-400">
            Belum ada baris. {canEdit && 'Klik "Tambah Baris" untuk mulai.'}
          </td>
        </tr>
      )}
      {lapkin.rows.map((row) => {
        const activities = row.activities ?? [];
        const rowCount = Math.max(activities.length, 1);

        if (activities.length === 0) {
          return (
            <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-middle">
              <td className="px-3 py-3 text-center font-medium text-gray-500 align-middle">{row.lineNumber}</td>
              <td className="px-3 py-3 text-center text-gray-700 whitespace-nowrap align-middle">
                {row.startTime} – {row.endTime}
              </td>
              {showEvaluationColumns ? (
                <>
                  <td className="px-3 py-3 text-gray-400 align-middle" colSpan={4}>
                    –
                  </td>
                  <td className="px-3 py-3 text-center align-middle">
                    <span className="text-gray-300">-</span>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-400 align-middle">–</td>
                  <td className="px-3 py-3 text-center text-gray-400 align-middle">–</td>
                </>
              ) : (
                <td className="px-3 py-3 text-gray-400 align-middle" colSpan={2}>
                  –
                </td>
              )}
              {hasRowActions && (
                <td className="print:hidden px-2 py-2 align-middle border-l border-gray-100">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEditRow(row)}
                      disabled={rowActionsDisabled}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary-600 disabled:opacity-50 disabled:pointer-events-none"
                      aria-label={`Ubah baris ${row.lineNumber}`}
                      title="Ubah baris"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRow(row)}
                      disabled={rowActionsDisabled}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:pointer-events-none"
                      aria-label={`Hapus baris ${row.lineNumber}`}
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          );
        }

        return activities.map((activity, index) => {
          const isRest = activity.isRest === true;
          const managerEditsScores = canEvaluate && !isRest && lapkin.isSignedByManager !== true;
          const rowDrafts = scoreDraftsByRow[row.id] ?? draftsFromRow(row);
          const activityDraft = rowDrafts[index];

          return (
            <tr
              key={`${row.id}-${index}`}
              className={`${index === 0 ? 'border-t border-gray-100' : ''} border-b border-gray-100 transition-colors align-middle ${isRest ? 'bg-slate-50/90 hover:bg-slate-100/90' : 'hover:bg-gray-50'}`}
            >
              {index === 0 && (
                <>
                  <td
                    rowSpan={rowCount}
                    className="px-3 py-3 text-center font-medium text-gray-500 align-middle border-r border-gray-100"
                  >
                    {row.lineNumber}
                  </td>
                  <td
                    rowSpan={rowCount}
                    className="px-3 py-3 text-center text-gray-700 whitespace-nowrap align-middle border-r border-gray-100"
                  >
                    {row.startTime} – {row.endTime}
                  </td>
                </>
              )}
              {isRest ? (
                <>
                  <td colSpan={2} className="px-3 py-3 text-center text-gray-800 max-w-xs align-middle">
                    <span className="font-medium text-slate-700 italic">{LAPKIN_REST_ACTIVITY_LABEL}</span>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-3 py-3 text-gray-800 max-w-xs align-middle">
                    {activity.taskDescription || '–'}
                  </td>
                  <td className="px-3 py-3 text-gray-800 max-w-xs align-middle">
                    {activity.resultDescription || '–'}
                  </td>
                </>
              )}
              {showEvaluationColumns && (
                <>
                  {isRest ? (
                    <td className="px-3 py-3 text-center text-gray-400 align-middle min-w-[5.5rem] w-24">–</td>
                  ) : managerEditsScores && activityDraft ? (
                    <td className="px-3 py-3 text-center text-gray-700 align-middle min-w-[5.5rem] w-24">
                      <span className="hidden print:inline tabular-nums">{printPercentOrDash(activityDraft.performance)}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={4}
                        className={clsx(scoreInputClass, 'print:hidden')}
                        value={activityDraft.performance}
                        onChange={(e) =>
                          patchScoreDraft(row.id, index, {
                            performance: sanitizePercentIntegerInput(e.target.value),
                          })
                        }
                      />
                    </td>
                  ) : (
                    <td className="px-3 py-3 text-center text-gray-700 align-middle min-w-[5.5rem] w-24">
                      {formatPercentCellDisplay(activity.performancePercent) || '–'}
                    </td>
                  )}
                  {isRest ? (
                    <td className="px-3 py-3 text-center text-gray-400 align-middle min-w-[5.5rem] w-24">–</td>
                  ) : managerEditsScores && activityDraft ? (
                    <td className="px-3 py-3 text-center text-gray-700 align-middle min-w-[5.5rem] w-24">
                      <span className="hidden print:inline tabular-nums">{printPercentOrDash(activityDraft.fieldDuty)}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={4}
                        className={clsx(scoreInputClass, 'print:hidden')}
                        value={activityDraft.fieldDuty}
                        onChange={(e) =>
                          patchScoreDraft(row.id, index, {
                            fieldDuty: sanitizePercentIntegerInput(e.target.value),
                          })
                        }
                      />
                    </td>
                  ) : (
                    <td className="px-3 py-3 text-center text-gray-700 align-middle min-w-[5.5rem] w-24">
                      {formatPercentCellDisplay(activity.fieldDutyPercent) || '–'}
                    </td>
                  )}
                  {isRest ? (
                    <td className="px-3 py-3 text-center text-gray-400 align-middle">–</td>
                  ) : managerEditsScores && activityDraft ? (
                    <td className="px-3 py-3 text-center text-gray-700 align-middle">
                      <div className="flex items-center justify-center">
                        <span className="hidden print:inline font-semibold text-primary-600">
                          {isNotWorkingDraftChecked(activityDraft.notWorking) ? '✓' : '–'}
                        </span>
                        <input
                          type="checkbox"
                          className={clsx(notWorkingCheckboxClass, 'print:hidden')}
                          checked={isNotWorkingDraftChecked(activityDraft.notWorking)}
                          onChange={(e) =>
                            patchScoreDraft(row.id, index, {
                              notWorking: e.target.checked ? NOT_WORKING_CHECKED : NOT_WORKING_UNCHECKED,
                            })
                          }
                          aria-label="Tidak masuk kerja atau secara nyata tidak melaksanakan tugas (centang jika berlaku)"
                        />
                      </div>
                    </td>
                  ) : (
                    <td className="px-3 py-3 text-center text-gray-700 align-middle">
                      {isNotWorkingDraftChecked(activity.notWorkingPercent ?? NOT_WORKING_UNCHECKED) ? (
                        <span className="text-primary-600 font-semibold" title="Berlaku">
                          ✓
                        </span>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3 text-center text-gray-700 border-l border-gray-100 align-middle min-w-[8.5rem] w-36">
                    {isRest ? (
                      <span className="text-gray-300">–</span>
                    ) : managerEditsScores && activityDraft ? (
                      <>
                        <span className="hidden print:inline font-semibold text-green-700 tabular-nums">
                          {printPercentOrDash(activityDraft.finalScore)}
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={4}
                          className={clsx(scoreInputClass, 'print:hidden')}
                          value={activityDraft.finalScore}
                          onChange={(e) =>
                            patchScoreDraft(row.id, index, {
                              finalScore: sanitizePercentIntegerInput(e.target.value),
                            })
                          }
                          aria-label="Nilai akhir (%)"
                        />
                      </>
                    ) : formatPercentCellDisplay(activity.finalScore) !== '' ? (
                      <span className="font-semibold text-green-700">
                        {formatPercentCellDisplay(activity.finalScore)}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 align-middle border-l border-gray-100 min-w-[15rem] max-w-[22rem] print:min-w-0 print:max-w-[12rem] print:w-[1%] print:px-2 print:py-2">
                    {isRest ? (
                      <span className="text-gray-300">–</span>
                    ) : managerEditsScores && activityDraft ? (
                      <>
                        <span className="hidden print:block text-left whitespace-pre-wrap text-xs text-gray-700">
                          {activityDraft.notes.trim() ? activityDraft.notes : '-'}
                        </span>
                        <textarea
                          className={clsx(ketTextareaClass, 'print:hidden')}
                          value={activityDraft.notes}
                          onChange={(e) => patchScoreDraft(row.id, index, { notes: e.target.value })}
                          placeholder="Keterangan (opsional)"
                          rows={2}
                          aria-label="Keterangan"
                        />
                      </>
                    ) : activity.notes?.trim() ? (
                      <div className="text-xs text-left whitespace-pre-wrap text-gray-700">{activity.notes}</div>
                    ) : (
                      <span className="text-gray-300">–</span>
                    )}
                  </td>
                </>
              )}
              {index === 0 && hasRowActions && (
                <td
                  rowSpan={rowCount}
                  className="print:hidden px-2 py-2 align-middle border-l border-gray-100 text-center"
                >
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEditRow(row)}
                      disabled={rowActionsDisabled}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary-600 disabled:opacity-50 disabled:pointer-events-none"
                      aria-label={`Ubah baris ${row.lineNumber}`}
                      title="Ubah baris"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRow(row)}
                      disabled={rowActionsDisabled}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:pointer-events-none"
                      aria-label={`Hapus baris ${row.lineNumber}`}
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          );
        });
      })}
    </tbody>
  );
}
