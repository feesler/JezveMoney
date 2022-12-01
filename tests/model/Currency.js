import { assert } from 'jezve-test';
import { normalize, formatValue } from '../common.js';

/** Currency object */
export class Currency {
    constructor(props) {
        assert.isObject(props, 'Invalid currency props');

        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }

    /** Format specified value using rules of currency */
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
