import { fixFloat } from '@jezvejs/number';

/* Decimal values precision */
export const DEFAULT_PRECISION = 2;
export const EXCHANGE_PRECISION = 4;
export const MAX_PRECISION = 8;

/** Convert string to amount value */
export const amountFix = (value, thSep = ' ') => {
    if (typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)) {
        return value;
    }
    if (typeof value !== 'string') {
        return null;
    }

    // Trim leading and trailing spaces
    let res = value.trim();
    // Cut thousands separator
    if (thSep.length > 0) {
        const search = new RegExp(`(\\d)${thSep}(\\d)`, 'g');
        res = res.replaceAll(search, '$1$2');
    }

    return parseFloat(fixFloat(res));
};

/**
 * Correct calculated value
 * @param {string|Number} val - value to correct
 * @param {Number} prec - precision
 */
export const correct = (val, prec = DEFAULT_PRECISION) => (
    parseFloat(parseFloat(val).toFixed(prec))
);

/**
 * Correct calculated exchange rate value
 * @param {string|Number} val - exchange rate value
 */
export const correctExch = (val) => correct(val, EXCHANGE_PRECISION);

/**
 * Normalize monetary value from string
 * @param {string|Number} val - value to normalize
 * @param {Number} prec - precision of result decimal
 */
export const normalize = (val, prec = DEFAULT_PRECISION) => correct(fixFloat(val), prec);

/**
 * Normalize exchange rate value from string
 * @param {string|Number} val - exchange rate value
 */
export const normalizeExch = (val) => Math.abs(normalize(val, EXCHANGE_PRECISION));

/**
 * Check value is valid
 * @param {string|Number} val - value to check
 */
export const isValidValue = (val) => (
    typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val)))
);

/** Format decimal value */
export const formatValue = (val) => val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
