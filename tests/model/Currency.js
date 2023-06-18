import { assert, hasFlag } from 'jezve-test';
import { normalize } from '../common.js';
import { hasToken, __ } from './locale.js';
import { App } from '../Application.js';

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
        const token = `currencies.byCode.${this.code}`;
        return hasToken(token)
            ? `${this.code} – ${__(token, locale)}`
            : this.code;
    }

    /**
     * Returns value formatted according to currency rules.
     * @param {*} value - float value to format
     */
    format(val) {
        const options = {
            ...App.decimalFormatOptions,
        };

        const nval = normalize(val, this.precision);
        if (Math.floor(nval) !== nval && hasFlag(this.flags, CURRENCY_FORMAT_TRAILING_ZEROS)) {
            options.minimumFractionDigits = this.precision;
            options.maximumFractionDigits = this.precision;
        }

        const fmtVal = App.formatNumber(nval, { options });
        if (hasFlag(this.flags, CURRENCY_SIGN_BEFORE_VALUE)) {
            return `${this.sign} ${fmtVal}`;
        }

        return `${fmtVal} ${this.sign}`;
    }
}
