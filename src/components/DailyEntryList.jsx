import { ENTRY_TYPE_OPTIONS } from '../constants';
import ClearableField from './ClearableField';

const typeLabels = Object.fromEntries(
  ENTRY_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const shortTypeLabels = {
  purchase: 'Purchase',
  dispatch: 'Dispatch',
};

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

  if (filterDate) {
    filters.push(`on ${formatEmptyStateDate(filterDate)}`);
  }

  if (filterType) {
    filters.push(`with ${shortTypeLabels[filterType] || typeLabels[filterType] || filterType}`);
  }

  if (searchValue.trim()) {
    filters.push(`with "${searchValue.trim()}" product name`);
  }

  if (filters.length === 0) {
    return 'No products found.';
  }

  return `No products found ${filters.join(' and ')}.`;
}

function DailyEntryList({
  entries,
  searchValue,
  filterDate,
  filterType,
  onSearchChange,
  onFilterDateChange,
  onFilterTypeChange,
  onEdit,
  onDelete,
  onDownload,
  isDownloading,
  onClearSearch,
  onClearFilterDate,
  summary,
  formatCurrency,
}) {
  const itemLabel = summary.itemCount === 1 ? 'Item' : 'Items';
  const emptyStateMessage = getEmptyStateMessage({
    searchValue,
    filterDate,
    filterType,
  });

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <div className="mb-4 space-y-2">
        <h2 className="text-xl font-bold text-stone-900">View Products</h2>

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

          <label className="block">
            <span className="field-label">Date</span>
            <ClearableField
              hasValue={Boolean(filterDate)}
              onClear={onClearFilterDate}
              clearLabel="Clear date filter"
              clearButtonClassName="right-12"
            >
              <input
                className="text-input clearable-date-input"
                type="date"
                value={filterDate}
                onChange={onFilterDateChange}
              />
            </ClearableField>
          </label>

          <label className="block">
            <span className="field-label">Purchase / Dispatch</span>
            <select
              className="select-input"
              value={filterType}
              onChange={onFilterTypeChange}
            >
              <option value="">All</option>
              {ENTRY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="report-download-button disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:text-emerald-50"
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
        >
          {isDownloading ? 'Preparing Excel Report...' : 'Download Excel Report'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="sticky top-0 z-20 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm font-semibold text-sky-900">
              Grand Total ({summary.itemCount} {itemLabel})
            </p>
            <p className="text-2xl font-extrabold leading-none text-sky-950 sm:text-3xl">
              Rs. {formatCurrency(summary.grandTotal)}
            </p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-base text-stone-600">
            {emptyStateMessage}
          </div>
        ) : (
          entries.map((entry) => (
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
