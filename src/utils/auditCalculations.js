/**
 * Audit Calculations Utilities
 * Provides calculation functions for internal stock audit module
 */

function toAuditNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

export function roundAuditValue(value) {
  return Math.round((toAuditNumber(value) + Number.EPSILON) * 1000) / 1000;
}

export function formatAuditValue(value) {
  return roundAuditValue(value).toFixed(3);
}

/**
 * Calculate total amount (opening + purchase)
 * Formula: Opening Amount + Purchase Amount
 * @param {number} opening - Opening amount
 * @param {number} purchase - Purchase amount
 * @returns {number} Total amount
 */
export const calculateTotalAmount = (opening, purchase) => {
  return roundAuditValue(toAuditNumber(opening) + toAuditNumber(purchase));
};

/**
 * Calculate closing amount (total - used)
 * Formula: Total Amount - Used Amount
 * @param {number} total - Total amount
 * @param {number} used - Used amount
 * @returns {number} Closing amount
 */
export const calculateClosingAmount = (total, used) => {
  return roundAuditValue(toAuditNumber(total) - toAuditNumber(used));
};

/**
 * Calculate system/expected stock
 * Formula: (Opening Amount + Purchase Amount) - Used Amount
 * @param {number} opening - Opening amount
 * @param {number} purchase - Purchase amount
 * @param {number} used - Used amount
 * @returns {number} System stock
 */
export const calculateSystemStock = (opening, purchase, used) => {
  return roundAuditValue(toAuditNumber(opening) + toAuditNumber(purchase) - toAuditNumber(used));
};

/**
 * Calculate difference between used amount and slip amount
 * Formula: Used Amount - Slip Amount
 * @param {number} used - Used amount
 * @param {number} slipAmount - Slip amount (actual count)
 * @returns {number} Difference
 */
export const calculateDifference = (used, slipAmount) => {
  return roundAuditValue(toAuditNumber(used) - toAuditNumber(slipAmount));
};

/**
 * Determine the result of the difference
 * @param {number} difference - Difference value
 * @returns {string} 'short' | 'extra' | 'matched'
 */
export const determineDifferenceResult = (difference) => {
  const diff = roundAuditValue(difference);
  if (diff > 0) return 'short'; // Used Amount is more than Slip Amount, so stock is short
  if (diff < 0) return 'extra'; // Slip Amount is more than Used Amount, so there's extra stock
  return 'matched';
};


/**
 * Validate audit form data
 * @param {object} formData - Form data object with opening, purchase, used, actualCount, productName
 * @returns {object} { isValid: boolean, errors: array }
 */
export const validateAuditForm = (formData) => {
  const errors = [];

  if (!formData.productName || formData.productName.trim() === '') {
    errors.push('Product name is required');
  }

  if (formData.opening === '' || formData.opening === null || formData.opening === undefined) {
    errors.push('Opening amount is required');
  } else if (Number.isNaN(Number(formData.opening)) || Number(formData.opening) < 0) {
    errors.push('Opening amount must be a valid positive number');
  }

  if (formData.purchase === '' || formData.purchase === null || formData.purchase === undefined) {
    errors.push('Purchase amount is required');
  } else if (Number.isNaN(Number(formData.purchase)) || Number(formData.purchase) < 0) {
    errors.push('Purchase amount must be a valid positive number');
  }

  if (formData.used === '' || formData.used === null || formData.used === undefined) {
    errors.push('Used amount is required');
  } else if (Number.isNaN(Number(formData.used)) || Number(formData.used) < 0) {
    errors.push('Used amount must be a valid positive number');
  }

  if (formData.actualCount === '' || formData.actualCount === null || formData.actualCount === undefined) {
    errors.push('Slip amount is required');
  } else if (Number.isNaN(Number(formData.actualCount)) || Number(formData.actualCount) < 0) {
    errors.push('Slip amount must be a valid positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
