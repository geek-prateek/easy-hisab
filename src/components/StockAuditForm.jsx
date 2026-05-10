import { useMemo } from 'react';
import ClearableField from './ClearableField';
import {
  calculateDifference,
  determineDifferenceResult,
  calculateTotalAmount,
  calculateClosingAmount,
  formatAuditValue,
} from '../utils/auditCalculations';

function StockAuditForm({
  form,
  isEditing,
  onChange,
  onClearField,
  onSubmit,
  onCancel,
}) {
  const totalAmount = useMemo(
    () => calculateTotalAmount(form.opening, form.purchase),
    [form.opening, form.purchase],
  );

  const closingAmount = useMemo(
    () => calculateClosingAmount(totalAmount, form.used),
    [totalAmount, form.used],
  );

  const difference = useMemo(
    () => calculateDifference(form.used, form.actualCount),
    [form.used, form.actualCount],
  );

  const result = useMemo(
    () => determineDifferenceResult(difference),
    [difference],
  );

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="field-label">Date</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={onChange}
          className="text-input"
        />
      </div>

      <div>
        <label className="field-label">Product Name</label>
        <ClearableField
          hasValue={form.productName !== ''}
          onClear={() => onClearField('productName')}
        >
          <input
            type="text"
            name="productName"
            value={form.productName}
            onChange={onChange}
            placeholder="Enter product name"
            className="text-input clearable-input"
            inputMode="text"
          />
        </ClearableField>
      </div>

      <div>
        <label className="field-label">Opening Stock</label>
        <ClearableField
          hasValue={form.opening !== ''}
          onClear={() => onClearField('opening')}
        >
          <input
            type="text"
            name="opening"
            value={form.opening}
            onChange={onChange}
            placeholder="0.00"
            className="text-input"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            autoComplete="off"
          />
        </ClearableField>
      </div>

      <div>
        <label className="field-label">Purchase Stock</label>
        <ClearableField
          hasValue={form.purchase !== ''}
          onClear={() => onClearField('purchase')}
        >
          <input
            type="text"
            name="purchase"
            value={form.purchase}
            onChange={onChange}
            placeholder="0.00"
            className="text-input"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            autoComplete="off"
          />
        </ClearableField>
      </div>

      <div className="system-stock-box">
        <div className="field-label">Total Stock (Opening + Purchase)</div>
        <div className="text-2xl font-bold text-stone-900">{formatAuditValue(totalAmount)}</div>
        <div className="mt-1 text-xs text-stone-500">
          ({form.opening} + {form.purchase})
        </div>
      </div>

      <div>
        <label className="field-label">Issued Stock</label>
        <ClearableField
          hasValue={form.used !== ''}
          onClear={() => onClearField('used')}
        >
          <input
            type="text"
            name="used"
            value={form.used}
            onChange={onChange}
            placeholder="0.00"
            className="text-input"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            autoComplete="off"
          />
        </ClearableField>
      </div>

      <div className="system-stock-box">
        <div className="field-label">Closing Stock (Total - Issued)</div>
        <div className="text-2xl font-bold text-stone-900">{formatAuditValue(closingAmount)}</div>
        <div className="mt-1 text-xs text-stone-500">
          ({formatAuditValue(totalAmount)} - {form.used})
        </div>
      </div>

      <div>
        <label className="field-label">Slip Stock</label>
        <ClearableField
          hasValue={form.actualCount !== ''}
          onClear={() => onClearField('actualCount')}
        >
          <input
            type="text"
            name="actualCount"
            value={form.actualCount}
            onChange={onChange}
            placeholder="0.00"
            className="text-input"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            autoComplete="off"
          />
        </ClearableField>
      </div>

      {form.actualCount !== '' && (
        <div className={`audit-result-card ${
          result === 'short'
            ? 'audit-short-card'
            : result === 'matched'
              ? 'audit-matched-card'
              : 'audit-extra-card'
        }`}>
          <div className="text-center">
            <div className="text-sm font-semibold text-stone-600">Difference (Issued - Slip)</div>
            <div className="mt-2 text-3xl font-bold">
              {result === 'short' && `Short: ${formatAuditValue(Math.abs(difference))}`}
              {result === 'extra' && `Extra: ${formatAuditValue(Math.abs(difference))}`}
              {result === 'matched' && 'Matched'}
            </div>
            <div className="mt-1 text-xs text-stone-500">
              ({form.used} - {form.actualCount})
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="primary-button"
        >
          {isEditing ? 'Update Entry' : 'Save Entry'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="h-14 flex-1 rounded-xl bg-stone-200 text-sm font-bold text-stone-700 transition hover:bg-stone-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default StockAuditForm;
