import { ListModel } from './ListModel.js';
import { Currency } from './Currency.js';

/**
 * Currencies list class
 * @param {object[]} props - array of currencies
 */
export class CurrencyListModel extends ListModel {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Currency(obj);
    }

    /**
     * Format value with specified currency
     * @param {number} value - float value to format
     * @param {number} currency_id - identifier of required currency
     */
    formatCurrency(value, currencyId) {
        const item = this.getItem(currencyId);
        if (!item) {
            return null;
        }

        return item.formatValue(value);
    }

    /**
     * Search for currency with specified name
     * @param {string} name - currency name
     */
    findByName(name) {
        return this.find((item) => item.name === name);
    }

    /**
     * Search for currency with specified code
     * @param {string} code - currency code
     */
    findByCode(code) {
        if (typeof code !== 'string' || code.length === 0) {
            return null;
        }

        const uCode = code.toUpperCase();
        return this.find((item) => item.code.toUpperCase() === uCode);
    }
}
