import { hasFlag } from 'jezvejs';
import { hasToken, __ } from '../utils/utils.js';
import { normalize } from '../utils/decimal.js';
import { App } from '../Application/App.js';
import { ListItem } from './ListItem.js';

export const CURRENCY_SIGN_BEFORE_VALUE = 0x01;
export const CURRENCY_FORMAT_TRAILING_ZEROS = 0x02;

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
        const availFields = ['id', 'name', 'code', 'sign', 'precision', 'flags'];

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
        const options = {
            ...App.decimalFormatOptions,
        };

        const nval = normalize(value, this.precision);
        if (Math.floor(nval) !== nval && hasFlag(this.flags, CURRENCY_FORMAT_TRAILING_ZEROS)) {
            options.minimumFractionDigits = this.precision;
            options.maximumFractionDigits = this.precision;
        }

        const fmtVal = App.formatNumber(nval, { options });
        return (hasFlag(this.flags, CURRENCY_SIGN_BEFORE_VALUE))
            ? `${this.sign} ${fmtVal}`
            : `${fmtVal} ${this.sign}`;
    }
}
