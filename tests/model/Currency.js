import { assert } from 'jezve-test';
import { normalize, formatValue } from '../common.js';
import { hasToken, __ } from './locale.js';

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
        let nval = normalize(val);
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
