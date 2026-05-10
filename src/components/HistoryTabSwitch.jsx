import DailyEntryList from './DailyEntryList';
import AuditHistory from './AuditHistory';

function HistoryTabSwitch({
  historyView,
  onHistoryViewChange,
  // Billing records
  billingEntries,
  billingSearchValue,
  billingFilterDate,
  billingFilterType,
  onBillingSearchChange,
  onBillingFilterDateChange,
  onBillingFilterTypeChange,
  onBillingClearSearch,
  onBillingClearFilterDate,
  onBillingEdit,
  onBillingDelete,
  onBillingDownload,
  billingIsDownloading,
  billingSummary,
  // Audit records
  auditEntries,
  onAuditEdit,
  onAuditDelete,
  onAuditDownload,
  auditIsDownloading,
}) {
  return (
    <div className="space-y-4">
      {/* Toggle Buttons */}
      <div className="flex gap-2 rounded-xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => onHistoryViewChange('billing')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            historyView === 'billing'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          💰 Billing Records
        </button>
        <button
          type="button"
          onClick={() => onHistoryViewChange('audit')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            historyView === 'audit'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          📦 Audit Records
        </button>
      </div>

      {/* Content */}
      {historyView === 'billing' && (
        <DailyEntryList
          entries={billingEntries}
          searchValue={billingSearchValue}
          filterDate={billingFilterDate}
          filterType={billingFilterType}
          onSearchChange={onBillingSearchChange}
          onFilterDateChange={onBillingFilterDateChange}
          onFilterTypeChange={onBillingFilterTypeChange}
          onClearSearch={onBillingClearSearch}
          onClearFilterDate={onBillingClearFilterDate}
          onEdit={onBillingEdit}
          onDelete={onBillingDelete}
          onDownload={onBillingDownload}
          isDownloading={billingIsDownloading}
          summary={billingSummary}
          formatCurrency={(value) =>
            new Intl.NumberFormat('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value)
          }
        />
      )}

      {historyView === 'audit' && (
        <AuditHistory
          entries={auditEntries}
          onEdit={onAuditEdit}
          onDelete={onAuditDelete}
          onDownload={onAuditDownload}
          isDownloading={auditIsDownloading}
        />
      )}
    </div>
  );
}

export default HistoryTabSwitch;
