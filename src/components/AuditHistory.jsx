import { useMemo } from 'react';
import ClearableField from './ClearableField';
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

function formatItemCount(count) {
  return `${count} item${count === 1 ? '' : 's'}`;
}

function getAuditEmptyStateMessage({
  searchValue,
  filterFromDate,
  filterToDate,
  statusFilter,
}) {
  if (statusFilter === 'short') {
    return 'No short audit entries found for the selected filters.';
  }

  if (statusFilter === 'extra') {
    return 'No extra audit entries found for the selected filters.';
  }

  const filters = [];

  if (searchValue.trim()) {
    filters.push(`with "${searchValue.trim()}" product name`);
  }

  if (filterFromDate && filterToDate) {
    filters.push(`from ${formatDateForDisplay(filterFromDate)} to ${formatDateForDisplay(filterToDate)}`);
  } else if (filterFromDate) {
    filters.push(`from ${formatDateForDisplay(filterFromDate)}`);
  } else if (filterToDate) {
    filters.push(`up to ${formatDateForDisplay(filterToDate)}`);
  }

  if (filters.length === 0) {
    return 'No audit records found.';
  }

  return `No audit records found ${filters.join(' and ')}.`;
}

function getTabButtonClass(isActive, tone) {
  if (!isActive) {
    return 'border-stone-200 bg-white text-stone-700';
  }

  if (tone === 'short') {
    return 'border-red-200 bg-red-50 text-red-900';
  }

  if (tone === 'extra') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  }

  return 'border-sky-200 bg-sky-50 text-sky-950';
}

function AuditHistory({
  entries,
  visibleEntries,
  totalEntriesCount,
  searchValue,
  filterFromDate,
  filterToDate,
  statusFilter,
  onSearchChange,
  onFilterFromDateChange,
  onFilterToDateChange,
  onStatusFilterChange,
  onClearSearch,
  onClearFilterFromDate,
  onClearFilterToDate,
  onEdit,
  onDelete,
  onDownload,
  isDownloading,
}) {
  const summary = useMemo(() => {
    if (entries.length === 0) {
      return { totalShortage: 0, totalExtra: 0, shortCount: 0, extraCount: 0 };
    }

    return entries.reduce(
      (totals, entry) => {
        const differenceAmount = Math.abs(Number(entry.difference) || 0);

        if (entry.result === 'short') {
          return {
            ...totals,
            totalShortage: roundAuditValue(totals.totalShortage + differenceAmount),
            shortCount: totals.shortCount + 1,
          };
        }

        if (entry.result === 'extra') {
          return {
            ...totals,
            totalExtra: roundAuditValue(totals.totalExtra + differenceAmount),
            extraCount: totals.extraCount + 1,
          };
        }

        return totals;
      },
      { totalShortage: 0, totalExtra: 0, shortCount: 0, extraCount: 0 },
    );
  }, [entries]);

  const emptyStateMessage = getAuditEmptyStateMessage({
    searchValue,
    filterFromDate,
    filterToDate,
    statusFilter,
  });

  if (totalEntriesCount === 0) {
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
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <div className="mb-4 space-y-2">
        <h2 className="text-xl font-bold text-stone-900">Audit Records</h2>

        <div className="grid grid-cols-1 gap-2">
          <label className="block">
            <span className="field-label">Product Name</span>
            <ClearableField
              hasValue={Boolean(searchValue)}
              onClear={onClearSearch}
              clearLabel="Clear audit product search"
            >
              <input
                className="text-input clearable-input"
                type="text"
                placeholder="Search product name"
                value={searchValue}
                onChange={onSearchChange}
                autoComplete="off"
              />
            </ClearableField>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="field-label">From Date</span>
              <ClearableField
                hasValue={Boolean(filterFromDate)}
                onClear={onClearFilterFromDate}
                clearLabel="Clear audit from date"
                clearButtonClassName="right-12"
              >
                <input
                  className="text-input clearable-date-input"
                  type="date"
                  value={filterFromDate}
                  onChange={onFilterFromDateChange}
                />
              </ClearableField>
            </label>

            <label className="block">
              <span className="field-label">To Date</span>
              <ClearableField
                hasValue={Boolean(filterToDate)}
                onClear={onClearFilterToDate}
                clearLabel="Clear audit to date"
                clearButtonClassName="right-12"
              >
                <input
                  className="text-input clearable-date-input"
                  type="date"
                  value={filterToDate}
                  onChange={onFilterToDateChange}
                />
              </ClearableField>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading || visibleEntries.length === 0}
          className="report-download-button disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:text-emerald-50"
        >
          {isDownloading ? 'Generating...' : 'Download Audit Report'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="audit-summary-bar sticky top-0 z-20 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onStatusFilterChange('all')}
              className={`rounded-xl border px-3 py-2 text-left shadow-sm transition ${getTabButtonClass(statusFilter === 'all', 'all')}`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">All</div>
              <div className="mt-1 text-sm font-bold">{formatItemCount(entries.length)}</div>
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange(statusFilter === 'short' ? 'all' : 'short')}
              className={`rounded-xl border px-3 py-2 text-left shadow-sm transition ${getTabButtonClass(statusFilter === 'short', 'short')}`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">Short</div>
              <div className="mt-1 text-sm font-bold">{formatItemCount(summary.shortCount)}</div>
              <div className="mt-1 text-xs font-medium">{roundAuditValue(summary.totalShortage)}</div>
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange(statusFilter === 'extra' ? 'all' : 'extra')}
              className={`rounded-xl border px-3 py-2 text-left shadow-sm transition ${getTabButtonClass(statusFilter === 'extra', 'extra')}`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">Extra</div>
              <div className="mt-1 text-sm font-bold">{formatItemCount(summary.extraCount)}</div>
              <div className="mt-1 text-xs font-medium">{roundAuditValue(summary.totalExtra)}</div>
            </button>
          </div>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-base text-stone-600">
            {emptyStateMessage}
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleEntries.map((entry) => {
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
        )}
      </div>
    </section>
  );
}

export default AuditHistory;
