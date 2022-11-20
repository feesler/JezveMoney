import { formatValue, normalize } from '../utils.js';
import { ListItem } from './ListItem.js';

/**
 * Currency class
 * @param {object} props - properties of currency object
 */
export class Currency extends ListItem {
    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        const availFields = ['id', 'name', 'sign', 'flags'];

        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Format specified value using rules of currency
     * @param {*} value - float value to format
     */
    formatValue(value) {
        let nval = normalize(value);
        if (Math.floor(nval) !== nval) {
            nval = nval.toFixed(2);
        }

        const fmtVal = formatValue(nval);
        if (this.flags) {
            return `${this.sign} ${fmtVal}`;
        }

        return `${fmtVal} ${this.sign}`;
    }
}
