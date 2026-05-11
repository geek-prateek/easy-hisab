import DailyEntryList from './DailyEntryList';
import AuditHistory from './AuditHistory';

function HistoryTabSwitch({
  historyView,
  onHistoryViewChange,
  // Billing records
  billingEntries,
  billingVisibleEntries,
  billingTotalEntriesCount,
  billingSearchValue,
  billingFilterFromDate,
  billingFilterToDate,
  billingTypeFilter,
  onBillingSearchChange,
  onBillingFilterFromDateChange,
  onBillingFilterToDateChange,
  onBillingTypeFilterChange,
  onBillingClearSearch,
  onBillingClearFilterFromDate,
  onBillingClearFilterToDate,
  onBillingEdit,
  onBillingDelete,
  onBillingDownload,
  billingIsDownloading,
  // Audit records
  auditEntries,
  auditVisibleEntries,
  auditTotalEntriesCount,
  auditSearchValue,
  auditFilterFromDate,
  auditFilterToDate,
  auditStatusFilter,
  onAuditSearchChange,
  onAuditFilterFromDateChange,
  onAuditFilterToDateChange,
  onAuditStatusFilterChange,
  onAuditClearSearch,
  onAuditClearFilterFromDate,
  onAuditClearFilterToDate,
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
          visibleEntries={billingVisibleEntries}
          totalEntriesCount={billingTotalEntriesCount}
          searchValue={billingSearchValue}
          filterFromDate={billingFilterFromDate}
          filterToDate={billingFilterToDate}
          typeFilter={billingTypeFilter}
          onSearchChange={onBillingSearchChange}
          onFilterFromDateChange={onBillingFilterFromDateChange}
          onFilterToDateChange={onBillingFilterToDateChange}
          onTypeFilterChange={onBillingTypeFilterChange}
          onClearSearch={onBillingClearSearch}
          onClearFilterFromDate={onBillingClearFilterFromDate}
          onClearFilterToDate={onBillingClearFilterToDate}
          onEdit={onBillingEdit}
          onDelete={onBillingDelete}
          onDownload={onBillingDownload}
          isDownloading={billingIsDownloading}
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
          visibleEntries={auditVisibleEntries}
          totalEntriesCount={auditTotalEntriesCount}
          searchValue={auditSearchValue}
          filterFromDate={auditFilterFromDate}
          filterToDate={auditFilterToDate}
          statusFilter={auditStatusFilter}
          onSearchChange={onAuditSearchChange}
          onFilterFromDateChange={onAuditFilterFromDateChange}
          onFilterToDateChange={onAuditFilterToDateChange}
          onStatusFilterChange={onAuditStatusFilterChange}
          onClearSearch={onAuditClearSearch}
          onClearFilterFromDate={onAuditClearFilterFromDate}
          onClearFilterToDate={onAuditClearFilterToDate}
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
