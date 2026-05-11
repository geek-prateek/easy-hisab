import { useMemo } from 'react';
import { ENTRY_TYPE_OPTIONS } from '../constants';
import ClearableField from './ClearableField';

const typeLabels = Object.fromEntries(
  ENTRY_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const emptyStateDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatEmptyStateDate(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  return emptyStateDateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

function getEmptyStateMessage({ searchValue, filterDate, filterType }) {
  const filters = [];
  const baseLabel = filterType === 'purchase'
    ? 'purchase'
    : filterType === 'dispatch'
      ? 'dispatch'
      : 'billing';

  if (searchValue.trim()) {
    filters.push(`with "${searchValue.trim()}" product name`);
  }

  if (filterDate.from && filterDate.to) {
    filters.push(`from ${formatEmptyStateDate(filterDate.from)} to ${formatEmptyStateDate(filterDate.to)}`);
  } else if (filterDate.from) {
    filters.push(`from ${formatEmptyStateDate(filterDate.from)}`);
  } else if (filterDate.to) {
    filters.push(`up to ${formatEmptyStateDate(filterDate.to)}`);
  }

  if (filters.length === 0) {
    return `No ${baseLabel} records found.`;
  }

  return `No ${baseLabel} records found ${filters.join(' and ')}.`;
}

function getTypeTabButtonClass(isActive, tone) {
  if (!isActive) {
    return 'border-stone-200 bg-white text-stone-700';
  }

  if (tone === 'purchase') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  }

  if (tone === 'dispatch') {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }

  return 'border-sky-200 bg-sky-50 text-sky-950';
}

function formatItemCount(count) {
  return `${count} item${count === 1 ? '' : 's'}`;
}

function DailyEntryList({
  entries,
  visibleEntries,
  totalEntriesCount,
  searchValue,
  filterFromDate,
  filterToDate,
  typeFilter,
  onSearchChange,
  onFilterFromDateChange,
  onFilterToDateChange,
  onTypeFilterChange,
  onEdit,
  onDelete,
  onDownload,
  isDownloading,
  onClearSearch,
  onClearFilterFromDate,
  onClearFilterToDate,
  formatCurrency,
}) {
  const summary = useMemo(() => (
    entries.reduce(
      (totals, entry) => {
        const amount = Number(entry.finalAmount || 0);

        if (entry.type === 'purchase') {
          return {
            ...totals,
            purchaseCount: totals.purchaseCount + 1,
            purchaseTotal: Number((totals.purchaseTotal + amount).toFixed(2)),
            grandTotal: Number((totals.grandTotal + amount).toFixed(2)),
          };
        }

        if (entry.type === 'dispatch') {
          return {
            ...totals,
            dispatchCount: totals.dispatchCount + 1,
            dispatchTotal: Number((totals.dispatchTotal + amount).toFixed(2)),
            grandTotal: Number((totals.grandTotal + amount).toFixed(2)),
          };
        }

        return {
          ...totals,
          grandTotal: Number((totals.grandTotal + amount).toFixed(2)),
        };
      },
      {
        purchaseCount: 0,
        dispatchCount: 0,
        purchaseTotal: 0,
        dispatchTotal: 0,
        grandTotal: 0,
      },
    )
  ), [entries]);

  const emptyStateMessage = getEmptyStateMessage({
    searchValue,
    filterDate: {
      from: filterFromDate,
      to: filterToDate,
    },
    filterType: typeFilter,
  });

  if (totalEntriesCount === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <div className="text-2xl">Billing</div>
          <div className="mt-2 text-sm font-semibold text-stone-600">No billing records yet</div>
          <div className="mt-1 text-xs text-stone-500">Start by creating a billing entry</div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <div className="mb-4 space-y-2">
        <h2 className="text-xl font-bold text-stone-900">Billing Records</h2>

        <div className="grid grid-cols-1 gap-2">
          <label className="block">
            <span className="field-label">Product Name</span>
            <ClearableField
              hasValue={Boolean(searchValue)}
              onClear={onClearSearch}
              clearLabel="Clear product search"
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
                clearLabel="Clear billing from date"
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
                clearLabel="Clear billing to date"
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
          className="report-download-button disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:text-emerald-50"
          type="button"
          onClick={onDownload}
          disabled={isDownloading || visibleEntries.length === 0}
        >
          {isDownloading ? 'Preparing Excel Report...' : 'Download Excel Report'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="sticky top-0 z-20 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onTypeFilterChange('all')}
              className={`rounded-xl border px-3 py-2 text-left shadow-sm transition ${getTypeTabButtonClass(typeFilter === 'all', 'all')}`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">All</div>
              <div className="mt-1 text-sm font-bold">{formatItemCount(entries.length)}</div>
              <div className="mt-1 text-xs font-medium">Rs. {formatCurrency(summary.grandTotal)}</div>
            </button>

            <button
              type="button"
              onClick={() => onTypeFilterChange(typeFilter === 'purchase' ? 'all' : 'purchase')}
              className={`rounded-xl border px-3 py-2 text-left shadow-sm transition ${getTypeTabButtonClass(typeFilter === 'purchase', 'purchase')}`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">Purchase</div>
              <div className="mt-1 text-sm font-bold">{formatItemCount(summary.purchaseCount)}</div>
              <div className="mt-1 text-xs font-medium">Rs. {formatCurrency(summary.purchaseTotal)}</div>
            </button>

            <button
              type="button"
              onClick={() => onTypeFilterChange(typeFilter === 'dispatch' ? 'all' : 'dispatch')}
              className={`rounded-xl border px-3 py-2 text-left shadow-sm transition ${getTypeTabButtonClass(typeFilter === 'dispatch', 'dispatch')}`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">Dispatch</div>
              <div className="mt-1 text-sm font-bold">{formatItemCount(summary.dispatchCount)}</div>
              <div className="mt-1 text-xs font-medium">Rs. {formatCurrency(summary.dispatchTotal)}</div>
            </button>
          </div>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-base text-stone-600">
            {emptyStateMessage}
          </div>
        ) : (
          visibleEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-stone-900">{entry.productName}</h3>
                  <p className="mt-1 text-sm font-medium text-stone-600">
                    {typeLabels[entry.type]}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">{entry.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-600">Final Amount</p>
                  <p className="text-xl font-bold text-emerald-700">
                    Rs. {Number(entry.finalAmount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-base text-stone-800">
                <div className="rounded-lg bg-white px-3 py-3">
                  <p className="text-sm text-stone-500">Quantity</p>
                  <p className="mt-1 font-semibold">{entry.quantity}</p>
                </div>
                <div className="rounded-lg bg-white px-3 py-3">
                  <p className="text-sm text-stone-500">Price per Unit</p>
                  <p className="mt-1 font-semibold">Rs. {Number(entry.price).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  className="icon-action bg-amber-100 text-amber-900"
                  type="button"
                  onClick={() => onEdit(entry)}
                >
                  Edit
                </button>
                <button
                  className="icon-action bg-rose-100 text-rose-900"
                  type="button"
                  onClick={() => onDelete(entry)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default DailyEntryList;
