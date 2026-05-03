import { ENTRY_TYPE_OPTIONS } from '../constants';

const typeLabels = Object.fromEntries(
  ENTRY_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

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
}) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <div className="mb-4 space-y-3">
        <h2 className="text-xl font-bold text-stone-900">View Products</h2>

        <div className="grid grid-cols-1 gap-3">
          <label className="block">
            <span className="field-label">Product Name</span>
            <input
              className="text-input"
              type="text"
              placeholder="Search product name"
              value={searchValue}
              onChange={onSearchChange}
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="field-label">Date</span>
            <input
              className="text-input"
              type="date"
              value={filterDate}
              onChange={onFilterDateChange}
            />
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

        <button className="secondary-button w-full" type="button" onClick={onDownload}>
          Download Excel Report
        </button>
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-base text-stone-600">
            No products found.
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
