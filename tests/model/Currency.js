import { assert, hasFlag } from 'jezve-test';
import { normalize, formatValue } from '../common.js';
import { hasToken, __ } from './locale.js';

const CURRENCY_SIGN_BEFORE_VALUE = 0x01;
const CURRENCY_FORMAT_TRAILING_ZEROS = 0x02;

/** Currency object */
export class Currency {
    constructor(props) {
        assert.isObject(props, 'Invalid currency props');

        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }

    /**
     * Returns formatted name of currency
     */
    formatName(locale = 'en') {
        return hasToken(this.name)
            ? `${this.code} – ${__(this.name, locale)}`
            : this.code;
    }

    /**
     * Returns value formatted according to currency rules.
     * @param {*} value - float value to format
     */
    format(val) {
        let nval = normalize(val, this.precision);
        if (Math.floor(nval) !== nval && hasFlag(this.flags, CURRENCY_FORMAT_TRAILING_ZEROS)) {
            nval = nval.toFixed(2);
        }

        const fmtVal = formatValue(nval);
        if (hasFlag(this.flags, CURRENCY_SIGN_BEFORE_VALUE)) {
            return `${this.sign} ${fmtVal}`;
        }

        return `${fmtVal} ${this.sign}`;
    }
}
