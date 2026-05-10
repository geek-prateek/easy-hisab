import { useMemo } from 'react';
import { formatDateForDisplay } from '../utils/auditExport';

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
      return { totalClosingBalance: 0, totalSlipAmount: 0 };
    }

    return {
      totalClosingBalance: entries.reduce((sum, entry) => sum + (entry.systemStock || 0), 0),
      totalSlipAmount: entries.reduce((sum, entry) => sum + (entry.actualCount || 0), 0),
    };
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
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 -mt-4 bg-gradient-to-b from-white to-white/95 px-4 py-4 shadow-sm sm:px-5">
        <div className="space-y-3">
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="report-download-button"
          >
            {isDownloading ? 'Generating...' : 'Download Audit Report'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-sky-50 p-3">
              <div className="text-xs font-semibold text-sky-600">Total Closing Balance</div>
              <div className="mt-1 text-xl font-bold text-sky-900">{summary.totalClosingBalance}</div>
            </div>
            <div className="rounded-lg bg-sky-50 p-3">
              <div className="text-xs font-semibold text-sky-600">Total Slip Amount</div>
              <div className="mt-1 text-xl font-bold text-sky-900">{summary.totalSlipAmount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const isShort = entry.result === 'short';
          const isMatched = entry.result === 'matched';
          const statusTone = getStatusTone(isShort, isMatched);
          const differenceAmount = Math.abs(Number(entry.difference) || 0);

          return (
            <div
              key={entry.id}
              className={`rounded-xl border-l-4 p-4 transition ${
                isShort
                  ? 'border-l-red-500 bg-red-50'
                  : isMatched
                    ? 'border-l-green-500 bg-green-50'
                    : 'border-l-emerald-500 bg-emerald-50'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
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

              <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded bg-white/50 p-2">
                  <div className="text-xs font-semibold text-stone-600">Closing Balance</div>
                  <div className="mt-1 font-bold text-stone-900">{entry.systemStock}</div>
                </div>
                <div className="rounded bg-white/50 p-2">
                  <div className="text-xs font-semibold text-stone-600">Slip Amount</div>
                  <div className="mt-1 font-bold text-stone-900">{entry.actualCount}</div>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 text-xs text-stone-700">
                <div>Opening: {entry.opening}</div>
                <div>Purchase: {entry.purchase}</div>
                <div>Used: {entry.used}</div>
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
