import { useEffect, useMemo, useRef, useState } from 'react';
import writeXlsxFile from 'write-excel-file/browser';
import DailyEntryForm from './components/DailyEntryForm';
import DailyEntryList from './components/DailyEntryList';
import StockAuditForm from './components/StockAuditForm';
import HistoryTabSwitch from './components/HistoryTabSwitch';
import { ENTRY_TYPE_OPTIONS } from './constants';
import { loadDailyEntries, saveDailyEntries, loadAuditEntries, saveAuditEntries } from './utils/storage';
import {
  calculateSystemStock,
  calculateDifference,
  determineDifferenceResult,
  validateAuditForm,
} from './utils/auditCalculations';
import { exportAuditToExcel, getReportDateRangeLabel } from './utils/auditExport';

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createEmptyDailyForm() {
  return {
    date: getTodayDate(),
    productName: '',
    type: 'purchase',
    quantity: '',
    price: '',
    gst: '5',
  };
}

function createEmptyAuditForm() {
  return {
    date: getTodayDate(),
    productName: '',
    opening: '',
    purchase: '',
    used: '',
    actualCount: '',
  };
}

const AUDIT_NUMBER_FIELDS = new Set(['opening', 'purchase', 'used', 'actualCount']);

function sanitizeAuditNumberInput(value) {
  const normalizedValue = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const decimalParts = normalizedValue.split('.');

  if (decimalParts.length === 1) {
    return normalizedValue;
  }

  return `${decimalParts[0]}.${decimalParts.slice(1).join('')}`;
}

