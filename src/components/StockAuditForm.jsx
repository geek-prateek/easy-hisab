import { useMemo } from 'react';
import ClearableField from './ClearableField';
import {
  calculateDifference,
  determineDifferenceResult,
  calculateTotalAmount,
  calculateClosingAmount,
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
      {/* Date */}
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

      {/* Product Name */}
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

      {/* Opening Amount */}
      <div>
        <label className="field-label">Opening Amount</label>
        <ClearableField
          hasValue={form.opening !== ''}
          onClear={() => onClearField('opening')}
        >
          <input
            type="text"
            name="opening"
            value={form.opening}
            onChange={onChange}
            placeholder="0"
            className="text-input"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
          />
        </ClearableField>
      </div>

      {/* Purchase Amount */}
      <div>
        <label className="field-label">Purchase Amount</label>
        <ClearableField
          hasValue={form.purchase !== ''}
          onClear={() => onClearField('purchase')}
        >
          <input
            type="text"
            name="purchase"
            value={form.purchase}
            onChange={onChange}
            placeholder="0"
            className="text-input"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
          />
        </ClearableField>
      </div>

      {/* Total Amount (Read-only) */}
      <div className="system-stock-box">
        <div className="field-label">Total Amount (Opening + Purchase)</div>
        <div className="text-2xl font-bold text-stone-900">{totalAmount}</div>
        <div className="mt-1 text-xs text-stone-500">
          ({form.opening} + {form.purchase})
        </div>
      </div>

      {/* Used Amount */}
      <div>
        <label className="field-label">Used Amount</label>
        <ClearableField
          hasValue={form.used !== ''}
          onClear={() => onClearField('used')}
        >
          <input
            type="text"
            name="used"
            value={form.used}
            onChange={onChange}
            placeholder="0"
            className="text-input"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
          />
        </ClearableField>
      </div>

      {/* Closing Amount (Read-only) */}
      <div className="system-stock-box">
        <div className="field-label">Closing Amount (Total - Used)</div>
        <div className="text-2xl font-bold text-stone-900">{closingAmount}</div>
        <div className="mt-1 text-xs text-stone-500">
          ({totalAmount} - {form.used})
        </div>
      </div>

      {/* Slip Amount */}
      <div>
        <label className="field-label">Slip Amount</label>
        <ClearableField
          hasValue={form.actualCount !== ''}
          onClear={() => onClearField('actualCount')}
        >
          <input
            type="text"
            name="actualCount"
            value={form.actualCount}
            onChange={onChange}
            placeholder="0"
            className="text-input"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
          />
        </ClearableField>
      </div>

      {/* Difference Result Card - Only show when slip amount is entered */}
      {form.actualCount !== '' && (
        <div className={`audit-result-card ${
          result === 'short'
            ? 'audit-short-card'
            : result === 'matched'
              ? 'audit-matched-card'
              : 'audit-extra-card'
        }`}>
          <div className="text-center">
            <div className="text-sm font-semibold text-stone-600">Difference</div>
            <div className="mt-2 text-3xl font-bold">
              {result === 'short' && `🔴 Short: ${Math.abs(difference)}`}
              {result === 'extra' && `🟢 Extra: ${difference}`}
              {result === 'matched' && '✅ Matched'}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
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
