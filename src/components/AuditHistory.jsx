import { useMemo } from 'react';
import { formatDateForDisplay } from '../utils/auditExport';
import { roundAuditValue } from '../utils/auditCalculations';

function getStatusTone(isShort, isMatched) {
  if (isShort) {
    return 'text-red-700';
  }

  if (isMatched) {
    return 'text-green-700';
  }

  return 'text-emerald-700';
}

function getStatusLabel(isShort, isMatched) {
  if (isShort) {
    return 'Short';
  }

  if (isMatched) {
    return 'Matched';
  }

  return 'Extra';
}

function AuditHistory({
  entries,
  onEdit,
  onDelete,
  onDownload,
  isDownloading,
}) {
  const summary = useMemo(() => {
    if (entries.length === 0) {
      return { totalShortage: 0, totalExtra: 0 };
    }

    return entries.reduce(
      (totals, entry) => {
        const differenceAmount = Math.abs(Number(entry.difference) || 0);

        if (entry.result === 'short') {
          return {
            ...totals,
            totalShortage: roundAuditValue(totals.totalShortage + differenceAmount),
          };
        }

        if (entry.result === 'extra') {
          return {
            ...totals,
            totalExtra: roundAuditValue(totals.totalExtra + differenceAmount),
          };
        }

        return totals;
      },
      { totalShortage: 0, totalExtra: 0 },
    );
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <div className="text-2xl">Stock</div>
          <div className="mt-2 text-sm font-semibold text-stone-600">No audit records yet</div>
          <div className="mt-1 text-xs text-stone-500">Start by creating an audit entry</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onDownload}
        disabled={isDownloading}
        className="report-download-button"
      >
        {isDownloading ? 'Generating...' : 'Download Audit Report'}
      </button>

      <div className="audit-summary-bar sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-red-600">Short</span>
            <span className="ml-2 text-base font-bold text-red-900">{roundAuditValue(summary.totalShortage)}</span>
          </div>
          <div className="h-5 w-px bg-stone-200" aria-hidden="true" />
          <div className="min-w-0 text-right">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">Extra</span>
            <span className="ml-2 text-base font-bold text-emerald-900">{roundAuditValue(summary.totalExtra)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {entries.map((entry) => {
          const isShort = entry.result === 'short';
          const isMatched = entry.result === 'matched';
          const statusTone = getStatusTone(isShort, isMatched);
          const differenceAmount = Math.abs(Number(entry.difference) || 0);

          return (
            <div
              key={entry.id}
              className={`audit-entry-card ${
                isShort
                  ? 'border-l-red-500 bg-red-50'
                  : isMatched
                    ? 'border-l-green-500 bg-green-50'
                    : 'border-l-emerald-500 bg-emerald-50'
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-stone-900">{entry.productName}</div>
                  <div className="text-xs text-stone-600">{formatDateForDisplay(entry.date)}</div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-bold ${statusTone}`}>
                    {getStatusLabel(isShort, isMatched)}
                  </div>
                  <div className={`mt-1 text-base font-bold ${statusTone}`}>
                    {differenceAmount}
                  </div>
                </div>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-white/55 p-2">
                  <div className="text-xs font-semibold text-stone-600">Closing Stock</div>
                  <div className="mt-1 font-bold text-stone-900">{entry.systemStock}</div>
                </div>
                <div className="rounded-lg bg-white/55 p-2">
                  <div className="text-xs font-semibold text-stone-600">Slip Stock</div>
                  <div className="mt-1 font-bold text-stone-900">{entry.actualCount}</div>
                </div>
              </div>

              <div className="mb-2 grid grid-cols-3 gap-2 text-[11px] leading-4 text-stone-700">
                <div>Opening: {entry.opening}</div>
                <div>Purchase: {entry.purchase}</div>
                <div>Issued: {entry.used}</div>
              </div>

              <div className="audit-actions-row">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="audit-action-button audit-edit-button"
                  title="Edit"
                >
                  Edit Entry
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry)}
                  className="audit-action-button audit-delete-button"
                  title="Delete"
                >
                  Delete Entry
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AuditHistory;
