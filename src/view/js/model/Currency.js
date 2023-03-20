import {
    formatValue,
    normalize,
    hasToken,
    __,
} from '../utils.js';
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
        const availFields = ['id', 'name', 'code', 'sign', 'flags'];

        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Returns formatted name of currency
     */
    formatName() {
        return hasToken(this.name)
            ? `${this.code} – ${__(this.name)}`
            : this.code;
    }

    /**
     * Returns value formatted according to currency rules.
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