const typeLabels = Object.fromEntries(
  ENTRY_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const fieldChecks = [
  ['date', 'Date'],
  ['productName', 'Product Name'],
  ['type', 'Type'],
  ['quantity', 'Quantity'],
  ['price', 'Price per Unit'],
  ['gst', 'GST'],
];

function createExcelDate(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isAppHistoryState(state) {
  return Boolean(state && state.__easyHisab === true);
}

function createDefaultAppState() {
  return {
    activeTab: 'audit',
    historyView: 'billing',
    dailyForm: createEmptyDailyForm(),
    auditForm: createEmptyAuditForm(),
    editingEntryId: null,
    auditEditingId: null,
    entrySearchValue: '',
    entryFilterFromDate: '',
    entryFilterToDate: '',
    entryTypeFilter: 'all',
    auditSearchValue: '',
    auditFilterFromDate: '',
    auditFilterToDate: '',
    auditStatusFilter: 'all',
  };
}

function App() {
  const isApplyingHistoryRef = useRef(false);
  const editReturnRef = useRef(null);
  const [activeTab, setActiveTab] = useState('audit');
  const [historyView, setHistoryView] = useState('billing');
  
  // Billing entries and form
  const [dailyEntries, setDailyEntries] = useState(() => loadDailyEntries());
  const [dailyForm, setDailyForm] = useState(() => createEmptyDailyForm());
  const [entrySearchValue, setEntrySearchValue] = useState('');
  const [entryFilterFromDate, setEntryFilterFromDate] = useState('');
  const [entryFilterToDate, setEntryFilterToDate] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState('all');
  const [editingEntryId, setEditingEntryId] = useState(null);
  
  // Audit entries and form
  const [auditEntries, setAuditEntries] = useState(() => loadAuditEntries());
  const [auditForm, setAuditForm] = useState(() => createEmptyAuditForm());
  const [auditEditingId, setAuditEditingId] = useState(null);
  const [auditSearchValue, setAuditSearchValue] = useState('');
  const [auditFilterFromDate, setAuditFilterFromDate] = useState('');
  const [auditFilterToDate, setAuditFilterToDate] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState('all');
  
  // Common state
  const [notice, setNotice] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    saveDailyEntries(dailyEntries);
  }, [dailyEntries]);

  useEffect(() => {
    saveAuditEntries(auditEntries);
  }, [auditEntries]);

  useEffect(() => {
    if (!notice?.text) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [notice]);

  function createAppHistorySnapshot(overrides = {}) {
    return {
      __easyHisab: true,
      ...createDefaultAppState(),
      activeTab,
      historyView,
      dailyForm,
      auditForm,
      editingEntryId,
      auditEditingId,
      entrySearchValue,
      entryFilterFromDate,
      entryFilterToDate,
      entryTypeFilter,
      auditSearchValue,
      auditFilterFromDate,
      auditFilterToDate,
      auditStatusFilter,
      ...overrides,
    };
  }

  function applyAppHistorySnapshot(snapshot) {
    const fallbackState = createDefaultAppState();

    setActiveTab(snapshot.activeTab ?? fallbackState.activeTab);
    setHistoryView(snapshot.historyView ?? fallbackState.historyView);
    setDailyForm(snapshot.dailyForm ?? createEmptyDailyForm());
    setAuditForm(snapshot.auditForm ?? createEmptyAuditForm());
    setEditingEntryId(snapshot.editingEntryId ?? fallbackState.editingEntryId);
    setAuditEditingId(snapshot.auditEditingId ?? fallbackState.auditEditingId);
    setEntrySearchValue(snapshot.entrySearchValue ?? fallbackState.entrySearchValue);
    setEntryFilterFromDate(
      snapshot.entryFilterFromDate
      ?? snapshot.entryFilterDate
      ?? fallbackState.entryFilterFromDate,
    );
    setEntryFilterToDate(
      snapshot.entryFilterToDate
      ?? snapshot.entryFilterDate
      ?? fallbackState.entryFilterToDate,
    );
    setEntryTypeFilter(
      (
        snapshot.entryTypeFilter
        ?? snapshot.entryFilterType
        ?? fallbackState.entryTypeFilter
      ) || fallbackState.entryTypeFilter,
    );
    setAuditSearchValue(snapshot.auditSearchValue ?? fallbackState.auditSearchValue);
    setAuditFilterFromDate(snapshot.auditFilterFromDate ?? fallbackState.auditFilterFromDate);
    setAuditFilterToDate(snapshot.auditFilterToDate ?? fallbackState.auditFilterToDate);
    setAuditStatusFilter(snapshot.auditStatusFilter ?? fallbackState.auditStatusFilter);
    setNotice(null);
  }

  function commitAppNavigation(snapshot, options = {}) {
    const { replace = false, shouldScroll = true } = options;

    applyAppHistorySnapshot(snapshot);

    if (!isApplyingHistoryRef.current) {
      if (replace) {
        window.history.replaceState(snapshot, '');
      } else {
        window.history.pushState(snapshot, '');
      }
    }

    if (shouldScroll) {
      scrollToTop();
    }
  }

  useEffect(() => {
    const initialSnapshot = isAppHistoryState(window.history.state)
      ? window.history.state
      : createAppHistorySnapshot();

    commitAppNavigation(initialSnapshot, { replace: true, shouldScroll: false });

    function handlePopState(event) {
      if (!isAppHistoryState(event.state)) {
        return;
      }

      isApplyingHistoryRef.current = true;
      applyAppHistorySnapshot(event.state);
      scrollToTop();
      window.setTimeout(() => {
        isApplyingHistoryRef.current = false;
      }, 0);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const filteredDailyEntries = useMemo(() => {
    const searchText = entrySearchValue.trim().toLowerCase();

    return dailyEntries
      .filter((entry) => {
        const matchesSearch = !searchText
          || entry.productName.toLowerCase().includes(searchText);
        const matchesFromDate = !entryFilterFromDate || entry.date >= entryFilterFromDate;
        const matchesToDate = !entryFilterToDate || entry.date <= entryFilterToDate;

        return matchesSearch && matchesFromDate && matchesToDate;
      })
      .sort((left, right) => {
        if (left.date !== right.date) {
          return right.date.localeCompare(left.date);
        }

        return (right.savedAt || '').localeCompare(left.savedAt || '');
      });
  }, [dailyEntries, entryFilterFromDate, entryFilterToDate, entrySearchValue]);

  const visibleBillingEntries = useMemo(() => {
    if (entryTypeFilter === 'all') {
      return filteredDailyEntries;
    }

    return filteredDailyEntries.filter((entry) => entry.type === entryTypeFilter);
  }, [entryTypeFilter, filteredDailyEntries]);

  const visibleBillingSummary = useMemo(() => (
    visibleBillingEntries.reduce(
      (summary, entry) => ({
        itemCount: summary.itemCount + 1,
        grandTotal: Number((summary.grandTotal + Number(entry.finalAmount || 0)).toFixed(2)),
      }),
      { itemCount: 0, grandTotal: 0 },
    )
  ), [visibleBillingEntries]);

  const filteredAuditEntries = useMemo(() => {
    const searchText = auditSearchValue.trim().toLowerCase();

    return auditEntries
      .filter((entry) => {
        const matchesSearch = !searchText
          || entry.productName.toLowerCase().includes(searchText);
        const matchesFromDate = !auditFilterFromDate || entry.date >= auditFilterFromDate;
        const matchesToDate = !auditFilterToDate || entry.date <= auditFilterToDate;

        return matchesSearch && matchesFromDate && matchesToDate;
      })
      .sort((left, right) => {
        if (left.date !== right.date) {
          return right.date.localeCompare(left.date);
        }

        return (right.savedAt || '').localeCompare(left.savedAt || '');
      });
  }, [auditEntries, auditFilterFromDate, auditFilterToDate, auditSearchValue]);

  const visibleAuditEntries = useMemo(() => {
    if (auditStatusFilter === 'all') {
      return filteredAuditEntries;
    }

    return filteredAuditEntries.filter((entry) => entry.result === auditStatusFilter);
  }, [auditStatusFilter, filteredAuditEntries]);

  function resetDailyForm() {
    setDailyForm(createEmptyDailyForm());
    setEditingEntryId(null);
  }

  function resetAuditForm() {
    setAuditForm(createEmptyAuditForm());
    setAuditEditingId(null);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function rememberEditReturn(snapshot) {
    editReturnRef.current = {
      snapshot,
      scrollY: window.scrollY,
    };
  }

  function returnToEditOrigin(fallbackSnapshot) {
    const returnState = editReturnRef.current;
    editReturnRef.current = null;

    const targetSnapshot = returnState?.snapshot ?? fallbackSnapshot;

    commitAppNavigation(targetSnapshot, { shouldScroll: false });

    if (typeof returnState?.scrollY === 'number') {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: returnState.scrollY,
          behavior: 'auto',
        });
      });
    }
  }

  function openBillingTab() {
    commitAppNavigation(createAppHistorySnapshot({
      activeTab: 'billing',
      dailyForm: createEmptyDailyForm(),
      editingEntryId: null,
    }));
  }

  function openAuditTab() {
    commitAppNavigation(createAppHistorySnapshot({
      activeTab: 'audit',
      auditForm: createEmptyAuditForm(),
      auditEditingId: null,
    }));
  }

  function openHistoryTab() {
    commitAppNavigation(createAppHistorySnapshot({
      activeTab: 'history',
    }));
  }

  function handleHistoryViewChange(nextHistoryView) {
    commitAppNavigation(createAppHistorySnapshot({
      activeTab: 'history',
      historyView: nextHistoryView,
    }), { shouldScroll: false });
  }

  function handleDailyChange(event) {
    const { name, value } = event.target;
    setDailyForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleDailyFieldClear(fieldName) {
    setDailyForm((currentForm) => ({
      ...currentForm,
      [fieldName]: '',
    }));
  }

  function validateDailyForm() {
    for (const [fieldName, label] of fieldChecks) {
      const value = dailyForm[fieldName];

      if (String(value ?? '').trim() === '') {
        setNotice({
          tone: 'error',
          text: `${label} is not added properly.`,
        });
        return false;
      }
    }

    return true;
  }

  function handleDailySubmit(event) {
    event.preventDefault();

    if (!validateDailyForm()) {
      return;
    }

    const cleanProductName = dailyForm.productName.trim();
    const quantity = Number(dailyForm.quantity);
    const price = Number(dailyForm.price);
    const gst = Number(dailyForm.gst);
    const totalAmount = Number((quantity * price).toFixed(2));
    const gstAmount = Number((totalAmount * (gst / 100)).toFixed(2));
    const finalAmount = Number((totalAmount + gstAmount).toFixed(2));

    const entryData = {
      id: editingEntryId ?? crypto.randomUUID(),
      date: dailyForm.date,
      productName: cleanProductName,
      type: dailyForm.type,
      quantity,
      price,
      gst,
      totalAmount,
      gstAmount,
      finalAmount,
      savedAt: new Date().toISOString(),
    };

    setDailyEntries((currentEntries) => {
      if (editingEntryId) {
        return currentEntries.map((entry) =>
          entry.id === editingEntryId ? entryData : entry,
        );
      }

      return [entryData, ...currentEntries];
    });

    const wasEditing = editingEntryId !== null;

    if (wasEditing) {
      resetDailyForm();
      returnToEditOrigin(createAppHistorySnapshot({
        activeTab: 'history',
        historyView: 'billing',
        dailyForm: createEmptyDailyForm(),
        editingEntryId: null,
      }));
      setNotice({
        tone: 'success',
        text: 'Billing entry updated successfully.',
      });
      return;
    }

    resetDailyForm();
    setNotice({
      tone: 'success',
      text: 'Entry Saved Successfully!',
    });
  }

  function handleEntryEdit(entry) {
    rememberEditReturn(createAppHistorySnapshot());

    commitAppNavigation(createAppHistorySnapshot({
      activeTab: 'billing',
      dailyForm: {
        date: entry.date,
        productName: entry.productName,
        type: entry.type,
        quantity: String(entry.quantity),
        price: String(entry.price),
        gst: String(entry.gst),
      },
      editingEntryId: entry.id,
    }));
  }

  function handleEntryDelete(entry) {
    const confirmed = window.confirm(`Delete "${entry.productName}"?`);

    if (!confirmed) {
      return;
    }

    setDailyEntries((currentEntries) =>
      currentEntries.filter((item) => item.id !== entry.id),
    );

    if (editingEntryId === entry.id) {
      resetDailyForm();
    }
  }

  // Audit form handlers
  function handleAuditChange(event) {
    const { name, value } = event.target;

    const nextValue = AUDIT_NUMBER_FIELDS.has(name)
      ? sanitizeAuditNumberInput(value)
      : value;

    setAuditForm((currentForm) => ({
      ...currentForm,
      [name]: nextValue,
    }));
  }

  function handleAuditFieldClear(fieldName) {
    setAuditForm((currentForm) => ({
      ...currentForm,
      [fieldName]: '',
    }));
  }

  function handleAuditSubmit(event) {
    event.preventDefault();

    const validation = validateAuditForm(auditForm);
    if (!validation.isValid) {
      setNotice({
        tone: 'error',
        text: validation.errors[0],
      });
      return;
    }

    const systemStock = calculateSystemStock(auditForm.opening, auditForm.purchase, auditForm.used);
    const difference = calculateDifference(auditForm.used, auditForm.actualCount);
    const result = determineDifferenceResult(difference);

    const entryData = {
      id: auditEditingId ?? crypto.randomUUID(),
      date: auditForm.date,
      productName: auditForm.productName.trim(),
      opening: auditForm.opening === '' ? 0 : Number(auditForm.opening),
      purchase: auditForm.purchase === '' ? 0 : Number(auditForm.purchase),
      used: auditForm.used === '' ? 0 : Number(auditForm.used),
      actualCount: auditForm.actualCount === '' ? 0 : Number(auditForm.actualCount),
      systemStock,
      difference,
      result,
      savedAt: new Date().toISOString(),
    };

    setAuditEntries((currentEntries) => {
      if (auditEditingId) {
        return currentEntries.map((entry) =>
          entry.id === auditEditingId ? entryData : entry,
        );
      }

      return [entryData, ...currentEntries];
    });

    const wasEditing = auditEditingId !== null;

    if (wasEditing) {
      resetAuditForm();
      returnToEditOrigin(createAppHistorySnapshot({
        activeTab: 'history',
        historyView: 'audit',
        auditForm: createEmptyAuditForm(),
        auditEditingId: null,
      }));
      setNotice({
        tone: 'success',
        text: 'Audit entry updated successfully.',
      });
      return;
    }

    resetAuditForm();
    setNotice({
      tone: 'success',
      text: 'Audit Entry Saved Successfully!',
    });
  }

  function handleAuditEdit(entry) {
    rememberEditReturn(createAppHistorySnapshot());

    commitAppNavigation(createAppHistorySnapshot({
      activeTab: 'audit',
      auditForm: {
        date: entry.date,
        productName: entry.productName,
        opening: String(entry.opening),
        purchase: String(entry.purchase),
        used: String(entry.used),
        actualCount: String(entry.actualCount),
      },
      auditEditingId: entry.id,
    }));
  }

  function handleAuditDelete(entry) {
    const confirmed = window.confirm(`Delete audit for "${entry.productName}"?`);

    if (!confirmed) {
      return;
    }

    setAuditEntries((currentEntries) =>
      currentEntries.filter((item) => item.id !== entry.id),
    );

    if (auditEditingId === entry.id) {
      resetAuditForm();
    }
  }

  async function handleAuditDownload() {
    if (visibleAuditEntries.length === 0) {
      setNotice({
        tone: 'error',
        text: 'No audit records match the selected filters.',
      });
      return;
    }

    await exportAuditToExcel(visibleAuditEntries, isDownloading, setIsDownloading);
  }

  async function handleEntryDownload() {
    if (isDownloading) {
      return;
    }

    if (visibleBillingEntries.length === 0) {
      setNotice({
        tone: 'error',
        text: 'No billing records match the selected filters.',
      });
      return;
    }

    setIsDownloading(true);

    try {
      const rows = [
        [{ value: 'Billing Report', fontWeight: 'bold' }],
        [{ value: `Date Range: ${getReportDateRangeLabel(visibleBillingEntries)}` }],
        Array.from({ length: 7 }, () => ({ value: '' })),
        [
          { value: 'Date', fontWeight: 'bold' },
          { value: 'Product', fontWeight: 'bold' },
          { value: 'Type', fontWeight: 'bold' },
          { value: 'Quantity', fontWeight: 'bold' },
          { value: 'Price', fontWeight: 'bold' },
          { value: 'GST', fontWeight: 'bold' },
          { value: 'Final Amount', fontWeight: 'bold' },
        ],
        ...visibleBillingEntries.map((entry) => [
          { type: Date, value: createExcelDate(entry.date), format: 'dd/mm/yyyy' },
          { type: String, value: entry.productName },
          { type: String, value: typeLabels[entry.type] },
          { type: Number, value: entry.quantity },
          { type: Number, value: entry.price },
          { type: String, value: `${entry.gst}%` },
          { type: Number, value: entry.finalAmount },
        ]),
        Array.from({ length: 7 }, () => ({ value: '' })),
        [
          {
            value: 'Total',
            fontWeight: 'bold',
          },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          {
            type: Number,
            value: visibleBillingSummary.grandTotal,
            fontWeight: 'bold',
          },
        ],
      ];

      await writeXlsxFile(rows, {
        sheet: 'Billing Report',
      }).toFile('daily-report.xlsx');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4 pb-24 sm:px-5 sm:pb-24">
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/easy-hisab-icon.png"
              alt="Easy Hisab logo"
              className="h-10 w-10 rounded-xl border border-stone-200 bg-white object-contain"
              loading="lazy"
            />
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900">Stock & Price Ledger</h1>
              <p className="mt-1 text-sm text-stone-600">Smart Tracking for Modern Growth</p>
            </div>
          </div>
        </header>

        {notice?.text ? (
          <div
            className={`pointer-events-none fixed inset-x-0 bottom-16 z-50 px-4 sm:bottom-16 sm:px-5 ${
              notice.tone === 'error' ? 'text-rose-900' : 'text-emerald-900'
            }`}
            role="status"
          >
            <div
              className={`mx-auto w-full max-w-md rounded-xl px-4 py-3 text-base font-semibold shadow-lg ring-1 ${
                notice.tone === 'error'
                  ? 'border border-rose-200 bg-rose-50 ring-rose-200'
                  : 'border border-emerald-200 bg-emerald-50 ring-emerald-200'
              }`}
            >
              {notice.text}
            </div>
          </div>
        ) : null}

        <div className="pb-6">
          {activeTab === 'billing' ? (
            <DailyEntryForm
              form={dailyForm}
              isEditing={editingEntryId !== null}
              onChange={handleDailyChange}
              onClearField={handleDailyFieldClear}
              onSubmit={handleDailySubmit}
              onCancel={() => {
                resetDailyForm();
                returnToEditOrigin(createAppHistorySnapshot({
                  activeTab: 'history',
                  historyView: 'billing',
                  dailyForm: createEmptyDailyForm(),
                  editingEntryId: null,
                }));
              }}
            />
          ) : null}

          {activeTab === 'audit' ? (
            <StockAuditForm
              form={auditForm}
              isEditing={auditEditingId !== null}
              onChange={handleAuditChange}
              onClearField={handleAuditFieldClear}
              onSubmit={handleAuditSubmit}
              onCancel={() => {
                resetAuditForm();
                returnToEditOrigin(createAppHistorySnapshot({
                  activeTab: 'history',
                  historyView: 'audit',
                  auditForm: createEmptyAuditForm(),
                  auditEditingId: null,
                }));
              }}
            />
          ) : null}

          {activeTab === 'history' ? (
            <HistoryTabSwitch
              historyView={historyView}
              onHistoryViewChange={handleHistoryViewChange}
              // Billing records
              billingEntries={filteredDailyEntries}
              billingVisibleEntries={visibleBillingEntries}
              billingTotalEntriesCount={dailyEntries.length}
              billingSearchValue={entrySearchValue}
              billingFilterFromDate={entryFilterFromDate}
              billingFilterToDate={entryFilterToDate}
              billingTypeFilter={entryTypeFilter}
              onBillingSearchChange={(event) => setEntrySearchValue(event.target.value)}
              onBillingFilterFromDateChange={(event) => setEntryFilterFromDate(event.target.value)}
              onBillingFilterToDateChange={(event) => setEntryFilterToDate(event.target.value)}
              onBillingTypeFilterChange={setEntryTypeFilter}
              onBillingClearSearch={() => setEntrySearchValue('')}
              onBillingClearFilterFromDate={() => setEntryFilterFromDate('')}
              onBillingClearFilterToDate={() => setEntryFilterToDate('')}
              onBillingEdit={handleEntryEdit}
              onBillingDelete={handleEntryDelete}
              onBillingDownload={handleEntryDownload}
              billingIsDownloading={isDownloading}
              // Audit records
              auditEntries={filteredAuditEntries}
              auditVisibleEntries={visibleAuditEntries}
              auditTotalEntriesCount={auditEntries.length}
              auditSearchValue={auditSearchValue}
              auditFilterFromDate={auditFilterFromDate}
              auditFilterToDate={auditFilterToDate}
              auditStatusFilter={auditStatusFilter}
              onAuditSearchChange={(event) => setAuditSearchValue(event.target.value)}
              onAuditFilterFromDateChange={(event) => setAuditFilterFromDate(event.target.value)}
              onAuditFilterToDateChange={(event) => setAuditFilterToDate(event.target.value)}
              onAuditStatusFilterChange={setAuditStatusFilter}
              onAuditClearSearch={() => setAuditSearchValue('')}
              onAuditClearFilterFromDate={() => setAuditFilterFromDate('')}
              onAuditClearFilterToDate={() => setAuditFilterToDate('')}
              onAuditEdit={handleAuditEdit}
              onAuditDelete={handleAuditDelete}
              onAuditDownload={handleAuditDownload}
              auditIsDownloading={isDownloading}
            />
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40">
        <nav className="mx-auto grid w-full max-w-md grid-cols-3 gap-1.5 rounded-t-2xl border-x border-t border-stone-200 bg-white p-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition ${
              activeTab === 'billing'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700'
            }`}
            onClick={openBillingTab}
          >
            <span className="text-base">💰</span>
            <span>Billing</span>
          </button>
          <button
            type="button"
            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition ${
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700'
            }`}
            onClick={openAuditTab}
          >
            <span className="text-base">📦</span>
            <span>Stock Check</span>
          </button>
          <button
            type="button"
            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700'
            }`}
            onClick={openHistoryTab}
          >
            <span className="text-base">📋</span>
            <span>History</span>
          </button>
        </nav>
      </div>
    </main>
  );
}

export default App;
