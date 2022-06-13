import { assert } from 'jezve-test';
import { normalize, formatValue } from '../common.js';
import { api } from './api.js';

/** Currency object */
export class Currency {
    constructor(props) {
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

    static currencies = null;

    static async getList() {
        if (!Array.isArray(this.currencies)) {
            const apiResult = await api.currency.list();
            this.currencies = apiResult.map((item) => new Currency(item));
        }

        return this.currencies;
    }

    static async init() {
        await this.getList();
    }

    // Return currency object for specified id
    static getById(currId) {
        assert(this.currencies, 'List of currencies not initialized');
        const id = parseInt(currId, 10);
        if (Number.isNaN(id)) {
            return null;
        }

        const currObj = this.currencies.find((item) => item.id === id);
        if (!currObj) {
            return null;
        }

        return currObj;
    }

    static findByName(name) {
        assert(this.currencies, 'List of currencies not initialized');

        const qName = name.toUpperCase();
        const currObj = this.currencies.find((item) => item.name.toUpperCase() === qName);
        if (!currObj) {
            return null;
        }

        return currObj;
    }

    static getItemsByNames(names) {
        const itemNames = Array.isArray(names) ? names : [names];

        return itemNames.map((name) => {
            const item = this.findByName(name);
            assert(item, `Currency '${name}' not found`);

            return item.id;
        });
    }

    /** Format curency value without access to the instance of class */
    static format(currId, val) {
        assert(this.currencies, 'List of currencies not initialized');

        const currObj = this.currencies.find((item) => item.id === currId);
        assert(currObj, `Currency ${currId} not found`);

        return currObj.format(val);
    }
}
